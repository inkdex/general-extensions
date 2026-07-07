/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { RoliascanAdvancedSearchForm } from "./forms";
import { DOMAIN, type SearchMetadata } from "./models";
import { RoliascanInterceptor } from "./network";
import {
  extractMangaNumericId,
  parseBrowseResults,
  parseCarouselItems,
  parseChapterDetails,
  parseChapters,
  parseFeaturedItems,
  parseFilterOptions,
  parseLatestUpdates,
  parseMangaDetails,
  parseSearchResults,
} from "./parsers";
import type RoliascanConfig from "./pbconfig";
import { generateChapterToken } from "./utils";

const CHAPTER_PAGE_SIZE = 500;

class RoliascanExtension implements ExtensionImpl<typeof RoliascanConfig> {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 4,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainInterceptor = new RoliascanInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "popular",
        title: "Popular",
        type: DiscoverSectionType.featured,
      },
      {
        id: "latest",
        title: "Latest Updates",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: "highscore",
        title: "Top Rated",
        type: DiscoverSectionType.simpleCarousel,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: number | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata ?? 1;

    switch (section.id) {
      case "popular": {
        // /popular only returns cover+title; /load with the same popular sort
        // adds score, votes, type and description for the featured carousel
        const json = await this.fetchText({
          url: `${DOMAIN}/wp-json/manga/v1/load`,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ page: 1, sort: "popular_desc" }),
        });
        return parseFeaturedItems(json, 15);
      }
      case "latest": {
        const json = await this.fetchText({
          url: `${DOMAIN}/wp-json/manga/v1/latest-chapters`,
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ page }),
        });
        return parseLatestUpdates(json, page);
      }
      case "highscore": {
        const json = await this.fetchText({
          url: `${DOMAIN}/wp-json/manga/v1/highscore?number=15`,
          method: "GET",
        });
        return parseCarouselItems(json);
      }
      default:
        return { items: [], metadata: undefined };
    }
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "post_desc", label: "Latest Updates" },
      { id: "release_desc", label: "Release Date" },
      { id: "title_asc", label: "Title (A-Z)" },
      { id: "popular_desc", label: "Popular" },
    ];
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    const html = await this.fetchText({
      url: `${DOMAIN}/browse/`,
      method: "GET",
    });
    return new RoliascanAdvancedSearchForm(query, parseFilterOptions(html));
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: { page?: number } | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const filters = query.metadata ?? {};
    const title = query.title?.trim() ?? "";
    const sort = sortingOption?.id ?? "post_desc";

    // /search ranks by relevance; /load orders by date and also matches
    // descriptions, so only use it when filters or an explicit sort require it
    if (title && Object.keys(filters).length === 0 && sort === "post_desc") {
      const json = await this.fetchText({
        url: `${DOMAIN}/wp-json/manga/v1/search`,
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: title }),
      });
      return { items: parseSearchResults(json) };
    }

    const json = await this.fetchText({
      url: `${DOMAIN}/wp-json/manga/v1/load`,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        page,
        search: title,
        years: JSON.stringify(filters.year ? [filters.year] : []),
        genres: JSON.stringify(filters.genres ?? []),
        types: JSON.stringify(filters.type ? [filters.type] : []),
        statuses: JSON.stringify(filters.status ? [filters.status] : []),
        sort,
        genreMatchMode: filters.matchAllGenres ? "all" : "any",
      }),
    });

    const items = parseBrowseResults(json);
    return { items, metadata: items.length > 0 ? { page: page + 1 } : undefined };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const html = await this.fetchText({
      url: `${DOMAIN}/manga/${mangaId}/`,
      method: "GET",
    });
    return parseMangaDetails(html, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const html = await this.fetchText({
      url: `${DOMAIN}/manga/${sourceManga.mangaId}/`,
      method: "GET",
    });

    const numericId = extractMangaNumericId(html);
    if (!numericId) {
      throw new Error(`Could not find numeric manga ID for ${sourceManga.mangaId}`);
    }

    const chapters: Chapter[] = [];
    for (let offset = 0; ; offset += CHAPTER_PAGE_SIZE) {
      const { token, timestamp } = generateChapterToken();
      const json = await this.fetchText({
        url: `${DOMAIN}/auth/manga-chapters?manga_id=${numericId}&offset=${offset}&limit=${CHAPTER_PAGE_SIZE}&order=DESC&_t=${token}&_ts=${timestamp}`,
        method: "GET",
      });
      const result = parseChapters(json, sourceManga);
      chapters.push(...result.chapters);
      if (!result.hasMore || result.chapters.length === 0) break;
    }
    return chapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const json = await this.fetchText({
      url: `${DOMAIN}/auth/chapter-content?chapter_id=${chapter.chapterId}`,
      method: "GET",
    });
    return parseChapterDetails(json, chapter.chapterId, chapter.sourceManga.mangaId);
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (
        cookie.name.startsWith("cf") ||
        cookie.name.startsWith("_cf") ||
        cookie.name.startsWith("__cf")
      ) {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  private async fetchText(request: Request): Promise<string> {
    const [, data] = await Application.scheduleRequest(request);
    return Application.arrayBufferToUTF8String(data);
  }
}

export const Roliascan = new RoliascanExtension();
