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
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import { MainSettings } from "./forms";
import type { Metadata } from "./models";
import { MainInterceptor, mainRateLimiter } from "./network";
import { JsonParser } from "./parsers";
import { globalFilters } from "./utils/globalFilters";

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
    const get_popular: DiscoverSection = {
      id: "popular",
      title: "Popular",
      type: DiscoverSectionType.featured,
    };
    const get_follow: DiscoverSection = {
      id: "follow",
      title: "Most Follows New Comics",
      type: DiscoverSectionType.prominentCarousel,
    };
    const get_recent: DiscoverSection = {
      id: "recent",
      title: "Recently Added",
      type: DiscoverSectionType.simpleCarousel,
    };
    const get_trending_manga: DiscoverSection = {
      id: "trending_manga",
      title: `Trending Manga of ${filter.getYearSettings()}`,
      type: DiscoverSectionType.simpleCarousel,
    };
    const get_trending_wt: DiscoverSection = {
      id: "trending_wt",
      title: `Trending WebToons of ${filter.getYearSettings()}`,
      type: DiscoverSectionType.simpleCarousel,
    };
    const get_completed: DiscoverSection = {
      id: "completed",
      title: "Completed",
      type: DiscoverSectionType.simpleCarousel,
    };
    const get_updatesHot: DiscoverSection = {
      id: "updatesHot",
      title: "Latest Updates (HOT)",
      type: DiscoverSectionType.chapterUpdates,
    };
    const get_updatesNew: DiscoverSection = {
      id: "updatesNew",
      title: "Latest Updates (NEW)",
      type: DiscoverSectionType.chapterUpdates,
    };
    return [
      get_popular,
      get_recent,
      get_follow,
      get_trending_manga,
      get_trending_wt,
      get_completed,
      get_updatesHot,
      get_updatesNew,
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular":
        return await parse.parseSection("popular", undefined);
      case "follow":
        return await parse.parseSection("follow", undefined);
      case "recent":
        return await parse.parseSection("recent", metadata);
      case "trending_manga":
        return await parse.parseSection("trending_manga", metadata);
      case "trending_wt":
        return await parse.parseSection("trending_wt", metadata);
      case "completed":
        return await parse.parseSection("completed", metadata);
      case "updatesNew":
        return await parse.parseSectionChUp("updatesNew", metadata);
      case "updatesHot":
        return await parse.parseSectionChUp("updatesHot", metadata);
      default:
        return { items: [] };
    }
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    return filter.getFilters();
  }

  getSearchResults(
    query: SearchQuery,
    metadata: Metadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    sortingOption.id = sortingOption.id.split(query.title.length > 1 ? "#title" : "#empty")[0];
    return parse.parseSearchResults(query, metadata, sortingOption);
  }
  async getSortingOptions(query: SearchQuery): Promise<SortingOption[]> {
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
      { id: "total_views$asc" + idSuffix, label: "Total Views ↑" },
      { id: "total_views$desc" + idSuffix, label: "Total Views ↓" },
      { id: "followed_count$asc" + idSuffix, label: "Most Follows ↑" },
      { id: "followed_count$desc" + idSuffix, label: "Most Follows ↓" },
      { id: "views_7d$asc" + idSuffix, label: "Most Views 7 Days ↑" },
      { id: "views_7d$desc" + idSuffix, label: "Most Views 7 Days ↓" },
      { id: "views_30d$asc" + idSuffix, label: "Most Views 1 Month ↑" },
      { id: "views_30d$desc" + idSuffix, label: "Most Views 1 Month ↓" },
      { id: "views_90d$asc" + idSuffix, label: "Most Views 3 Month ↑" },
      { id: "views_90d$desc" + idSuffix, label: "Most Views 3 Month ↓" },
    ];
    if (query.title.length > 1) {
      sortingOptions.unshift({ id: "relevance$desc" + idSuffix, label: "Best Match" });
      sortingOptions = sortingOptions.filter((id) => id.id !== "views_30d$desc#empty");
    }
    return sortingOptions;
  }

  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return parse.parseMangaDetails(mangaId);
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    return parse.parseChapters(sourceManga);
  }
  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return parse.parseChapterDetails(chapter.chapterId);
  }
}

export const Comix = new ComixExtension();
