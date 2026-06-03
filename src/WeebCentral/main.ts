/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
  type Form,
  type MangaProviding,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SourceManga,
  type Tag,
  type TagSection,
  type SortingOption,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { getState } from "../utils/state";
import { SettingsForm, WeebCentralAdvancedSearchForm } from "./forms";
import { getSearchTags, getShareUrl, isInvalidTags, newQuery } from "./helpers";
import {
  EMPTY_SEARCH_METADATA,
  TagSectionId,
  type SearchMetadata,
  type WeebCentralMetadata,
} from "./models";
import { WeebCentralInterceptor } from "./network";
import {
  fetchChapterDetailsPage,
  fetchChaptersPage,
  fetchHomepage,
  fetchMangaDetailsPage,
  fetchRecentViewMorePage,
  fetchSearchPage,
} from "./network";
import {
  isLastPage,
  parseChapterDetails,
  parseChapters,
  parseHotSection,
  parseMangaDetails,
  parseRecentSection,
  parseRecentSectionViewMore,
  parseRecommendedSection,
  parseSearch,
} from "./parsers";
import pbconfig from "./pbconfig";

export class WeebCentralExtension
  implements
    Extension,
    SearchResultsProviding,
    MangaProviding,
    ChapterProviding,
    DiscoverSectionProviding,
    SettingsFormProviding,
    CloudflareBypassRequestProviding
{
  globalRateLimiter = new BasicRateLimiter("ratelimiter", {
    numberOfRequests: 10,
    bufferInterval: 0.5,
    ignoreImages: true,
  });

  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  requestManager = new WeebCentralInterceptor("main");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.requestManager.registerInterceptor();
    if (Application.isResourceLimited) return;
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "recommended",
        title: "Recommended Mangas",
        type: DiscoverSectionType.featured,
      },

      {
        id: "recent",
        title: "Recently Updated",
        type: DiscoverSectionType.chapterUpdates,
      },

      {
        id: "hot",
        title: "Hot Updates",
        type: DiscoverSectionType.simpleCarousel,
      },

      { id: "genres", title: "Genres", type: DiscoverSectionType.genres },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: WeebCentralMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let items: DiscoverSectionItem[] = [];
    const page: number = metadata?.page ?? 1;

    switch (section.id) {
      case "recommended": {
        const [_, buffer] = await fetchHomepage();
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        items = await parseRecommendedSection($);
        break;
      }
      case "recent": {
        let $: cheerio.CheerioAPI;
        if (page == 1) {
          const [_, buffer] = await fetchHomepage();
          $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

          items = await parseRecentSection($);
        } else {
          const [_, buffer] = await fetchRecentViewMorePage(page);
          $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
          items = await parseRecentSectionViewMore($);
        }
        metadata = !isLastPage($, "View More...") ? { page: page + 1 } : undefined;
        break;
      }
      case "hot": {
        const [_, buffer] = await fetchHomepage();
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        items = await parseHotSection($);
        break;
      }
      case "genres": {
        const genres = await this.getGenres();
        items = genres.map((genre) => ({
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

  getMangaShareUrl(mangaId: string): string {
    return getShareUrl(mangaId);
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const [_, buffer] = await fetchMangaDetailsPage(mangaId);

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return await parseMangaDetails($, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const [_, buffer] = await fetchChaptersPage(sourceManga.mangaId);
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

  async getGenres(): Promise<Tag[]> {
    let tags = getState<TagSection[]>("tags", []);
    if (tags.length == 0) {
      tags = await getSearchTags();
      if (tags.length == 0) {
        throw new Error("Tags not found");
      }
    }
    const genreTag = tags.find((tag) => (tag.id as TagSectionId) === TagSectionId.Genres);
    if (genreTag === undefined) {
      throw new Error("Genres tag section not found");
    }
    if (isInvalidTags(genreTag.tags)) {
      throw new Error(`Please reset ${pbconfig.name} state in settings`);
    }
    return genreTag.tags;
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "Best Match", label: "Best Match" },
      { id: "Alphabet", label: "Alphabet" },
      { id: "Popularity", label: "Popularity" },
      { id: "Subscribers", label: "Subscribers" },
      { id: "Recently Added", label: "Recently Added" },
      { id: "Latest Updates", label: "Latest Updates" },
    ];
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: WeebCentralMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const LIMIT = 32;
    const offset = metadata?.offset ?? 0;
    const paths = ["data"];
    query.metadata = query.metadata ?? EMPTY_SEARCH_METADATA;
    const queries = [
      newQuery("sort", sortingOption?.id ?? "Best Match"),
      newQuery("display_mode", "Full Display"),
      newQuery("limit", LIMIT.toString()),
      newQuery("offset", offset.toString()),
    ];
    if (query.title) {
      queries.push(newQuery("text", query.title));
    }

    queries.push(
      newQuery(TagSectionId.Genres, query.metadata.genres ?? []),
      newQuery(TagSectionId.SeriesStatus, query.metadata.seriesStatuses ?? []),
      newQuery(TagSectionId.SeriesType, query.metadata.seriesTypes ?? []),
    );

    const orderIsDescending = query.metadata.orderIsDescending ?? false;
    queries.push(newQuery(TagSectionId.Order, orderIsDescending ? "Descending" : "Ascending"));

    const [_, buffer] = await fetchSearchPage(paths, queries);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const items = await parseSearch($);
    metadata = isLastPage($, "View More Results...")
      ? undefined
      : { ...metadata, offset: offset + LIMIT };
    return { items, metadata };
  }

  async getSettingsForm(): Promise<Form> {
    return new SettingsForm();
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    const tags = await getSearchTags();
    return new WeebCentralAdvancedSearchForm(searchQuery, tags);
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
}

export const WeebCentral = new WeebCentralExtension();
