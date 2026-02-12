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
import { MainSettings } from "./forms";
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
    await filter.checkFilters();
    return new MainSettings();
  }

  mainInterceptor = new MainInterceptor("main");

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const sections: DiscoverSection[] = [];
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
      title: "Trending Manga",
      type: DiscoverSectionType.simpleCarousel,
    };
    const get_trending_wt: DiscoverSection = {
      id: "trending_wt",
      title: "Trending WebToons",
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
    type Pair<T, K> = [T, K];
    const names: Pair<string, DiscoverSection>[] = [
      ["popular", get_popular],
      ["recent", get_recent],
      ["follow", get_follow],
      ["trending_manga", get_trending_manga],
      ["trending_wt", get_trending_wt],
      ["completed", get_completed],
      ["updatesHot", get_updatesHot],
      ["updatesNew", get_updatesNew],
    ];
    names.forEach(([_, section]) => {
      sections.push(section);
    });
    return sections;
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
