/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  type Cookie,
  CookieStorageInterceptor,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  DiscoverSectionType,
  type Extension,
  Form,
  type MangaProviding,
  type PagedResults,
  type AdvancedSearchForm,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { ComixAdvancedSearchForm } from "./forms/search";
import { getDiscoverySectionsOrder, MainSettings } from "./forms/settings";
import type { Metadata, SearchMetadata } from "./models";
import { MainInterceptor, mainRateLimiter } from "./network";
import { JsonParser } from "./parsers";
import {
  getChapterSectionDiffType,
  getRecentSectionDiffType,
  getSectionTimesType,
  getTrendingSectionDiffType,
  globalFilters,
} from "./utils/globalFilters";
import { getDefaultMetadata } from "./utils/utilsFunctions";

type ComixImplementation = SettingsFormProviding &
  Extension &
  DiscoverSectionProviding &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  CloudflareBypassRequestProviding;
export const parse = new JsonParser();
export const filter = new globalFilters();
export class ComixExtension implements ComixImplementation {
  async getSettingsForm(): Promise<Form> {
    await filter.checkFilters();
    return new MainSettings();
  }

  mainInterceptor = new MainInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }
  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name == "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const allSections: Record<string, DiscoverSection> = {
      popular: {
        id: "popular",
        title: "Popular",
        type: DiscoverSectionType.featured,
      },
      follow: {
        id: "follow",
        title: "Most Follows New Comics",
        type: DiscoverSectionType.prominentCarousel,
      },
      recent: {
        id: "recent",
        title: "Recently Added",
        type: getRecentSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      trending_manga: {
        id: "trending_manga",
        title: `Trending Manga${getSectionTimesType() ? " of " + filter.getYearSettings() : ""}`,
        type: getTrendingSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      trending_wt: {
        id: "trending_wt",
        title: `Trending WebToons${getSectionTimesType() ? " of " + filter.getYearSettings() : ""}`,
        type: getTrendingSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      completed: {
        id: "completed",
        title: "Completed",
        type: DiscoverSectionType.simpleCarousel,
      },
      updatesHot: {
        id: "updatesHot",
        title: "Latest Updates (HOT)",
        type: getChapterSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      updatesNew: {
        id: "updatesNew",
        title: "Latest Updates (NEW)",
        type: getChapterSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      genresSection: {
        id: "genresSection",
        title: "Best of genres",
        type: DiscoverSectionType.genres,
      },
    };
    return getDiscoverySectionsOrder()
      .map((key) => allSections[key.id])
      .filter(Boolean);
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular":
        return await parse.parseSection("popular");
      case "follow":
        return await parse.parseSection("follow");
      case "recent":
        return getRecentSectionDiffType()
          ? await parse.parseSectionSimple("recent", metadata)
          : await parse.parseSectionChapter("recent", metadata);
      case "trending_manga":
        return getTrendingSectionDiffType()
          ? await parse.parseSectionSimple("trending_manga", metadata)
          : await parse.parseSectionChapter("trending_manga", metadata);
      case "trending_wt":
        return getTrendingSectionDiffType()
          ? await parse.parseSectionSimple("trending_wt", metadata)
          : await parse.parseSectionChapter("trending_wt", metadata);
      case "completed":
        return await parse.parseSectionSimple("completed", metadata);
      case "updatesNew":
        return getChapterSectionDiffType()
          ? await parse.parseSectionSimple("updatesNew", metadata)
          : await parse.parseSectionChapter("updatesNew", metadata);
      case "updatesHot":
        return getChapterSectionDiffType()
          ? await parse.parseSectionSimple("updatesHot", metadata)
          : await parse.parseSectionChapter("updatesHot", metadata);
      case "genresSection":
        return await parse.parseGenreSection(metadata);
      default:
        return { items: [] };
    }
  }

  getSearchResults(
    searchQuery: SearchQuery<SearchMetadata>,
    metadata: Metadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    let sorting = sortingOption;
    if (searchQuery.metadata === undefined) {
      searchQuery.metadata = getDefaultMetadata();
    }
    sorting.id = sorting.id.split(searchQuery.title.length > 1 ? "#title" : "#empty")[0];
    return parse.parseSearchResults(searchQuery, metadata, sorting);
  }
  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    await filter.checkFilters();
    if (searchQuery.metadata === undefined) {
      searchQuery.metadata = getDefaultMetadata();
    }
    return new ComixAdvancedSearchForm(searchQuery);
  }
  async getSortingOptions(query: SearchQuery<SearchMetadata>): Promise<SortingOption[]> {
    const idSuffix = query.title.length > 1 ? "#title" : "";
    let sortingOptions: SortingOption[] = [
      { id: "views_30d$desc#empty", label: "Any" },
      { id: "chapter_updated_at$asc" + idSuffix, label: "Update Date ↑" },
      { id: "chapter_updated_at$desc" + idSuffix, label: "Update Date ↓" },
      { id: "created_at$asc" + idSuffix, label: "Created Date ↑" },
      { id: "created_at$desc" + idSuffix, label: "Created Date ↓" },
      { id: "title$asc" + idSuffix, label: "Title ↑" },
      { id: "title$desc" + idSuffix, label: "Title ↓" },
      { id: "year$asc" + idSuffix, label: "Year ↑" },
      { id: "year$desc" + idSuffix, label: "Year ↓" },
      { id: "score$asc" + idSuffix, label: "Average Score ↑" },
      { id: "score$desc" + idSuffix, label: "Average Score ↓" },
      { id: "views_total$asc" + idSuffix, label: "Total Views ↑" },
      { id: "views_totals$desc" + idSuffix, label: "Total Views ↓" },
      { id: "follows_total$asc" + idSuffix, label: "Most Follows ↑" },
      { id: "follows_total$desc" + idSuffix, label: "Most Follows ↓" },
      { id: "views_7d$asc" + idSuffix, label: "Most Views 7 Days ↑" },
      { id: "views_7d$desc" + idSuffix, label: "Most Views 7 Days ↓" },
      { id: "views_30d$asc" + idSuffix, label: "Most Views 1 Month ↑" },
      { id: "views_30d$desc" + idSuffix, label: "Most Views 1 Month ↓" },
      { id: "views_90d$asc" + idSuffix, label: "Most Views 3 Month ↑" },
      { id: "views_90d$desc" + idSuffix, label: "Most Views 3 Month ↓" },
    ];
    if (query.title.length > 1) {
      sortingOptions.unshift({ id: "relevance$desc" + idSuffix, label: "Best Match" });
      sortingOptions = sortingOptions.filter((sort) => {
        return sort.id !== "views_30d$desc#empty";
      });
    }
    return sortingOptions;
  }

  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parse.parseMangaDetails(mangaId);
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return parse.parseChapters(sourceManga, this.cookieStorageInterceptor);
  }
  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return parse.parseChapterDetails(chapter.chapterId, this.cookieStorageInterceptor);
  }
}

export const Comix = new ComixExtension();
