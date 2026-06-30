/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type Request,
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SourceManga,
} from "@paperback/types";
import { DOMAIN } from "./models";
import { RoliascanInterceptor } from "./network";
import {
  extractMangaNumericId,
  parseChapterDetails,
  parseChapters,
  parseHighscoreItems,
  parseLatestUpdates,
  parseMangaDetails,
  parsePopularItems,
  parseSearchResults,
} from "./parsers";
import { generateChapterToken } from "./utils";

type RoliascanImplementation = Extension &
  DiscoverSectionProviding &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  CloudflareBypassRequestProviding;

class RoliascanExtension implements RoliascanImplementation {
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
        const json = await this.fetchText({
          url: `${DOMAIN}/wp-json/manga/v1/popular?number=15`,
          method: "GET",
        });
        return parsePopularItems(json, section.type);
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
        return parseHighscoreItems(json);
      }
      default:
        return { items: [], metadata: undefined };
    }
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    return [];
  }

  async getSearchResults(query: SearchQuery): Promise<PagedResults<SearchResultItem>> {
    if (!query.title || query.title.trim() === "") {
      return { items: [] };
    }

    const json = await this.fetchText({
      url: `${DOMAIN}/wp-json/manga/v1/search`,
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query: query.title.trim() }),
    });
    return parseSearchResults(json);
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

    const { token, timestamp } = generateChapterToken();
    const json = await this.fetchText({
      url: `${DOMAIN}/auth/manga-chapters?manga_id=${numericId}&offset=0&limit=500&order=DESC&_t=${token}&_ts=${timestamp}`,
      method: "GET",
    });
    return parseChapters(json, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const json = await this.fetchText({
      url: `${DOMAIN}/auth/chapter-content?chapter_id=${chapter.chapterId}`,
      method: "GET",
    });
    return parseChapterDetails(json, chapter.chapterId, chapter.sourceManga.mangaId);
  }

  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
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

  async getCloudflareBypassRequest(): Promise<Request> {
    return {
      url: DOMAIN,
      method: "GET",
      headers: {
        referer: DOMAIN,
        origin: DOMAIN,
      },
    };
  }

  private async fetchText(request: Request): Promise<string> {
    const [, data] = await Application.scheduleRequest(request);
    return Application.arrayBufferToUTF8String(data);
  }
}

export const Roliascan = new RoliascanExtension();
