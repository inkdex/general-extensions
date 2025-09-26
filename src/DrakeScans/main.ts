// DrakeScans Extension for Paperback
// -----------------------------------
// This extension enables Paperback to search, browse, and read manga from drakecomic.org.
// It implements all required interfaces for search, discovery, manga details, chapter listing, and chapter page retrieval.

import {
    Chapter,
    ChapterDetails,
    CloudflareBypassRequestProviding,
    CloudflareError,
    ContentRating,
    CookieStorageInterceptor,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    Extension,
    MangaProviding,
    PagedResults,
    Response,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SortingOption,
    SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";
import {
    DOMAIN,
    LATEST_UPDATE_SECTION_ID,
    LATEST_UPDATE_SECTION_TITLE,
    POPULAR_SERIES_ALL_SECTION_ID,
    POPULAR_SERIES_ALL_SECTION_TITLE,
    POPULAR_SERIES_MONTH_SECTION_ID,
    POPULAR_SERIES_MONTH_SECTION_TITLE,
    POPULAR_SERIES_WEEK_SECTION_ID,
    POPULAR_SERIES_WEEK_SECTION_TITLE,
    POPULAR_TODAY_SECTION_ID,
    POPULAR_TODAY_SECTION_TITLE,
} from "./models";
import { DrakeScansParser } from "./parsers";

class DrakeCookieInterceptor extends CookieStorageInterceptor {
    async interceptRequest(
        request: import("@paperback/types").Request,
    ): Promise<import("@paperback/types").Request> {
        const req = await super.interceptRequest(request);
        req.headers = {
            ...(req.headers ?? {}),
            referer: `${DOMAIN}/`,
            origin: `${DOMAIN}/`,
            "user-agent": await Application.getDefaultUserAgent(),
        };
        return req;
    }
}

class DrakeScansExtension
    implements
        Extension,
        DiscoverSectionProviding,
        SearchResultsProviding,
        MangaProviding,
        CloudflareBypassRequestProviding
{
    readonly domain: string = DOMAIN;
    parser: DrakeScansParser = new DrakeScansParser();

    private idMap: Record<string, string> = {};
    private filterOptionsCache: SearchFilter[] | null = null;
    private sortingOptionsCache: SortingOption[] | null = null;
    private filterSortCachePromise: Promise<void> | null = null;
    private homepageCache: cheerio.CheerioAPI | null = null;
    private homepageCachePromise: Promise<cheerio.CheerioAPI> | null = null;

    cookieStorageInterceptor = new DrakeCookieInterceptor({
        storage: "stateManager",
    });

    async initialise(): Promise<void> {
        this.cookieStorageInterceptor.registerInterceptor();
    }

    private async getHomepageData(): Promise<cheerio.CheerioAPI> {
        // Cache homepage to avoid multiple requests
        if (this.homepageCache) {
            return this.homepageCache;
        }

        if (this.homepageCachePromise) {
            return this.homepageCachePromise;
        }

        this.homepageCachePromise = (async () => {
            try {
                const [__, buffer] = await this.request({
                    url: `${DOMAIN}/`,
                    method: "GET",
                });
                const $ = cheerio.load(
                    Application.arrayBufferToUTF8String(buffer),
                );
                this.homepageCache = $;
                return $;
            } finally {
                this.homepageCachePromise = null;
            }
        })();

        return this.homepageCachePromise;
    }

    private clearHomepageCache(): void {
        this.homepageCache = null;
        this.homepageCachePromise = null;
    }

    private sanitizeMangaId(mangaId: string): string {
        return String(mangaId).replace(/[^a-zA-Z0-9]/g, "");
    }

    private processFilterValue(
        filter: { value: string | Record<string, unknown> },
        type: "status" | "type",
    ): string {
        const currentValue =
            typeof filter.value === "string" ? filter.value : "";
        if (!this.filterOptionsCache || !currentValue) return currentValue;

        for (const searchFilter of this.filterOptionsCache) {
            if (
                searchFilter.id === type &&
                "options" in searchFilter &&
                searchFilter.options
            ) {
                for (const option of searchFilter.options) {
                    if (
                        option.id === currentValue &&
                        typeof option.value === "string"
                    ) {
                        return String(option.value);
                    }
                }
                break;
            }
        }
        return currentValue;
    }

    private getGenreNumericId(genreId: string): string | null {
        // Convert genre display name back to numeric ID for URL parameters
        if (!this.filterOptionsCache) return null;

        for (const searchFilter of this.filterOptionsCache) {
            if (
                searchFilter.id === "genre" &&
                "options" in searchFilter &&
                searchFilter.options
            ) {
                for (const option of searchFilter.options) {
                    const extendedOption = option as {
                        urlParam?: string;
                        id: string;
                        value: string;
                        label: string;
                    };
                    if (option.id === genreId && extendedOption.urlParam) {
                        return String(extendedOption.urlParam);
                    }
                }
            }
        }
        return null;
    }

    private async parseAndCacheFilters(): Promise<void> {
        if (this.filterOptionsCache && this.sortingOptionsCache) {
            return;
        }

        if (this.filterSortCachePromise) {
            return this.filterSortCachePromise;
        }

        this.filterSortCachePromise = (async () => {
            try {
                const [__, buffer] = await this.request({
                    url: `${DOMAIN}/manga/`,
                    method: "GET",
                });
                const $ = cheerio.load(
                    Application.arrayBufferToUTF8String(buffer),
                );

                this.filterOptionsCache = this.parser.parseFilterOptions($);
                this.sortingOptionsCache = this.parser.parseSortingOptions($);
            } catch (error) {
                if (error instanceof CloudflareError) {
                    throw error;
                }
                this.filterOptionsCache = [];
                this.sortingOptionsCache = [];
            } finally {
                this.filterSortCachePromise = null;
            }
        })();

        return this.filterSortCachePromise;
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: POPULAR_TODAY_SECTION_ID,
                title: POPULAR_TODAY_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: LATEST_UPDATE_SECTION_ID,
                title: LATEST_UPDATE_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: POPULAR_SERIES_WEEK_SECTION_ID,
                title: POPULAR_SERIES_WEEK_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: POPULAR_SERIES_MONTH_SECTION_ID,
                title: POPULAR_SERIES_MONTH_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: POPULAR_SERIES_ALL_SECTION_ID,
                title: POPULAR_SERIES_ALL_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        _metadata: { page?: number } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = _metadata?.page ?? 1;

        // Use cached homepage for first page, request additional pages as needed
        let $: cheerio.CheerioAPI;
        if (page === 1) {
            $ = await this.getHomepageData();
        } else {
            const url = `${DOMAIN}/page/${page}`;
            const [__, buffer] = await this.request({ url, method: "GET" });
            $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        }

        // Handle Latest Update section with pagination
        if (section.id === LATEST_UPDATE_SECTION_ID) {
            try {
                const { items, hasNextPage } =
                    await this.parser.parseLatestUpdate($);
                const realHasNextPage = hasNextPage && items.length > 0;
                if (Array.isArray(items)) {
                    items.forEach((item) => {
                        if (item && "mangaId" in item && item.mangaId) {
                            const sanitized = this.sanitizeMangaId(
                                item.mangaId,
                            );
                            this.idMap[sanitized] = item.mangaId;
                        }
                    });
                }
                return {
                    items,
                    metadata: realHasNextPage
                        ? { page: page + 1, hasNextPage: true }
                        : undefined,
                };
            } catch (error) {
                if (error instanceof CloudflareError) {
                    throw error;
                }
                return { items: [], metadata: undefined };
            }
        }

        if (section.id === POPULAR_TODAY_SECTION_ID) {
            const items = await this.parser.parsePopularToday($);
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = this.sanitizeMangaId(item.mangaId);
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return { items, metadata: undefined };
        }

        if (section.id === POPULAR_SERIES_WEEK_SECTION_ID) {
            const items = (await this.parser.parsePopularSeriesWeekly($)) || [];
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = this.sanitizeMangaId(item.mangaId);
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return { items, metadata: undefined };
        }

        if (section.id === POPULAR_SERIES_MONTH_SECTION_ID) {
            const items =
                (await this.parser.parsePopularSeriesMonthly($)) || [];
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = this.sanitizeMangaId(item.mangaId);
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return { items, metadata: undefined };
        }

        if (section.id === POPULAR_SERIES_ALL_SECTION_ID) {
            const items =
                (await this.parser.parsePopularSeriesAllTime($)) || [];
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = this.sanitizeMangaId(item.mangaId);
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return { items, metadata: undefined };
        }

        return { items: [], metadata: undefined };
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: { page?: number } | undefined,
        sortingOption: SortingOption | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;

        try {
            if (!this.filterOptionsCache) {
                await this.parseAndCacheFilters();
            }
            let hasGenre = false;
            const genreIds: string[] = [];
            let statusValue: string | undefined = undefined;
            let typeValue: string | undefined = undefined;

            // Extract filter values and convert to API parameters
            if (query.filters) {
                for (const filter of query.filters) {
                    if (
                        filter.id === "genre" &&
                        typeof filter.value === "object"
                    ) {
                        // Parse genre filters - convert display names to numeric IDs
                        for (const [genreId, state] of Object.entries(
                            filter.value,
                        )) {
                            if (state === "included") {
                                let foundValue = false;
                                const foundNumericId =
                                    this.getGenreNumericId(genreId);
                                if (foundNumericId) {
                                    genreIds.push(foundNumericId);
                                    foundValue = true;
                                }
                                if (!foundValue) {
                                    genreIds.push(genreId);
                                }
                            }
                        }
                        hasGenre = genreIds.length > 0;
                    }
                    if (
                        filter.id === "status" &&
                        typeof filter.value === "string"
                    ) {
                        statusValue = this.processFilterValue(filter, "status");
                    }
                    if (
                        filter.id === "type" &&
                        typeof filter.value === "string"
                    ) {
                        typeValue = this.processFilterValue(filter, "type");
                    }
                }
            }

            const params: string[] = [];

            if (query.title && query.title.trim().length > 0) {
                params.push(`s=${encodeURIComponent(query.title.trim())}`);
            }

            if (hasGenre && genreIds.length > 0) {
                genreIds.forEach((genreId) => {
                    params.push(`genre[]=${encodeURIComponent(genreId)}`);
                });
            }

            if (typeof statusValue === "string") {
                params.push(`status=${encodeURIComponent(statusValue)}`);
            }

            if (typeof typeValue === "string") {
                params.push(`type=${encodeURIComponent(typeValue)}`);
            }

            if (sortingOption && sortingOption.id) {
                params.push(`order=${encodeURIComponent(sortingOption.id)}`);
            }

            if (page > 1) {
                params.push(`page=${encodeURIComponent(page.toString())}`);
            }

            const searchUrl = `${DOMAIN}/manga/${params.length > 0 ? `?${params.join("&")}` : ""}`;
            const [__, buffer] = await this.request({
                url: searchUrl,
                method: "GET",
            });
            const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

            const { items, hasNextPage } = this.parser.parseSearchResults($);

            // Cache manga IDs to prevent URL encoding issues
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = this.sanitizeMangaId(item.mangaId);
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }

            return {
                items,
                metadata: hasNextPage ? { page: page + 1 } : undefined,
            };
        } catch (error) {
            if (error instanceof CloudflareError) {
                throw error;
            }
            return { items: [], metadata: undefined };
        }
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        await this.parseAndCacheFilters();
        return this.filterOptionsCache || [];
    }

    async getSortingOptions(): Promise<SortingOption[]> {
        await this.parseAndCacheFilters();
        return this.sortingOptionsCache || [];
    }

    async getMangaDetails(_mangaId: string): Promise<SourceManga> {
        let slug = _mangaId.trim();
        if (slug.startsWith("http")) {
            const m = slug.match(/\/manga\/([^/]+)/);
            if (m) slug = m[1];
        } else if (slug.startsWith("/manga/")) {
            slug = slug.replace("/manga/", "");
        }
        const url = `${this.domain}/manga/${encodeURIComponent(slug)}/`;

        const [_, buffer] = await this.request({ url, method: "GET" });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        const details = this.parser.parseMangaDetails($) as {
            title: string;
            cover: string;
            description: string;
            genres: string[];
            author: string;
            status: string;
        };

        return {
            mangaId: slug,
            mangaInfo: {
                primaryTitle: details.title || slug,
                secondaryTitles: [],
                author: details.author || ".",
                tagGroups:
                    details.genres.length > 0
                        ? [
                              {
                                  id: "genres",
                                  title: "Genres",
                                  tags: details.genres.map((g) => ({
                                      id: g.toLowerCase().replace(/\s+/g, "-"),
                                      title: g,
                                  })),
                              },
                          ]
                        : [],
                synopsis: details.description || "No description available",
                status: details.status || "Unknown",
                thumbnailUrl: details.cover,
                contentRating: ContentRating.EVERYONE,
            },
        };
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        let slug = String(sourceManga.mangaId).trim();
        if (slug.startsWith("http")) {
            const m = slug.match(/\/manga\/([^/]+)/);
            if (m) slug = m[1];
        } else if (slug.startsWith("/manga/")) {
            slug = slug.replace("/manga/", "");
        }

        const url = `${this.domain}/manga/${encodeURIComponent(slug)}/`;
        let $: cheerio.CheerioAPI;
        try {
            const [__, buffer] = await this.request({ url, method: "GET" });
            $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        } catch {
            return [];
        }

        try {
            return this.parser.parseChapterList($, sourceManga);
        } catch {
            return [];
        }
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        try {
            const chapterUrl = chapter.chapterId.startsWith("http")
                ? chapter.chapterId
                : `${this.domain}${chapter.chapterId.startsWith("/") ? "" : "/"}${chapter.chapterId}`;

            const [_, buffer] = await this.request({
                url: chapterUrl,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const pages = this.parser.parseChapterPages($);

            return {
                id: chapter.chapterId,
                mangaId: chapter.sourceManga.mangaId,
                pages,
            };
        } catch {
            return {
                id: chapter.chapterId,
                mangaId: chapter.sourceManga.mangaId,
                pages: [],
            };
        }
    }

    async saveCloudflareBypassCookies(
        cookies: import("@paperback/types").Cookie[],
    ): Promise<void> {
        for (const cookie of cookies) {
            this.cookieStorageInterceptor.deleteCookie(cookie);
        }

        for (const cookie of cookies) {
            this.cookieStorageInterceptor.setCookie(cookie);
        }
    }

    async request(
        options: Parameters<typeof Application.scheduleRequest>[0],
    ): Promise<[Response, ArrayBuffer]> {
        const mergedHeaders = {
            referer: `${this.domain}/`,
            origin: `${this.domain}/`,
            "user-agent": await Application.getDefaultUserAgent(),
            ...(options.headers ?? {}),
        } as Record<string, string>;
        const [response, buffer] = await Application.scheduleRequest({
            ...options,
            headers: mergedHeaders,
        });
        const status = response.status;
        switch (status) {
            case 403:
            case 503:
                throw new CloudflareError(
                    {
                        url: this.domain,
                        method: "GET",
                        headers: {
                            referer: `${this.domain}/`,
                            origin: `${this.domain}/`,
                            "user-agent":
                                await Application.getDefaultUserAgent(),
                        },
                    },
                    "Cloudflare detected!\nPlease do the Cloudflare bypass to continue!",
                );
            case 404:
                throw new Error(
                    `The requested page ${response.url} was not found!`,
                );
        }
        return [response, buffer];
    }
}

export const DrakeScans = new DrakeScansExtension();
