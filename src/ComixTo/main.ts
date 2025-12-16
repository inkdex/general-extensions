import {
  DiscoverSectionType,
  Form,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
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
import { Forms } from "./forms";
import type { Metadata } from "./models";
import { MainInterceptor, mainRateLimiter } from "./network";
import { JsonParser } from "./parsers";
import { globalFilters } from "./utils";

type ComixToImplementation = SettingsFormProviding &
  Extension &
  DiscoverSectionProviding &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding;
export const parse = new JsonParser();
export const filter = new globalFilters();
export class ComiToExtension implements ComixToImplementation {
  async getSettingsForm(): Promise<Form> {
    return new Forms();
  }

  mainInterceptor = new MainInterceptor("main");

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
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

    return [get_popular, get_follow, get_recent, get_updatesHot, get_updatesNew];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular":
        return await parse.parseSectionPopular("popular");
      case "follow":
        return await parse.parseSectionFollow("follow");
      case "recent":
        return await parse.parseSectionRecent("recent", metadata);
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
    return parse.parseSearchResults(query, metadata, sortingOption);
  }
  async getSortingOptions(): Promise<SortingOption[]> {
    return filter.order;
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

export const ComixTo = new ComiToExtension();
