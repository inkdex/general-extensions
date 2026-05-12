/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Chapter,
  type ChapterDetails,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type PagedResults,
  type AdvancedSearchForm,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  Form,
} from "@paperback/types";

import { ComixAdvancedSearchForm } from "./forms/search";
import { getDiscoverySectionsOrder, MainSettings } from "./forms/settings";
import type { Filters, Metadata, OptionItem, SearchMetadata } from "./models";
import { ComixInterceptor } from "./network";
import { ComixApi } from "./network";
import { ComixParser } from "./parsers";
import ComixConfig from "./pbconfig";
import { ComixFilter } from "./utils/filter";
import { buildFilter, getDefaultMetadata } from "./utils/helpers";

export class ComixExtension implements ExtensionImpl<typeof ComixConfig> {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainInterceptor = new ComixInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  parser = new ComixParser();
  filter = new ComixFilter();
  api = new ComixApi(this.filter);

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }

  private async checkFilters(): Promise<void> {
    if (
      this.filter.demographic.length === 0 ||
      this.filter.formats.length === 0 ||
      this.filter.themes.length === 0 ||
      this.filter.genres.length === 0
    ) {
      await this.updateFilters(true);
    }
  }

  private async updateFilters(force: boolean): Promise<void> {
    const lastFilterFetch = Number(Application.getState("last-filter-fetch") ?? 0);
    const cached = lastFilterFetch + 172800 > new Date().valueOf() / 1000;
    if (cached && !force) {
      const keys = ["genre", "demographic", "format"] as const;
      const values = keys.map((k) => Application.getState(`${k}`) as string | undefined);
      const [genres, demographic, formats] = values;
      if (genres === undefined || demographic === undefined || formats === undefined) {
        await this.updateFilters(true);
        return;
      }
      this.filter.setGenreFilter(JSON.parse(genres) as OptionItem[]);
      this.filter.setDemographicFilter(JSON.parse(demographic) as OptionItem[]);
      this.filter.setFormatsFilter(JSON.parse(formats) as OptionItem[]);
      await this.checkFilters();
    } else {
      this.filter.setGenreFilter(
        this.parser.parseFilterUpdate(await this.api.getFiltersApi("genre")),
      );
      this.filter.setDemographicFilter(
        this.parser.parseFilterUpdate(await this.api.getFiltersApi("demographic")),
      );
      this.filter.setFormatsFilter(
        this.parser.parseFilterUpdate(await this.api.getFiltersApi("format")),
      );
      Application.setState(String(new Date().valueOf() / 1000), "last-filter-fetch");
    }
  }

  async getSettingsForm(): Promise<Form> {
    await this.checkFilters();
    return new MainSettings(this.filter, () => this.updateFilters(true));
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
        type: this.filter.getRecentSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      trending_manga: {
        id: "trending_manga",
        title: `Trending Manga${this.filter.getSectionTimesType() ? " of " + this.filter.getYearSettings() : ""}`,
        type: this.filter.getTrendingSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      trending_wt: {
        id: "trending_wt",
        title: `Trending WebToons${this.filter.getSectionTimesType() ? " of " + this.filter.getYearSettings() : ""}`,
        type: this.filter.getTrendingSectionDiffType()
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
        type: this.filter.getChapterSectionDiffType()
          ? DiscoverSectionType.simpleCarousel
          : DiscoverSectionType.chapterUpdates,
      },
      updatesNew: {
        id: "updatesNew",
        title: "Latest Updates (NEW)",
        type: this.filter.getChapterSectionDiffType()
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
    const page = metadata?.page ?? 1;
    const fetchSimple = async (id: string) =>
      this.parser.parseSectionSimple(page, await this.api.getJsonMangaApi(id, page));
    const fetchChapter = async (id: string) =>
      this.parser.parseSectionChapter(page, await this.api.getJsonMangaApi(id, page));
    switch (section.id) {
      case "popular":
      case "follow":
        return this.parser.parseSection(section.id, await this.api.getJsonMangaTopApi(section.id));
      case "recent":
        return this.filter.getRecentSectionDiffType()
          ? fetchSimple("recent")
          : fetchChapter("recent");
      case "trending_manga":
        return this.filter.getTrendingSectionDiffType()
          ? fetchSimple("trending_manga")
          : fetchChapter("trending_manga");
      case "trending_wt":
        return this.filter.getTrendingSectionDiffType()
          ? fetchSimple("trending_wt")
          : fetchChapter("trending_wt");
      case "completed":
        return fetchSimple("completed");
      case "updatesNew":
        return this.filter.getChapterSectionDiffType()
          ? fetchSimple("updatesNew")
          : fetchChapter("updatesNew");
      case "updatesHot":
        return this.filter.getChapterSectionDiffType()
          ? fetchSimple("updatesHot")
          : fetchChapter("updatesHot");
      case "genresSection":
        await this.updateFilters(true);
        return this.parser.parseGenreSection(
          metadata,
          this.filter.genres,
          this.filter.getHiddenGenresSettings(),
          (genreId) => getDefaultMetadata(this.filter, genreId),
        );
      default:
        return { items: [] };
    }
  }

  async getSearchResults(
    searchQuery: SearchQuery<SearchMetadata>,
    metadata: Metadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    let sorting = sortingOption;
    if (searchQuery.metadata === undefined) {
      searchQuery.metadata = getDefaultMetadata(this.filter);
    }
    sorting.id = sorting.id.split(searchQuery.title.length > 1 ? "#title" : "#empty")[0];
    const page = metadata?.page ?? 1;
    const genres = searchQuery.metadata?.genres ?? {};
    const formats = searchQuery.metadata?.formats ?? {};
    const demographic = searchQuery.metadata?.demographic ?? {};
    const status = searchQuery.metadata?.status ?? {};
    const types = searchQuery.metadata?.types ?? {};
    const mode = searchQuery.metadata?.mode ?? "and";
    const min_chapters = searchQuery.metadata?.minChap ?? 1;
    const [sortBy, orderBy] = sorting.id.split("$");
    const filters: Filters[] = [
      ...buildFilter(false, "genres_in[]", genres, formats),
      ...buildFilter(true, "genres_ex[]", genres, formats),
      ...buildFilter(false, "types[]", types),
      ...buildFilter(false, "demographics[]", demographic),
      ...buildFilter(false, "statuses[]", status),
    ];
    const search = await this.api.getJsonSearchApi(
      searchQuery.title,
      page,
      filters,
      mode as string,
      min_chapters as number,
      sortBy,
      orderBy,
    );
    return this.parser.parseSearchResults(page, search);
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    await this.checkFilters();
    if (searchQuery.metadata === undefined) {
      searchQuery.metadata = getDefaultMetadata(this.filter);
    }
    return new ComixAdvancedSearchForm(searchQuery, this.filter);
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

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const info = await this.api.getJsonMangaInfoApi(mangaId);
    return this.parser.parseMangaDetails(mangaId, info);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const items = await this.api.getAllChapterItems(
      sourceManga.mangaId,
      this.cookieStorageInterceptor,
    );
    return this.parser.parseChapters(sourceManga, items);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const pages = await this.api.getChapPagesData(chapter.chapterId, this.cookieStorageInterceptor);
    return this.parser.parseChapterDetails(chapter.chapterId, pages);
  }
}

export const Comix = new ComixExtension();
