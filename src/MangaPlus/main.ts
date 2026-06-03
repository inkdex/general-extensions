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

const langCode = Language.ENGLISH;

export class MangaPlusExtension implements ExtensionImpl<typeof MangaPlusConfig> {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });

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

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const request = {
      url: `${API_URL}/title_detailV3?title_id=${mangaId}&format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = TitleDetailView.fromJson(Application.arrayBufferToUTF8String(response));

    return result.toSourceManga();
  }

  private async getThumbnailUrl(mangaId: string): Promise<string> {
    const request = {
      url: `${API_URL}/title_detailV3?title_id=${mangaId}&format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = TitleDetailView.fromJson(Application.arrayBufferToUTF8String(response));

    return result.title?.portraitImageUrl ?? "";
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const request = {
      url: `${API_URL}/title_detailV3?title_id=${sourceManga.mangaId}&format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = TitleDetailView.fromJson(Application.arrayBufferToUTF8String(response));

    return [...(result.firstChapterList ?? []), ...(result.lastChapterList ?? [])]
      .reverse()
      .filter((chapter) => !chapter.isExpired)
      .map((chapter) => chapter.toSChapter(sourceManga));
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const request = {
      url: `${API_URL}/manga_viewer?chapter_id=${chapter.chapterId}&split=${getSplitImages()}&img_quality=${getResolution()}&format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = JSON.parse(Application.arrayBufferToUTF8String(response)) as MangaPlusResponse;

    if (result.success === undefined) {
      throw new Error(langPopup(result.error, Language.ENGLISH)?.body ?? "Unknown error");
    }

    const pages = result.success.mangaViewer?.pages
      .map((page) => page.mangaPage)
      .filter((page) => page)
      .map((page) => (page?.encryptionKey ? `${page?.imageUrl}#${page?.encryptionKey}` : ""));

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages: pages ?? [],
    };
  }

  async getFeaturedTitles(): Promise<PagedResults<SearchResultItem>> {
    const request = {
      url: `${API_URL}/featuredV2?lang=eng&clang=eng&format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = JSON.parse(Application.arrayBufferToUTF8String(response)) as MangaPlusResponse;

    if (result.success === undefined) {
      throw new Error(langPopup(result.error, Language.ENGLISH)?.body ?? "Unknown error");
    }

    const languages = getLanguages();

    const results = result.success?.featuredTitlesViewV2?.contents
      ?.find((x) => x.titleList && x.titleList.listName == "WEEKLY SHONEN JUMP")
      ?.titleList.featuredTitles.filter((title) =>
        languages.includes(title.language ?? Language.ENGLISH),
      );

    const titles: SearchResultItem[] = [];
    const collectedIds: string[] = [];

    for (const item of results ?? []) {
      const mangaId = item.titleId.toString();
      const title = item.name;
      const author = item.author;
      const image = item.portraitImageUrl;

      if (!mangaId || !title || collectedIds.includes(mangaId)) continue;

      titles.push({
        mangaId: mangaId,
        title: title,
        subtitle: author,
        imageUrl: image,
        contentRating: ContentRating.EVERYONE,
      });
    }

    return { items: titles };
  }

  async getPopularTitles(): Promise<PagedResults<SearchResultItem>> {
    const request = {
      url: `${API_URL}/title_list/ranking?format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = JSON.parse(Application.arrayBufferToUTF8String(response)) as MangaPlusResponse;

    if (result.success === undefined) {
      throw new Error(langPopup(result.error, Language.ENGLISH)?.body ?? "Unknown error");
    }

    const languages = getLanguages();

    const results = result.success?.titleRankingView?.titles.filter((title) =>
      languages.includes(title.language ?? Language.ENGLISH),
    );

    const titles: SearchResultItem[] = [];
    const collectedIds: string[] = [];

    for (const item of results ?? []) {
      const mangaId = item.titleId.toString();
      const title = item.name;
      const author = item.author;
      const image = item.portraitImageUrl;

      if (!mangaId || !title || collectedIds.includes(mangaId)) continue;

      titles.push({
        mangaId: mangaId,
        title: title,
        subtitle: author,
        imageUrl: image,
        contentRating: ContentRating.EVERYONE,
      });
    }

    return { items: titles };
  }

  async getLatestUpdates(): Promise<PagedResults<SearchResultItem>> {
    const request = {
      url: `${API_URL}/web/web_homeV4?lang=eng&format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = JSON.parse(Application.arrayBufferToUTF8String(response)) as MangaPlusResponse;

    if (result.success === undefined) {
      throw new Error(langPopup(result.error, langCode)?.body ?? "Unknown error");
    }

    const languages = getLanguages();

    const results = result.success.webHomeViewV4?.groups
      .flatMap((ex) => ex.titleGroups)
      .flatMap((ex) => ex.titles)
      .map((title) => title.title)
      .filter((title) => languages.includes(title.language ?? Language.ENGLISH));

    const titles: SearchResultItem[] = [];
    const collectedIds: string[] = [];

    for (const item of results ?? []) {
      const mangaId = item.titleId.toString();
      const title = item.name;
      const author = item.author;
      const image = item.portraitImageUrl;

      if (!mangaId || !title || collectedIds.includes(mangaId)) continue;

      titles.push({
        mangaId: mangaId,
        title: title,
        subtitle: author,
        imageUrl: image,
        contentRating: ContentRating.EVERYONE,
      });
    }

    return { items: titles };
  }

  async getSearchResults(
    query: SearchQuery<Metadata>,
    metadata: MangaPlusMetadata,
  ): Promise<PagedResults<SearchResultItem>> {
    const title = query.title ?? "";

    const request = {
      url: `${API_URL}/title_list/allV2?format=JSON&${title ? "filter=" + encodeURI(title) + "&" : ""}format=json`,
      method: "GET",
    };

    const response = (await Application.scheduleRequest(request))[1];
    const result = JSON.parse(Application.arrayBufferToUTF8String(response)) as MangaPlusResponse;

    if (result.success === undefined) {
      throw new Error(langPopup(result.error, Language.ENGLISH)?.body ?? "Unknown error");
    }

    const ltitle = query.title?.toLowerCase() ?? "";
    const languages = getLanguages();

    const results = result.success?.allTitlesViewV2?.AllTitlesGroup.flatMap((group) => group.titles)
      .filter((title) => languages.includes(title.language ?? Language.ENGLISH))
      .filter(
        (title) =>
          title.author?.toLowerCase().includes(ltitle) || title.name.toLowerCase().includes(ltitle),
      );

    const titles: SearchResultItem[] = [];
    const collectedIds: string[] = [];

    for (const item of results ?? []) {
      const mangaId = item.titleId.toString();
      const title = item.name;
      const author = item.author;
      const image = item.portraitImageUrl;

      if (!mangaId || !title || collectedIds.includes(mangaId)) continue;

      titles.push({
        mangaId: mangaId,
        title: title,
        subtitle: author,
        imageUrl: image,
        contentRating: ContentRating.EVERYONE,
      });
    }

    return { items: titles, metadata };
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
    request.headers = {
      ...request.headers,
      Origin: BASE_URL,
      Referer: `${BASE_URL}/`,
      "session-token": this.getSessionToken(),
      "user-agent": await Application.getDefaultUserAgent(),
    };

    if (request.url.startsWith("imageMangaId=")) {
      const mangaId = request.url.replace("imageMangaId=", "");
      request.url = await this.getThumbnailUrl(mangaId);
    }

    return request;
  }

  async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    if (
      !request.url.includes("encryptionKey") &&
      response.headers["Content-Type"] !== "image/jpeg"
    ) {
      return data;
    }

    if (request.url.includes("title_thumbnail_portrait_list")) {
      return data;
    }

    const encryptionKey = request.url.substring(request.url.lastIndexOf("#") + 1) ?? "";
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
