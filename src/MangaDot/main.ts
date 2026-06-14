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
  type Form,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import MangaDotAdvancedSearchForm from "./forms/search";
import { SettingsForm } from "./forms/settings";
import { DOMAIN, type PageMetadata, type SearchMetadata } from "./models";
import { MangaDotApi, MangaDotInterceptor } from "./network";
import {
  parseChapterPages,
  parseChapters,
  parseMangaInfo,
  parseSearch,
  parseSection,
  type SectionItemType,
} from "./parsers";
import type MangaDotConfig from "./pbconfig";
import { checkFilters, defaultMetadata, getDiscoverySectionsOrder, getRangeStatus } from "./utils";

export class MangaDotExtension implements ExtensionImpl<typeof MangaDotConfig> {
  api = new MangaDotApi();
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainInterceptor = new MangaDotInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }

  async getSettingsForm(): Promise<Form> {
    await checkFilters(this.api);
    return new SettingsForm(this.api);
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const mangaInfo = await this.api.getMangaData(mangaId);
    const volumes = (await this.api.getVolumes(mangaId)).map(
      (volume) => `${DOMAIN}${volume.cover_url}`,
    );
    return parseMangaInfo(mangaInfo, volumes);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const chapters = await this.api.getChapterList(sourceManga.mangaId);
    return parseChapters(chapters, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const pages = await this.api.getChapterPages(
      chapter.chapterId,
      chapter.sourceManga.mangaId,
      chapter.additionalInfo?.upload,
    );
    return parseChapterPages(pages, chapter);
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const allSections: Record<string, DiscoverSection> = {
      most_viewed: {
        id: "most_viewed",
        title: "Most Viewed",
        type: DiscoverSectionType.featured,
      },
      latest_updates: {
        id: "latest_updates",
        title: "Latest updates",
        type: DiscoverSectionType.chapterUpdates,
      },
      most_tracked: {
        id: "most_tracked",
        title: "Most Tracked Comics",
        type: getRangeStatus() ? DiscoverSectionType.genres : DiscoverSectionType.simpleCarousel,
      },
      top_rated: {
        id: "top_rated",
        title: "Top Rated",
        type: getRangeStatus() ? DiscoverSectionType.genres : DiscoverSectionType.prominentCarousel,
      },
      recently_added: {
        id: "recently_added",
        title: "Recently Added",
        type: getRangeStatus() ? DiscoverSectionType.genres : DiscoverSectionType.simpleCarousel,
      },

      genres: {
        id: "genres",
        title: "Genres",
        type: DiscoverSectionType.genres,
      },
      themes: {
        id: "themes",
        title: "Themes",
        type: DiscoverSectionType.genres,
      },
      demographics: {
        id: "demographics",
        title: "Demographics",
        type: DiscoverSectionType.genres,
      },
    };
    return getDiscoverySectionsOrder()
      .map((key) => allSections[key.id])
      .filter(Boolean);
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    await checkFilters(this.api);

    if (section.id === "genres") {
      return this.api.getGenreSection();
    }
    if (section.id === "demographics") {
      return this.api.getDemographicSection();
    }
    if (section.id === "themes") {
      return this.api.getThemesSection();
    }
    if (getRangeStatus()) {
      if (section.id === "most_tracked") {
        return this.api.getRangeSection("most_tracked");
      }
      if (section.id === "top_rated") {
        return this.api.getRangeSection("top_rated");
      }
      if (section.id === "recently_added") {
        return this.api.getRangeSection("recently_added");
      }
    }
    const page = metadata?.page ?? 1;
    const sectionElements = await this.api.getSection(section.id, page);
    const itemTypes: Record<string, SectionItemType> = {
      most_viewed: "featuredCarouselItem",
      latest_updates: "chapterUpdatesCarouselItem",
      most_tracked: "simpleCarouselItem",
      top_rated: "prominentCarouselItem",
      recently_added: "simpleCarouselItem",
    };
    return parseSection(sectionElements, page, itemTypes[section.id] ?? "simpleCarouselItem");
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name == "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    await checkFilters(this.api);
    return new MangaDotAdvancedSearchForm(searchQuery);
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    if (query.metadata === undefined) {
      query.metadata = defaultMetadata();
    }
    if (query.metadata.range && query.metadata.sectionName) {
      return this.api.MangaSectionRequestToSearchResponse(
        query.metadata.sectionName,
        query.metadata.range,
      );
    }
    const search = await this.api.getSearch(query, page, sortingOption);
    return parseSearch(search, metadata);
  }

  async getSortingOptions(_query: SearchQuery<SearchMetadata>): Promise<SortingOption[]> {
    return [
      { id: "relevance", label: "Relevance" },
      { id: "latest$asc", label: "Latest ↑" },
      { id: "latest$desc", label: "Latest ↓" },
      { id: "alphabetical$asc", label: "Z-A" },
      { id: "alphabetical$desc", label: "A-Z" },
      { id: "chapters$asc", label: "Chapters ↑" },
      { id: "chapters$desc", label: "Chapters ↓" },
      { id: "views$asc", label: "Most Viewed ↑" },
      { id: "views$desc", label: "Most Viewed ↓" },
      { id: "tracked$asc", label: "Most tracked ↑" },
      { id: "tracked$desc", label: "Most tracked ↓" },
      { id: "rating$asc", label: "Top Rated ↑" },
      { id: "rating$desc", label: "Top Rated ↓" },
    ];
  }
}

export const MangaDot = new MangaDotExtension();
