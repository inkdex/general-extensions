// Zzizz Extension for Paperback - interacts with zzizz.xyz
// This file contains the main extension logic, including search, details, chapters, and discover sections.
// Comments focus on intent, edge cases, and maintainability for future developers.

import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    ContentRating,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    Extension,
    Form,
    MangaProviding,
    PagedResults,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SettingsFormProviding,
    SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";
import {
    DEFAULT_SORT_OPTIONS,
    FALLBACK_GENRES,
    FALLBACK_SORT_OPTIONS,
} from "./models";
import { ZizParser } from "./parser";
import {
    DEFAULT_CONTENT_RATING,
    DOMAIN,
    LANGUAGE,
    SEARCH_MANGA_SELECTOR,
    USE_POST_IDS,
} from "./pbconfig";

// Centralized constants for configuration and selectors
const CONSTANTS = {
    RATE_LIMIT: {
        REQUESTS: 20,
        INTERVAL: 1,
    },
    SORTING: {
        VALID_SORTS: [
            "",
            "latest",
            "popular",
            "rating",
            "name_asc",
            "name_desc",
        ],
    },
    SELECTORS: {
        SEARCH_MANGA: ".content-grid a[href*='/manga/']",
        PAGINATION_NEXT:
            ".pagination a[title='Next Page'], .pagination a:contains('Next')",
        PAGINATION_NUMBERS: ".pagination .page-link",
    },
} as const;

class ZizExtension
    implements
        Extension,
        SearchResultsProviding,
        MangaProviding,
        ChapterProviding,
        DiscoverSectionProviding,
        SettingsFormProviding
{
    // Extension metadata and configuration
    readonly domain: string = DOMAIN;
    readonly name: string = "Zzizz";
    readonly defaultContentRating: ContentRating = DEFAULT_CONTENT_RATING;
    readonly language: string = LANGUAGE;
    readonly usePostIds: boolean = USE_POST_IDS;
    readonly searchMangaSelector: string = SEARCH_MANGA_SELECTOR;
    readonly directoryPath: string = "manga";

    // HTML parser for manga details, chapters, etc.
    parser: ZizParser = new ZizParser();

    // Maps genre labels to IDs for use in filters and details
    genreIdLabelMap: Record<string, string> = {};

    // Global rate limiter to avoid hitting server too fast
    globalRateLimiter = new BasicRateLimiter("ratelimiter", {
        numberOfRequests: CONSTANTS.RATE_LIMIT.REQUESTS,
        bufferInterval: CONSTANTS.RATE_LIMIT.INTERVAL,
        ignoreImages: true,
    });

    // In-memory cache for filter options (genres only) for the session
    private filterOptionsCache: {
        genres: { id: string; value: string }[];
    } | null = null;

    // In-memory cache for sorting options for the session
    private sortingOptionsCache: { id: string; label: string }[] | null = null;

    // No initialization needed for this extension, but method required by interface
    async initialise(): Promise<void> {}

    // Settings UI (not used, but required by interface)
    async getSettingsForm(): Promise<Form> {
        return {
            getSections: () => [],
            reloadForm: () => {},
            requiresExplicitSubmission: false,
        };
    }

    /**
     * Fetches manga details by ID.
     * Normalizes the ID to ensure it is just the slug, not a full URL.
     * Always fetches the latest data from the site.
     */
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        // Normalize mangaId to ensure it doesn't include /manga/ or a full URL
        let cleanId = mangaId;
        if (cleanId.startsWith("http")) {
            const match = cleanId.match(/\/manga\/([^/]+)/);
            if (match) cleanId = match[1];
        } else if (cleanId.startsWith("/manga/")) {
            cleanId = cleanId.replace("/manga/", "");
        }
        const url = `${this.domain}/manga/${cleanId}/`;
        const [, buffer] = await Application.scheduleRequest({
            url,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return await this.parser.parseMangaDetails($, cleanId, this);
    }

    /**
     * Fetches the chapter list for a manga.
     * Always fetches the latest data from the site.
     */
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const url = `${this.domain}/manga/${sourceManga.mangaId}/`;
        const [, buffer] = await Application.scheduleRequest({
            url,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return this.parser.parseChapterList($, sourceManga, this);
    }

    /**
     * Fetches details for a specific chapter (pages/images).
     * Always fetches the latest data from the site.
     */
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        // Always fetch fresh data
        const url = `${this.domain}${chapter.chapterId}`;
        const [, buffer] = await Application.scheduleRequest({
            url,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return await this.parser.parseChapterDetails($, chapter);
    }

    /**
     * Returns the discover sections for the UI (e.g., Latest Updates, Trending).
     * These are static, but the items are fetched dynamically.
     */
    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "latest_updates",
                title: "Latest Updates",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "latest_projects",
                title: "Latest Projects",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "trending_day",
                title: "Trending (Day)",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "trending_week",
                title: "Trending (Week)",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "trending_all",
                title: "Trending (All)",
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    /**
     * Fetches items for a discover section (e.g., latest updates, trending).
     * No pagination for homepage sections.
     */
    async getDiscoverSectionItems(
        section: DiscoverSection,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        metadata: { page?: number } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const url = this.domain;
        const [, buffer] = await Application.scheduleRequest({
            url,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        const items = await this.parser.parseDiscoverSections($, section);
        // No pagination for homepage sections
        return { items, metadata: undefined };
    }

    /**
     * Provides search filters (genres only, dynamically fetched from the site).
     * Caches the result for the session for performance.
     */
    async getSearchFilters(): Promise<SearchFilter[]> {
        // Check cache first
        if (this.filterOptionsCache) {
            const { genres } = this.filterOptionsCache;
            return this.buildSearchFilters(genres);
        }
        // Fetch fresh data from the /mangas page
        const url = `${this.domain}/mangas/`;
        const [, buffer] = await Application.scheduleRequest({
            url,
            method: "GET",
        });
        const html = Application.arrayBufferToUTF8String(buffer);
        const $ = cheerio.load(html);
        // Parse all filter options in one pass
        const genreOptions: { id: string; value: string }[] = [];
        // Reset genre mapping
        this.genreIdLabelMap = {};
        // Parse genres from the actual Zzizz website structure
        $(
            "a[href*='genre'], .genre-filter a, .filter-genre a, a:contains('Genres')",
        ).each((_, el) => {
            const href = $(el).attr("href") || "";
            const label = $(el).text().trim();
            // Extract genre ID from href or use label as ID
            let id = "";
            if (href.includes("genre=")) {
                const match = href.match(/genre=([^&]+)/);
                id = match
                    ? decodeURIComponent(match[1])
                    : label.toLowerCase().replace(/\s+/g, "-");
            } else {
                id = label.toLowerCase().replace(/\s+/g, "-");
            }
            if (label && label !== "Genres" && label !== "All Genres") {
                genreOptions.push({ id, value: label });
                this.genreIdLabelMap[label.toLowerCase()] = id;
            }
        });
        // If no dynamic genres found, use the actual genres from the website
        if (genreOptions.length === 0) {
            FALLBACK_GENRES.forEach((genre) => {
                const id = genre.toLowerCase().replace(/\s+/g, "-");
                genreOptions.push({ id, value: genre });
                this.genreIdLabelMap[genre.toLowerCase()] = id;
            });
        }
        // Cache the results for the session
        this.filterOptionsCache = {
            genres: genreOptions,
        };
        return this.buildSearchFilters(genreOptions);
    }

    /**
     * Helper to build the SearchFilter[] array for the UI.
     */
    private buildSearchFilters(
        genres: { id: string; value: string }[],
    ): SearchFilter[] {
        return [
            {
                type: "multiselect",
                id: "genre",
                title: "Genre",
                options: genres,
                value: {},
                allowExclusion: false,
                allowEmptySelection: true,
                maximum: undefined,
            },
        ];
    }

    /**
     * Helper to build the search URL with all parameters and pagination.
     */
    private buildSearchUrl(params: string[], page: number): string {
        const urlParams = [...params];
        // Add page parameter if not first page
        if (page > 1) {
            urlParams.push(`page=${page}`);
        }
        return `${this.domain}/mangas/?${urlParams.join("&")}`;
    }

    /**
     * Helper to extract search parameters from query and sorting.
     * Handles filters, search query, and sorting method.
     */
    private extractSearchParams(
        query: SearchQuery,
        sortingMethod?: { id: string; label: string },
    ): string[] {
        const params: string[] = [];
        // Add filters
        if (query.filters) {
            for (const filter of query.filters) {
                if (filter.id === "genre" && typeof filter.value === "object") {
                    for (const [genreId, state] of Object.entries(
                        filter.value,
                    )) {
                        if (state === "included") {
                            params.push(`genre=${encodeURIComponent(genreId)}`);
                        }
                    }
                }
            }
        }
        // Add search parameter - Zzizz uses 'q' for search
        if (query.title && query.title.trim().length > 0) {
            params.push(`q=${encodeURIComponent(query.title.trim())}`);
        }
        // Add sorting parameter - Zzizz uses 'sort' for sorting
        const validSorts = CONSTANTS.SORTING.VALID_SORTS as readonly string[];
        let orderValue = "";
        if (sortingMethod?.id) {
            orderValue = sortingMethod.id;
        } else {
            const queryObj = query as unknown as Record<string, unknown>;
            orderValue =
                (queryObj.sort as string) || (queryObj.order as string) || "";
        }
        if (!validSorts.includes(orderValue)) {
            orderValue = "";
        }
        params.push(`sort=${encodeURIComponent(orderValue)}`);
        return params;
    }

    /**
     * Performs search with advanced filters and pagination.
     * Handles pagination detection and dynamic selectors.
     */
    async getSearchResults(
        query: SearchQuery,
        metadata: { page?: number } | undefined,
        sortingMethod?: { id: string; label: string },
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;
        const params = this.extractSearchParams(query, sortingMethod);
        const url = this.buildSearchUrl(params, page);
        const [, buffer] = await Application.scheduleRequest({
            url,
            method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        const results = await this.parser.parseSearchResults($);
        // Pagination detection
        let hasNextPage = false;
        if (query.title || query.filters) {
            // For filtered/search, look for Next button
            hasNextPage = $(CONSTANTS.SELECTORS.PAGINATION_NEXT).length > 0;
        } else {
            // For normal search, use page number block
            let maxPage = 1;
            $(CONSTANTS.SELECTORS.PAGINATION_NUMBERS).each((_, el) => {
                const text = $(el).text().trim();
                const num = parseInt(text);
                if (!isNaN(num) && num > maxPage) maxPage = num;
            });
            hasNextPage = page < maxPage;
        }
        // Update pagination selectors based on actual Zzizz website structure
        const paginationNav = $(".pagination");
        if (paginationNav.length > 0) {
            // Check for Next button
            const nextButton = paginationNav.find(
                "a[title='Next Page'], a:contains('Next')",
            );
            if (nextButton.length > 0) {
                hasNextPage = true;
            } else {
                // Check page numbers
                let maxPage = 1;
                paginationNav.find(".page-link").each((_, el) => {
                    const text = $(el).text().trim();
                    const num = parseInt(text);
                    if (!isNaN(num) && num > maxPage) maxPage = num;
                });
                hasNextPage = page < maxPage;
            }
        }
        return {
            items: results,
            metadata: hasNextPage ? { page: page + 1 } : undefined,
        };
    }

    /**
     * Dynamically fetches and caches sorting options for the session.
     * Falls back to static options if the site structure changes.
     */
    public async getSortingOptions(): Promise<{ id: string; label: string }[]> {
        if (this.sortingOptionsCache) {
            return this.sortingOptionsCache;
        }
        try {
            const url = `${this.domain}/mangas/`;
            const [, buffer] = await Application.scheduleRequest({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const sortingOptions: { id: string; label: string }[] = [];
            // Parse sorting options from the actual Zzizz website structure
            $(
                "a[href*='sort'], .sort-filter a, .filter-sort a, a:contains('Sort By')",
            ).each((_, el) => {
                const href = $(el).attr("href") || "";
                const label = $(el).text().trim();
                // Extract sort ID from href or use label as ID
                let id = "";
                if (href.includes("sort=")) {
                    const match = href.match(/sort=([^&]+)/);
                    id = match
                        ? decodeURIComponent(match[1])
                        : this.mapSortLabelToId(label);
                } else {
                    id = this.mapSortLabelToId(label);
                }
                if (label && label !== "Sort By") {
                    sortingOptions.push({ id, label });
                }
            });
            // If no dynamic options found, use the actual sorting options from the website
            if (sortingOptions.length === 0) {
                sortingOptions.push(...FALLBACK_SORT_OPTIONS);
            }
            this.sortingOptionsCache = sortingOptions;
            return sortingOptions;
        } catch {
            // Return the actual sorting options from the website on error
            return [...DEFAULT_SORT_OPTIONS];
        }
    }

    /**
     * Helper method to map sort labels to IDs.
     * Handles edge cases where the label does not match the expected ID.
     */
    private mapSortLabelToId(label: string): string {
        const labelLower = label.toLowerCase();
        if (
            labelLower.includes("most recent") ||
            labelLower.includes("recent")
        ) {
            return "latest";
        } else if (
            labelLower.includes("most popular") ||
            labelLower.includes("popular")
        ) {
            return "popular";
        } else if (
            labelLower.includes("best rating") ||
            labelLower.includes("rating")
        ) {
            return "rating";
        } else if (
            labelLower.includes("name (a-z)") ||
            labelLower.includes("a-z")
        ) {
            return "name_asc";
        } else if (
            labelLower.includes("name (z-a)") ||
            labelLower.includes("z-a")
        ) {
            return "name_desc";
        } else {
            return label.toLowerCase().replace(/\s+/g, "-");
        }
    }
}

// Export the extension instance
export const Zzizz = new ZizExtension();
