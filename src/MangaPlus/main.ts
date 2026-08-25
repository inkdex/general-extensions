/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  ContentRating,
  DiscoverSectionType,
  type Chapter,
  type ChapterDetails,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type Form,
  type Metadata,
  type PagedResults,
  type Request,
  type Response,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";

import {
  decodeMangaPlusResponse,
  extractFeaturedTitles,
  extractPopularTitles,
  getChapterLanguageCode,
  getLanguageSuffix,
  langPopup,
  Language,
  TitleDetailView,
  type MangaPlusMetadata,
  type MangaPlusResponse,
} from "./MangaPlusHelper";
import {
  getLanguages,
  getResolution,
  getSplitImages,
  MangaPlusSettingForm,
} from "./MangaPlusSettings";
import type MangaPlusConfig from "./pbconfig";

const BASE_URL = "https://mangaplus.shueisha.co.jp";
const API_URL = "https://jumpg-webapi.tokyo-cdn.com/api";
const DEFAULT_LANGUAGE = "eng";

const langCode = Language.ENGLISH;

function formatTitleDisplay(
  title: { name: string; language?: Language },
  showLanguageSuffix: boolean,
): string {
  if (!showLanguageSuffix) {
    return title.name;
  }

  const suffix = getLanguageSuffix(title.language);
  return suffix ? `${title.name} ${suffix}` : title.name;
}
export class MangaPlusExtension implements ExtensionImpl<typeof MangaPlusConfig> {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });
  private readonly chapterAccessibilityCache = new Map<number, boolean>();

  private getSessionToken(): string {
    const storedToken = Application.getState("sessionToken") as string | undefined;
    if (storedToken) return storedToken;
    const sessionToken = crypto.randomUUID();
    Application.setState(sessionToken, "sessionToken");
    return sessionToken;
  }

  async initialise(): Promise<void> {
    this.registerInterceptors();
  }

  private parseResponse(response: ArrayBuffer): MangaPlusResponse {
    return decodeMangaPlusResponse(response);
  }

  private isValidImageUrl(url: string | undefined): url is string {
    if (!url) return false;
    const value = url.trim();
    return /^https?:\/\/.+/i.test(value);
  }

  private serializeMangaPageUrl(imageUrl: string, encryptionKey?: string): string {
    if (!encryptionKey) {
      return imageUrl;
    }
    return `${imageUrl}#${encryptionKey}`;
  }

  private getMangaPageMeta(url: string): { encryptionKey?: string } {
    const fragmentIndex = url.lastIndexOf("#");
    if (fragmentIndex === -1) {
      return {};
    }

    const fragment = url.substring(fragmentIndex + 1);
    if (!fragment) {
      return {};
    }

    return {
      encryptionKey: fragment,
    };
  }

  private async isChapterAccessible(chapterId: number): Promise<boolean> {
    const cached = this.chapterAccessibilityCache.get(chapterId);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const request = {
        url: `${API_URL}/manga_viewer_v3?chapter_id=${chapterId}&split=no&img_quality=low&clang=${DEFAULT_LANGUAGE}`,
        method: "GET",
      };

      const response = (await Application.scheduleRequest(request))[1];
      const result = this.parseResponse(response);
      const pages = result.success?.mangaViewer?.pages ?? [];
      const accessible = result.success !== undefined && pages.length > 0;

      this.chapterAccessibilityCache.set(chapterId, accessible);
      return accessible;
    } catch {
      this.chapterAccessibilityCache.set(chapterId, false);
      return false;
    }
  }

  private async filterAccessibleChapters<T extends { chapterId: number }>(
    chapters: T[],
    concurrency = 6,
  ): Promise<T[]> {
    const workers = Array.from(
      { length: Math.min(concurrency, chapters.length) },
      async (_value, index) => {
        const kept: T[] = [];
        for (
          let chapterIndex = index;
          chapterIndex < chapters.length;
          chapterIndex += concurrency
        ) {
          const chapter = chapters[chapterIndex];
          if (!chapter) continue;

          const accessible = await this.isChapterAccessible(chapter.chapterId);
          if (accessible) {
            kept.push(chapter);
          }
        }
        return kept;
      },
    );

    const keptByWorker = await Promise.all(workers);
    const keptIds = new Set(keptByWorker.flat().map((chapter) => chapter.chapterId));
    return chapters.filter((chapter) => keptIds.has(chapter.chapterId));
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const request = {
      url: `${API_URL}/title_detailV3?title_id=${mangaId}&clang=${DEFAULT_LANGUAGE}`,
      method: "GET",
    };

    try {
      const response = (await Application.scheduleRequest(request))[1];
      const result = TitleDetailView.fromResponse(this.parseResponse(response));
      return result.toSourceManga();
    } catch {
      return {
        mangaId,
        mangaInfo: {
          thumbnailUrl: "",
          synopsis: "",
          primaryTitle: mangaId,
          secondaryTitles: [],
          contentRating: ContentRating.EVERYONE,
          status: "Unknown",
          author: "",
          artist: "",
          tagGroups: [],
        },
      };
    }
  }

  private async getThumbnailUrl(mangaId: string): Promise<string> {
    const request = {
      url: `${API_URL}/title_detailV3?title_id=${mangaId}&clang=${DEFAULT_LANGUAGE}`,
      method: "GET",
    };

    try {
      const response = (await Application.scheduleRequest(request))[1];
      const result = TitleDetailView.fromResponse(this.parseResponse(response));
      return result.title?.portraitImageUrl ?? "";
    } catch {
      return "";
    }
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const request = {
      url: `${API_URL}/title_detailV3?title_id=${sourceManga.mangaId}&clang=${DEFAULT_LANGUAGE}`,
      method: "GET",
    };

    try {
      const response = (await Application.scheduleRequest(request))[1];
      const result = TitleDetailView.fromResponse(this.parseResponse(response));
      const chapterLanguageCode = getChapterLanguageCode(result.title?.language);
      console.log(
        `[MangaPlus] chapters manga=${sourceManga.mangaId} titleLang=${result.title?.language ?? "unknown"} chapterLang=${chapterLanguageCode}`,
      );

      const candidateChapters = [
        ...(result.firstChapterList ?? []),
        ...(result.lastChapterList ?? []),
      ]
        .reverse()
        .filter((chapter) => !chapter.isExpired);

      const accessibleChapters = await this.filterAccessibleChapters(candidateChapters);

      if (accessibleChapters.length !== candidateChapters.length) {
        console.log(
          `[MangaPlus] filtered inaccessible chapters manga=${sourceManga.mangaId} kept=${accessibleChapters.length} total=${candidateChapters.length}`,
        );
      }

      return accessibleChapters.map((chapter) =>
        chapter.toSChapter(sourceManga, chapterLanguageCode),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[MangaPlus] getChapters failed manga=${sourceManga.mangaId} error=${message}`);
      return [];
    }
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    console.log(
      `[MangaPlus] chapter details request chapter=${chapter.chapterId} manga=${chapter.sourceManga.mangaId} lang=${chapter.langCode}`,
    );

    const request = {
      url: `${API_URL}/manga_viewer_v3?chapter_id=${chapter.chapterId}&split=${getSplitImages()}&img_quality=${getResolution()}&clang=${DEFAULT_LANGUAGE}`,
      method: "GET",
    };

    try {
      const chapterIdNumber = Number.parseInt(chapter.chapterId, 10);
      const canCheckAccessibility = Number.isFinite(chapterIdNumber);

      if (canCheckAccessibility && !this.chapterAccessibilityCache.get(chapterIdNumber)) {
        const accessible = await this.isChapterAccessible(chapterIdNumber);
        if (!accessible) {
          throw new Error(
            "This chapter is unavailable in MangaPlus (Deluxe tier or region restriction).",
          );
        }
      }

      const response = (await Application.scheduleRequest(request))[1];
      const result = this.parseResponse(response);

      if (result.success === undefined) {
        if (canCheckAccessibility) {
          this.chapterAccessibilityCache.set(chapterIdNumber, false);
        }
        const debugInfo = (result.error as { debugInfo?: string } | undefined)?.debugInfo ?? "none";
        console.log(
          `[MangaPlus] chapter details error chapter=${chapter.chapterId} debug=${debugInfo}`,
        );
        throw new Error(langPopup(result.error, Language.ENGLISH)?.body ?? "Unknown error");
      }

      if (canCheckAccessibility) {
        this.chapterAccessibilityCache.set(chapterIdNumber, true);
      }

      Application.setState(result.success?.mangaViewer?.vwToken, "mangaPlusVwToken");

      const rawPages = (result.success.mangaViewer?.pages ?? [])
        .map((page) => page?.mangaPage)
        .filter((page): page is NonNullable<typeof page> => Boolean(page));

      const pages = rawPages
        .map((page) => this.serializeMangaPageUrl(page.imageUrl, page.encryptionKey))
        .filter((url) => this.isValidImageUrl(url));

      if (pages.length !== rawPages.length) {
        console.log(
          `[MangaPlus] dropped invalid page URLs chapter=${chapter.chapterId} kept=${pages.length} total=${rawPages.length}`,
        );
      }

      console.log(
        `[MangaPlus] chapter details success chapter=${chapter.chapterId} pages=${pages.length} vwTokenLen=${result.success?.mangaViewer?.vwToken?.length ?? 0}`,
      );

      return {
        id: chapter.chapterId,
        mangaId: chapter.sourceManga.mangaId,
        pages,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `[MangaPlus] getChapterDetails failed chapter=${chapter.chapterId} error=${message}`,
      );
      throw error instanceof Error
        ? error
        : new Error(message || "This chapter is unavailable from MangaPlus.");
    }
  }

  async getFeaturedTitles(): Promise<PagedResults<SearchResultItem>> {
    try {
      const languages = getLanguages();
      const showLanguageSuffix = languages.length > 1;
      let results: ReturnType<typeof extractFeaturedTitles> = [];

      const featuredRequest = {
        url: `${API_URL}/featuredV2?lang=${DEFAULT_LANGUAGE}&clang=${DEFAULT_LANGUAGE}`,
        method: "GET",
      };

      const featuredResponse = (await Application.scheduleRequest(featuredRequest))[1];
      const featuredResult = this.parseResponse(featuredResponse);

      if (featuredResult.success !== undefined) {
        results = extractFeaturedTitles(featuredResult, languages);
      }

      if (results.length === 0) {
        const fallbackRequest = {
          url: `${API_URL}/web/web_homeV4?lang=${DEFAULT_LANGUAGE}&clang=${DEFAULT_LANGUAGE}`,
          method: "GET",
        };
        const fallbackResponse = (await Application.scheduleRequest(fallbackRequest))[1];
        const fallbackResult = this.parseResponse(fallbackResponse);
        if (fallbackResult.success !== undefined) {
          results = (fallbackResult.success.webHomeViewV4?.groups ?? [])
            .flatMap((group) => group.titleGroups)
            .flatMap((group) => group.titles)
            .map((entry) => entry.title)
            .filter((title) => languages.includes(title.language ?? Language.ENGLISH));
        }
      }

      const titles: SearchResultItem[] = [];

      for (const item of results ?? []) {
        const mangaId = item.titleId.toString();
        const title = formatTitleDisplay(item, showLanguageSuffix);
        const author = item.author;
        const image = item.portraitImageUrl;

        if (!mangaId || !title || !this.isValidImageUrl(image)) continue;

        titles.push({
          mangaId: mangaId,
          title: title,
          subtitle: author,
          imageUrl: image,
          contentRating: ContentRating.EVERYONE,
        });
      }

      return { items: titles };
    } catch {
      return { items: [] };
    }
  }

  async getPopularTitles(): Promise<PagedResults<SearchResultItem>> {
    try {
      const languages = getLanguages();
      const showLanguageSuffix = languages.length > 1;
      let results: ReturnType<typeof extractPopularTitles> = [];

      const rankingRequest = {
        url: `${API_URL}/title_list/rankingV2?lang=${DEFAULT_LANGUAGE}&type=hottest&clang=${DEFAULT_LANGUAGE}`,
        method: "GET",
      };

      const rankingResponse = (await Application.scheduleRequest(rankingRequest))[1];
      const rankingResult = this.parseResponse(rankingResponse);
      if (rankingResult.success !== undefined) {
        results = extractPopularTitles(rankingResult, languages);
      }

      if (results.length === 0) {
        const fallbackRequest = {
          url: `${API_URL}/web/web_homeV4?lang=${DEFAULT_LANGUAGE}&clang=${DEFAULT_LANGUAGE}`,
          method: "GET",
        };
        const fallbackResponse = (await Application.scheduleRequest(fallbackRequest))[1];
        const fallbackResult = this.parseResponse(fallbackResponse);
        if (fallbackResult.success !== undefined) {
          results = (fallbackResult.success.webHomeViewV4?.groups ?? [])
            .flatMap((group) => group.titleGroups)
            .flatMap((group) => group.titles)
            .map((entry) => entry.title)
            .filter((title) => languages.includes(title.language ?? Language.ENGLISH))
            .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
        }
      }

      const titles: SearchResultItem[] = [];

      for (const item of results ?? []) {
        const mangaId = item.titleId.toString();
        const title = formatTitleDisplay(item, showLanguageSuffix);
        const author = item.author;
        const image = item.portraitImageUrl;

        if (!mangaId || !title || !this.isValidImageUrl(image)) continue;

        titles.push({
          mangaId: mangaId,
          title: title,
          subtitle: author,
          imageUrl: image,
          contentRating: ContentRating.EVERYONE,
        });
      }

      return { items: titles };
    } catch {
      return { items: [] };
    }
  }

  async getLatestUpdates(): Promise<PagedResults<SearchResultItem>> {
    const request = {
      url: `${API_URL}/web/web_homeV4?lang=${DEFAULT_LANGUAGE}&clang=${DEFAULT_LANGUAGE}`,
      method: "GET",
    };

    try {
      const response = (await Application.scheduleRequest(request))[1];
      const result = this.parseResponse(response);

      if (result.success === undefined) {
        throw new Error(langPopup(result.error, langCode)?.body ?? "Unknown error");
      }

      const languages = getLanguages();
      const showLanguageSuffix = languages.length > 1;

      const results = result.success.webHomeViewV4?.groups
        .flatMap((ex) => ex.titleGroups)
        .flatMap((ex) => ex.titles)
        .map((title) => title.title)
        .filter((title) => languages.includes(title.language ?? Language.ENGLISH));

      const titles: SearchResultItem[] = [];

      for (const item of results ?? []) {
        const mangaId = item.titleId.toString();
        const title = formatTitleDisplay(item, showLanguageSuffix);
        const author = item.author;
        const image = item.portraitImageUrl;

        if (!mangaId || !title || !this.isValidImageUrl(image)) continue;

        titles.push({
          mangaId: mangaId,
          title: title,
          subtitle: author,
          imageUrl: image,
          contentRating: ContentRating.EVERYONE,
        });
      }

      return { items: titles };
    } catch {
      return { items: [] };
    }
  }

  async getSearchResults(
    query: SearchQuery<Metadata>,
    metadata: MangaPlusMetadata,
  ): Promise<PagedResults<SearchResultItem>> {
    const title = query.title ?? "";
    const request = {
      url: `${API_URL}/title_list/allV2${title ? "?filter=" + encodeURIComponent(title) + `&lang=${DEFAULT_LANGUAGE}&clang=${DEFAULT_LANGUAGE}` : `?lang=${DEFAULT_LANGUAGE}&clang=${DEFAULT_LANGUAGE}`}`,
      method: "GET",
    };

    try {
      const response = (await Application.scheduleRequest(request))[1];
      const result = this.parseResponse(response);

      if (result.success === undefined) {
        throw new Error(langPopup(result.error, Language.ENGLISH)?.body ?? "Unknown error");
      }

      const ltitle = query.title?.toLowerCase() ?? "";
      const languages = getLanguages();
      const showLanguageSuffix = languages.length > 1;

      const results = result.success?.allTitlesViewV2?.AllTitlesGroup.flatMap(
        (group) => group.titles,
      )
        .filter((title) => languages.includes(title.language ?? Language.ENGLISH))
        .filter(
          (title) =>
            title.author?.toLowerCase().includes(ltitle) ||
            title.name.toLowerCase().includes(ltitle),
        );

      const titles: SearchResultItem[] = [];

      for (const item of results ?? []) {
        const mangaId = item.titleId.toString();
        const title = formatTitleDisplay(item, showLanguageSuffix);
        const author = item.author;
        const image = item.portraitImageUrl;

        if (!mangaId || !title || !this.isValidImageUrl(image)) continue;

        titles.push({
          mangaId: mangaId,
          title: title,
          subtitle: author,
          imageUrl: image,
          contentRating: ContentRating.EVERYONE,
        });
      }

      return { items: titles, metadata };
    } catch {
      return { items: [], metadata };
    }
  }

  // Utility
  private decodeXoRCipher(buffer: Uint8Array, encryptionKey: string) {
    const key = encryptionKey.match(/../g)?.map((byte) => parseInt(byte, 16)) ?? [];

    return buffer.map((byte, index) => byte ^ (key[index % key.length] ?? 0));
  }

  registerInterceptors() {
    this.globalRateLimiter.registerInterceptor();
    Application.registerInterceptor(
      "mangaPlusInterceptor",
      Application.Selector(this as MangaPlusExtension, "interceptRequest"),
      Application.Selector(this as MangaPlusExtension, "interceptResponse"),
    );
  }

  async interceptRequest(request: Request): Promise<Request> {
    if (request.url.startsWith("imageMangaId=")) {
      const mangaId = request.url.replace("imageMangaId=", "");
      request.url = await this.getThumbnailUrl(mangaId);
    }

    const isApiRequest = request.url.startsWith(API_URL);

    request.headers = {
      ...request.headers,
      "user-agent": await Application.getDefaultUserAgent(),
    };

    if (isApiRequest) {
      request.headers = {
        ...request.headers,
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
        "SESSION-TOKEN": this.getSessionToken(),
        "session-token": this.getSessionToken(),
      };
    }

    const vwToken = Application.getState("mangaPlusVwToken") as string | undefined;
    if (request.url.includes("jumpg-assets")) {
      request.headers = {
        ...request.headers,
        Origin: BASE_URL,
        Referer: `${BASE_URL}/`,
      };

      if (vwToken) {
        request.headers = {
          ...request.headers,
          "Plus-Vw-Token": vwToken,
        };
      } else {
        console.log(`[MangaPlus] image request missing vwToken url=${request.url}`);
      }
    }

    return request;
  }

  async interceptResponse(
    request: Request,
    _response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    const { encryptionKey } = this.getMangaPageMeta(request.url);
    if (!encryptionKey) {
      return data;
    }

    const decodedCipher = this.decodeXoRCipher(new Uint8Array(data), encryptionKey);
    return decodedCipher.buffer;
  }

  getDiscoverSections(): Promise<DiscoverSection[]> {
    return Promise.resolve([
      {
        id: "featured",
        title: "Featured",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "popular",
        title: "Popular",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "latest_updates",
        title: "Latest Updates",
        type: DiscoverSectionType.simpleCarousel,
      },
    ]);
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: MangaPlusMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let result: PagedResults<SearchResultItem> = { items: [] };
    switch (section.id) {
      case "featured":
        result = await this.getFeaturedTitles();
        break;
      case "popular":
        result = await this.getPopularTitles();
        break;
      case "latest_updates":
        result = await this.getLatestUpdates();
        break;
    }

    return {
      items: result.items.map(
        (item) =>
          ({
            type: "simpleCarouselItem",
            ...item,
          }) as DiscoverSectionItem,
      ),
      metadata: metadata,
    };
  }

  async getSettingsForm(): Promise<Form> {
    return new MangaPlusSettingForm();
  }
}

export const MangaPlus = new MangaPlusExtension();
