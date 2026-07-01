/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// TODO:
//   - Novel support (currently novels are filtered out)
//   - Settings form (discover ordering, content filters)
//   - Deepsearch option (slow but finds alt-titles)

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

import { FlameAdvancedSearchForm } from "./forms/search";
import type {
  ChapterReaderResponse,
  FlameFilter,
  HomepageResponse,
  LatestProps,
  Metadata,
  SearchMetadata,
  SearchProps,
  SeriesDetailResponse,
  SimpleSeriesListItem,
  SortableListItem,
} from "./models";
import { FlameInterceptor, fetchNextData, fetchSimpleSeries } from "./network";
import {
  applyAdvancedFilters,
  buildFilterOptions,
  enrichLatestWithBrowseData,
  isNovel,
  parseChapterDetails,
  parseChapters,
  parseHomepageSection,
  parseSeriesDetail,
  toSearchResultItem,
  toSortableList,
} from "./parsers";
import type FlameComicsConfig from "./pbconfig";

const SECTION_POPULAR = "popular";
const SECTION_LATEST = "latest";
const SECTION_STAFF = "staff";

const CANDIDATES_CACHE_TTL = 5 * 60 * 1000;
const PAGE_SIZE = 100;

export class FlameComicsExtension implements ExtensionImpl<typeof FlameComicsConfig> {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });

  // Remembers the `cf_clearance` cookie after a Cloudflare challenge is solved.
  cookieStorageInterceptor = new CookieStorageInterceptor({ storage: "stateManager" });
  flameInterceptor = new FlameInterceptor("main");

  private candidateCache: {
    data: { candidates: SortableListItem[]; params: FlameFilter };
    timestamp: number;
  } | null = null;

  private isCacheValid(): boolean {
    return (
      !!this.candidateCache && Date.now() - this.candidateCache.timestamp < CANDIDATES_CACHE_TTL
    );
  }

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.flameInterceptor.registerInterceptor();
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name === "cf_clearance") this.cookieStorageInterceptor.setCookie(cookie);
    }
  }

  /** Aggregate latest + browse + simple lists into one sortable/filterable candidate set. */
  private async refreshCandidateCache(): Promise<SortableListItem[]> {
    const [latest, browse, simple] = await Promise.all([
      fetchNextData<LatestProps>(["latest.json"]),
      fetchNextData<SearchProps>(["browse.json"]),
      fetchSimpleSeries<SimpleSeriesListItem[]>(),
    ]);

    const nonNovels = latest.pageProps.allSeries.filter((s) => !isNovel(s));
    const enriched = enrichLatestWithBrowseData(nonNovels, browse.pageProps.series);
    const candidates = toSortableList(enriched, simple);
    const params = buildFilterOptions(candidates, browse.pageProps.initialFilters);

    this.candidateCache = { data: { candidates, params }, timestamp: Date.now() };
    return candidates;
  }

  private async getCandidates(): Promise<SortableListItem[]> {
    if (this.isCacheValid()) return [...this.candidateCache!.data.candidates];
    return this.refreshCandidateCache();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      { id: SECTION_POPULAR, title: "Popular", type: DiscoverSectionType.featured },
      { id: SECTION_LATEST, title: "Latest Updates", type: DiscoverSectionType.chapterUpdates },
      { id: SECTION_STAFF, title: "Staff Picks", type: DiscoverSectionType.prominentCarousel },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    _metadata: Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const homepage = await fetchNextData<HomepageResponse>(["index.json"]);
    return parseHomepageSection(section.id, homepage);
  }

  async getSearchResults(
    searchQuery: SearchQuery<SearchMetadata>,
    metadata: Metadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const title = (searchQuery.title ?? "").trim().toLowerCase();

    let candidates = await this.getCandidates();

    if (title.length > 0) {
      candidates = candidates.filter((c) => c.title.toLowerCase().includes(title));
    }

    // Filter before paginating so pages are dense and hasNextPage is accurate.
    if (searchQuery.metadata && this.candidateCache) {
      candidates = applyAdvancedFilters(
        candidates,
        searchQuery.metadata,
        this.candidateCache.data.params,
      );
    }

    switch (sortingOption.id) {
      case "latest":
        candidates.sort((a, b) => (b.updated ?? b.last_edit) - (a.updated ?? a.last_edit));
        break;
      case "title_asc":
        candidates.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        candidates.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "likes":
        candidates.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
        break;
      case "year":
        candidates.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case "random":
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        break;
    }

    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const items = candidates
      .slice(startIndex, endIndex)
      .map((c) => toSearchResultItem(c, sortingOption));

    return { items, metadata: endIndex < candidates.length ? { page: page + 1 } : undefined };
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    if (!this.isCacheValid()) await this.refreshCandidateCache();
    return new FlameAdvancedSearchForm(searchQuery, this.candidateCache?.data.params);
  }

  async getSortingOptions(_query: SearchQuery<SearchMetadata>): Promise<SortingOption[]> {
    return [
      { id: "latest", label: "Latest Update" },
      { id: "title_asc", label: "Title ↑" },
      { id: "title_desc", label: "Title ↓" },
      { id: "likes", label: "Most Liked" },
      { id: "year", label: "Year" },
      { id: "random", label: "Random" },
    ];
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const response = await fetchNextData<SeriesDetailResponse>(["series", `${mangaId}.json`], {
      id: mangaId,
    });
    return parseSeriesDetail(mangaId, response);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    // One endpoint serves detail + chapters.
    const response = await fetchNextData<SeriesDetailResponse>(
      ["series", `${sourceManga.mangaId}.json`],
      { id: sourceManga.mangaId },
    );
    return parseChapters(sourceManga, response);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    // chapterId is "<series_id>:<token>"; fall back to additionalInfo.token.
    const [seriesIdPart, tokenPart] = chapter.chapterId.split(":");
    const seriesId = seriesIdPart ?? chapter.sourceManga?.mangaId;
    const token =
      tokenPart ??
      (typeof chapter.additionalInfo?.token === "string"
        ? chapter.additionalInfo.token
        : undefined);

    if (!seriesId || !token) {
      throw new Error(
        `[FlameComics] Cannot fetch chapter — missing series_id/token in chapterId=${chapter.chapterId}`,
      );
    }

    const response = await fetchNextData<ChapterReaderResponse>(
      ["series", String(seriesId), `${token}.json`],
      { id: String(seriesId), token },
    );
    return parseChapterDetails(chapter.chapterId, response);
  }
}

export const FlameComics = new FlameComicsExtension();
