/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// ---------------------------------------------------------------------------
// TODO:
//   - Novel support (currently I hard coded a ban on Novels)
//   - Settings form (e.g. choose discover-section ordering, content filters)
//   - Deepsearch option (slow but accurate to find alt-titles)
// ---------------------------------------------------------------------------

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
  Metadata,
  SearchMetadata,
  SeriesListItem,
  SortableListItem,
  FlameFilter,
} from "./models";
import { FlameApi, FlameInterceptor } from "./network";
import { FlameParser } from "./parsers";
import type FlameComicsConfig from "./pbconfig";
import { selectAdvanceSearch } from "./utils/filter";
import { generateSearchTagsLists } from "./utils/pickers";

// ---------------------------------------------------------------------------
// Discover section IDs (kept as constants to avoid typos across files)
// ---------------------------------------------------------------------------

const SECTION_POPULAR = "popular";
const SECTION_LATEST = "latest";
const SECTION_STAFF = "staff";

export class FlameComicsExtension implements ExtensionImpl<typeof FlameComicsConfig> {
  // --- Interceptors ---------------------------------------------------------

  /**
   * Rate-limit ourselves to be polite. The site doesn't publish limits, so
   * pick conservative numbers — bump later if everything proves stable.
   */
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });

  /**
   * Persistent cookie jar — needed to remember the `cf_clearance` cookie that
   * Paperback gives us after the user solves a Cloudflare challenge.
   */
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  flameInterceptor = new FlameInterceptor("main");

  // --- Services -------------------------------------------------------------

  api = new FlameApi();
  parser = new FlameParser(this.api);

  // --- Caching for search results -----------------------------------------------

  private Cache: {
    data: {
      candidates: SortableListItem[];
      params: FlameFilter;
    };
    timestamp: number;
  } | null = null;
  private readonly CANDIDATES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /** Check if cached data is still valid */
  private isCacheValid(): boolean {
    if (!this.Cache) return false;
    const age = Date.now() - this.Cache.timestamp;
    return age < this.CANDIDATES_CACHE_TTL;
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.flameInterceptor.registerInterceptor();
  }

  /**
   * Called by Paperback once the user has completed a Cloudflare challenge in
   * the embedded webview. Stash the `cf_clearance` cookie so subsequent
   * requests bypass the challenge wall.
   */
  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.name === "cf_clearance") {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Filter cache sections
  // -------------------------------------------------------------------------

  /**
   *
   */
  private async updateCache(): Promise<SortableListItem[]> {
    try {
      // Fetch fresh data
      const [latestJson, browseJson, simples] = await Promise.all([
        this.api.getLatestPage(),
        this.api.getBrowsePage(),
        this.api.getSimpleSeriesPage(),
      ]);

      let prePreCandidates: SeriesListItem[] = [];

      // Filter out novels
      for (const series of latestJson.pageProps.allSeries) {
        if (this.parser.isNovel(series)) continue;
        prePreCandidates.push(series);
      }

      const preCandidates = this.parser.addYearToLatestList(
        prePreCandidates,
        browseJson.pageProps.series,
      );
      let candidates = this.parser.addChapterCountToBrowseList(preCandidates, simples);

      const params = generateSearchTagsLists(candidates, browseJson.pageProps.initialFilters);
      // Cache the data
      this.Cache = {
        data: {
          candidates,
          params,
        },
        timestamp: Date.now(),
      };
      return candidates;
    } catch (e) {
      throw new Error(
        `[FlameComics] Error in updateCache:${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // Discover sections
  // -------------------------------------------------------------------------

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    // One round-trip serves them all (homepage `index.json`), so we just
    // declare each block as its own section here and reuse the cached
    // payload inside `getDiscoverSectionItems`.
    return [
      {
        id: SECTION_POPULAR,
        title: "Popular",
        type: DiscoverSectionType.featured,
      },
      {
        id: SECTION_LATEST,
        title: "Latest Updates",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: SECTION_STAFF,
        title: "Staff Picks",
        type: DiscoverSectionType.prominentCarousel,
      },

      // TODO: expose `genres` as a `DiscoverSectionType.genres` section so the
      // user can drill into per-genre listings from the home screen. Requires
      // first compiling the list of valid genre slugs.
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    _metadata: Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    // Single JSON request serves every block.
    const homepage = await this.api.getHomepage();
    return this.parser.parseHomepageSection(section.id, homepage);
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  /**
   * Search for series by title.
   */
  async getSearchResults(
    searchQuery: SearchQuery<SearchMetadata>,
    metadata: Metadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    try {
      const page = metadata?.page ?? 1;
      const pageSize = 100; // usefull for testing refresh crash bug
      const title = (searchQuery.title ?? "").trim().toLowerCase();

      let candidates: SortableListItem[];

      // Check if cache is still valid
      if (this.Cache && this.isCacheValid()) {
        // Use cached data
        candidates = [...this.Cache.data.candidates];
      } else {
        candidates = await this.updateCache();
      }

      // Filter by title if provided
      if (title.length > 0) {
        candidates = candidates.filter((c) => c.title.toLowerCase().includes(title));
      }

      // Apply sorting
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
          let i = candidates.length,
            j,
            temp;
          while (--i > 0) {
            j = Math.floor(Math.random() * (i + 1));
            temp = candidates[j];
            candidates[j] = candidates[i];
            candidates[i] = temp;
          }
          break;
      }

      // Paginate: 100 results per page
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      let paginatedCandidates = candidates.slice(startIndex, endIndex);

      // Applying the advanced search after the pagination because we don't want to scan all the db per page
      if (searchQuery.metadata && this.Cache)
        paginatedCandidates = selectAdvanceSearch(
          paginatedCandidates,
          searchQuery.metadata,
          this.Cache.data.params,
        );

      const items = paginatedCandidates.map((c) =>
        this.parser.toSearchResultItem(c, sortingOption),
      );

      // Return pagination metadata: indicate next page exists if there are more results
      const hasNextPage = endIndex < candidates.length;

      // returning metadata: undefined still cause a crash when reloading but for
      // now it's the best way to signal the end of pages
      return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
    } catch (e) {
      throw new Error(
        `[FlameComics] BUILD_ID discovery failed, using fallback: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }

  // enabling advanced filters and setting up the filter page
  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    if (!this.Cache || !this.isCacheValid()) await this.updateCache();
    return new FlameAdvancedSearchForm(searchQuery, this.Cache?.data.params);
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

  // -------------------------------------------------------------------------
  // Manga / chapters / reader
  // -------------------------------------------------------------------------

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const response = await this.api.getSeries(mangaId);
    return this.parser.parseSeriesDetail(mangaId, response);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    // Endpoint serves both detail + chapters, so one request is enough.
    const response = await this.api.getSeries(sourceManga.mangaId);
    return this.parser.parseChapters(sourceManga, response);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    // We packed `<series_id>:<token>` into the chapterId at parse time.
    // Fall back to `additionalInfo.token` if the format ever changes.
    const [seriesIdPart, tokenPart] = chapter.chapterId.split(":");
    const seriesId = seriesIdPart ?? chapter.sourceManga?.mangaId;
    const token =
      tokenPart ??
      (typeof chapter.additionalInfo?.token === "string"
        ? (chapter.additionalInfo.token as string)
        : undefined);

    if (!seriesId || !token) {
      throw new Error(
        `[FlameComics] Cannot fetch chapter — missing series_id/token in chapterId=${chapter.chapterId}`,
      );
    }

    const response = await this.api.getChapter(String(seriesId), token);
    return this.parser.parseChapterDetails(chapter.chapterId, response);
  }
}

export const FlameComics = new FlameComicsExtension();
