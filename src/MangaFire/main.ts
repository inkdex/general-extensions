/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  URL,
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type Form,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { MangaFireAdvancedSearchForm } from "./forms/search";
import { getLanguages, MangaFireSettingsForm } from "./forms/settings";
import {
  DOMAIN,
  SEARCH_DETAILS_CACHE_KEY,
  type PageMetadata,
  type PageResponse,
  type Result,
  type SearchDetails,
  type SearchMetadata,
} from "./models";
import { MangaFireInterceptor } from "./network";
import {
  hasNextPage,
  parseChapterDetails,
  parseChapters,
  parseJson,
  parseMangaDetails,
  parseMangaList,
  parseSearchDetails,
} from "./parsers";
import type MangaFireConfig from "./pbconfig";
import { cacheGet, cacheSet } from "./utils/cache";
import { extractVrf, getChapterPagesVrfUrl, getSearchVrfUrl } from "./utils/webView";

class MangaFireExtension implements ExtensionImpl<typeof MangaFireConfig> {
  private requestManager = new MangaFireInterceptor("requestManager");
  private cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  private globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });

  async initialise(): Promise<void> {
    this.cookieStorageInterceptor.registerInterceptor();
    this.requestManager.registerInterceptor();
    this.globalRateLimiter.registerInterceptor();
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (/^_{0,2}cf/.test(cookie.name)) this.cookieStorageInterceptor.setCookie(cookie);
    }
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "popular_section",
        title: "Popular",
        type: DiscoverSectionType.featured,
      },
      {
        id: "updated_section",
        title: "Recently Updated",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: "new_manga_section",
        title: "New Manga",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "languages_section",
        title: "Languages",
        type: DiscoverSectionType.genres,
      },
      {
        id: "types_section",
        title: "Types",
        type: DiscoverSectionType.genres,
      },
      {
        id: "genres_section",
        title: "Genres",
        type: DiscoverSectionType.genres,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular_section":
        return this.getMangaListSection(
          metadata,
          this.filterUrl("most_viewed"),
          "featuredCarouselItem",
        );
      case "updated_section":
        return this.getMangaListSection(
          metadata,
          this.filterUrl("recently_updated"),
          "chapterUpdatesCarouselItem",
        );
      case "new_manga_section":
        return this.getMangaListSection(
          metadata,
          new URL(DOMAIN).addPathComponent("added"),
          "simpleCarouselItem",
        );
      case "types_section":
        return this.getGenresSection("types", (id) => ({ type: id }));
      case "genres_section":
        return this.getGenresSection("genres", (id) => ({ genres: { [id]: "included" } }));
      case "languages_section":
        return this.getGenresSection("languages", (id) => ({ language: id }));
      default:
        return { items: [] };
    }
  }

  private filterUrl(sort: string): URL {
    return new URL(DOMAIN)
      .addPathComponent("filter")
      .setQueryItem("keyword", "")
      .setQueryItem("language[]", getLanguages())
      .setQueryItem("sort", sort);
  }

  private async getMangaListSection(
    metadata: PageMetadata | undefined,
    url: URL,
    itemType: "featuredCarouselItem" | "chapterUpdatesCarouselItem" | "simpleCarouselItem",
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];

    const $ = await this.fetchCheerio({
      url: url.setQueryItem("page", page.toString()).toString(),
      method: "GET",
    });

    const listItems = parseMangaList($, getLanguages()).filter(
      (item) => !collectedIds.includes(item.mangaId),
    );
    collectedIds.push(...listItems.map((item) => item.mangaId));

    const items = listItems.map(
      ({ chapterId, subtitle, metadata: _, ...item }): DiscoverSectionItem => {
        switch (itemType) {
          case "featuredCarouselItem":
            return { type: itemType, ...item, supertitle: subtitle ?? "" };
          case "chapterUpdatesCarouselItem":
            return { type: itemType, ...item, chapterId, subtitle };
          case "simpleCarouselItem":
            return { type: itemType, ...item, subtitle };
        }
      },
    );

    return {
      items,
      metadata: hasNextPage($) ? { page: page + 1, collectedIds } : undefined,
    };
  }

  private async getGenresSection(
    key: "types" | "genres" | "languages",
    toMetadata: (id: string) => SearchMetadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const searchDetails = await this.getSearchDetails();

    return {
      items: searchDetails[key].map((option) => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          metadata: toMetadata(option.id),
        },
        name: option.label,
      })),
    };
  }

  async getSettingsForm(): Promise<Form> {
    return new MangaFireSettingsForm();
  }

  private async getSearchDetails(): Promise<SearchDetails> {
    const cached = cacheGet(SEARCH_DETAILS_CACHE_KEY, "default");
    if (cached) return JSON.parse(cached) as SearchDetails;

    const vrf = extractVrf(await getSearchVrfUrl("aa", this.cookieStorageInterceptor));
    const $ = await this.fetchCheerio({
      url: `${DOMAIN}/filter?keyword=aa&vrf=${vrf}`,
      method: "GET",
    });

    const details = parseSearchDetails($);
    cacheSet(SEARCH_DETAILS_CACHE_KEY, "default", JSON.stringify(details));
    return details;
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new MangaFireAdvancedSearchForm(query, await this.getSearchDetails());
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return (await this.getSearchDetails()).sorts;
  }

  // e.g. /filter?keyword=one+piece&type[]=manga&genre[]=1&genre[]=-9&genre_mode=and&status[]=releasing&sort=most_relevance&page=2
  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: { page?: number } | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const searchUrl = new URL(DOMAIN)
      .addPathComponent("filter")
      .setQueryItem("keyword", query.title)
      .setQueryItem("page", page.toString());

    if (query.title.trim()) {
      const vrf = extractVrf(await getSearchVrfUrl(query.title, this.cookieStorageInterceptor));
      searchUrl.setQueryItem("vrf", vrf);
    }

    const meta = query.metadata ?? {};

    if (meta.genreMode) searchUrl.setQueryItem("genre_mode", "and");

    const genreValues = Object.entries(meta.genres ?? {}).map(([id, value]) =>
      value === "excluded" ? `-${id}` : id,
    );
    if (genreValues.length > 0) searchUrl.setQueryItem("genre[]", genreValues);

    const filters = {
      "type[]": meta.type,
      "status[]": meta.status,
      "language[]": meta.language,
      "year[]": meta.year,
      "length[]": meta.length,
    };
    for (const [key, value] of Object.entries(filters)) {
      if (value) searchUrl.setQueryItem(key, value);
    }

    if (sortingOption) searchUrl.setQueryItem("sort", sortingOption.id);

    const $ = await this.fetchCheerio({ url: searchUrl.toString(), method: "GET" });

    return {
      items: parseMangaList($, getLanguages(), ".original.card-lg .unit .inner"),
      metadata: hasNextPage($) ? { page: page + 1 } : undefined,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const searchDetails = await this.getSearchDetails();
    const $ = await this.fetchCheerio({
      url: new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString(),
      method: "GET",
    });

    return parseMangaDetails($, mangaId, searchDetails);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId.split(".").pop();
    if (!mangaId) throw new Error(`Invalid manga ID format: ${sourceManga.mangaId}`);

    const chapters: Chapter[] = [];
    for (const langCode of getLanguages()) {
      const request: Request = {
        url: new URL(DOMAIN)
          .addPathComponent("ajax")
          .addPathComponent("manga")
          .addPathComponent(mangaId)
          .addPathComponent("chapter")
          .addPathComponent(langCode)
          .toString(),
        method: "GET",
      };

      const [, buffer] = await Application.scheduleRequest(request);
      const json = parseJson<Result>(
        Application.arrayBufferToUTF8String(buffer),
        `chapters for language ${langCode}`,
      );

      const html = typeof json.result === "string" ? json.result : json.result.html;
      if (!html) continue;

      chapters.push(...parseChapters(cheerio.load(html), sourceManga, langCode));
    }

    return chapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const url = await getChapterPagesVrfUrl(chapter.chapterId, this.cookieStorageInterceptor);

    const [, buffer] = await Application.scheduleRequest({ url, method: "GET" });
    const json = parseJson<PageResponse>(
      Application.arrayBufferToUTF8String(buffer),
      "chapter details",
    );

    return parseChapterDetails(json, chapter);
  }

  private async fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
    const [, data] = await Application.scheduleRequest(request);
    return cheerio.load(Application.arrayBufferToUTF8String(data));
  }
}

export const MangaFire = new MangaFireExtension();
