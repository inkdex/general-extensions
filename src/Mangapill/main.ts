/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  DiscoverSectionType,
  URL,
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SourceManga,
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { MangapillAdvancedSearchForm } from "./forms";
import { getGenresFromTags, getSearchTags } from "./helpers";
import { MangapillInterceptor } from "./interceptors";
import { DOMAIN, type SearchMetadata } from "./models";
import {
  parseChapterDetails,
  parseChapters,
  parseMangaDetails,
  parseRecentSection,
  parseSearch,
  parseTags,
  parseTrendingSection,
} from "./parsers";
import {
  fetchChapterDetailsPage,
  fetchHomepage,
  fetchMangaDetailsPage,
  fetchSearchPage,
} from "./requests";

export class MangapillExtension
  implements
    Extension,
    SearchResultsProviding,
    MangaProviding,
    ChapterProviding,
    DiscoverSectionProviding
{
  globalRateLimiter = new BasicRateLimiter("ratelimiter", {
    numberOfRequests: 10,
    bufferInterval: 0.5,
    ignoreImages: true,
  });

  requestManager = new MangapillInterceptor("main");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.requestManager.registerInterceptor();
    if (Application.isResourceLimited) return;
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "trending",
        title: "Trending Mangas",
        type: DiscoverSectionType.featured,
      },

      {
        id: "recent",
        title: "Recently Updated",
        type: DiscoverSectionType.chapterUpdates,
      },

      { id: "genre", title: "Genres", type: DiscoverSectionType.genres },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let items: DiscoverSectionItem[] = [];

    switch (section.id) {
      case "trending": {
        const [_, buffer] = await fetchHomepage();
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        items = await parseTrendingSection($);
        break;
      }
      case "recent": {
        const [_, buffer] = await fetchHomepage();
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        items = await parseRecentSection($);
        break;
      }
      case "genre": {
        const tags = await getSearchTags();
        const genres = getGenresFromTags(tags);
        items = genres.tags.map((genre) => ({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: {
              genres: [genre.id],
            },
          },
          name: genre.title,
          metadata: metadata,
        }));
      }
    }
    return { items, metadata };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const [_, buffer] = await fetchMangaDetailsPage(mangaId);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return await parseMangaDetails($, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const [_, buffer] = await fetchMangaDetailsPage(sourceManga.mangaId);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return parseChapters($, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const [_, buffer] = await fetchChapterDetailsPage(chapter.chapterId);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return parseChapterDetails($, chapter.sourceManga.mangaId, chapter.chapterId);
  }

  async supportsTagExclusion(): Promise<boolean> {
    return false;
  }

  async getSearchTags(): Promise<TagSection[]> {
    const request = {
      url: new URL(DOMAIN).addPathComponent("search").toString(),
      method: "GET",
    };

    const [_, buffer] = await Application.scheduleRequest(request);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return await parseTags($);
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const queries = [];
    if (query.title) {
      queries.push({ key: "q", value: query.title });
    }
    queries.push(
      {
        key: "genre",
        value: query.metadata?.genres ?? [],
      },
      {
        key: "type",
        value: query.metadata?.types ?? [],
      },
      {
        key: "status",
        value: query.metadata?.statuses ?? [],
      },
    );
    const response = await fetchSearchPage([], queries);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(response[1]));

    const items = await parseSearch($);
    return { items, metadata };
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    const tags = await this.getSearchTags();
    return new MangapillAdvancedSearchForm(searchQuery, tags);
  }
}

export const Mangapill = new MangapillExtension();
