// MangaDemon Extension for Paperback
// -----------------------------------
// This extension enables Paperback to search, browse, and read manga from demonicscans.org.
// It implements all required interfaces for search, discovery, manga details, chapter listing, and chapter page retrieval.

import {
    CloudflareError,
    ContentRating,
    CookieStorageInterceptor,
    DiscoverSectionType,
    type Chapter,
    type ChapterDetails,
    type ChapterProviding,
    type CloudflareBypassRequestProviding,
    type DiscoverSection,
    type DiscoverSectionItem,
    type DiscoverSectionProviding,
    type Extension,
    type MangaProviding,
    type PagedResults,
    type Response,
    type SearchFilter,
    type SearchQuery,
    type SearchResultsProviding,
    type SortingOption,
    type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";
import {
    DOMAIN,
    LATEST_NOVEL_SECTION_ID,
    LATEST_NOVEL_SECTION_TITLE,
    LATEST_TRANSLATION_SECTION_ID,
    LATEST_TRANSLATION_SECTION_TITLE,
    LATEST_UPDATES_SECTION_ID,
    LATEST_UPDATES_SECTION_TITLE,
    MOST_VIEWED_SECTION_ID,
    MOST_VIEWED_SECTION_TITLE,
    NEW_TITLES_SECTION_ID,
    NEW_TITLES_SECTION_TITLE,
    type SearchResultItem,
} from "./models";
import { MangaDemonParser } from "./parsers";

class MangaDemonExtension
    implements
        Extension,
        DiscoverSectionProviding,
        SearchResultsProviding,
        MangaProviding,
        ChapterProviding,
        CloudflareBypassRequestProviding
{
    readonly domain: string = DOMAIN;
    parser: MangaDemonParser = new MangaDemonParser();

    // Maps sanitized manga IDs to real IDs for session consistency
    private idMap: Record<string, string> = {};
    // Caches for search filters and sorting options (to avoid repeated requests)
    private filterOptionsCache: SearchFilter[] | null = null;
    private sortingOptionsCache: { id: string; label: string }[] | null = null;
    private filterSortCachePromise: Promise<void> | null = null;

    // Cloudflare bypass: persistent cookie storage for Cloudflare and login
    cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });

    // Fetches and caches filter/sort options from the advanced search page
    private async fetchAndCacheFiltersAndSorts(): Promise<void> {
        const [_response, buffer] = await this.request({
            url: `${this.domain}/advanced.php`,
            method: "GET",
        });
        const html = Application.arrayBufferToUTF8String(buffer);
        const $ = cheerio.load(html);
        // Parse genres
        const genreOptions: { id: string; value: string }[] = [];
        $('input.genrespick[type="checkbox"][name="genres[]"]').each(
            (_, el) => {
                const id = $(el).val()?.toString() || "";
                const label = $(el)
                    .parent()
                    .text()
                    .replace(/^[\s\xa0]+/, "")
                    .trim();
                if (id && label) {
                    genreOptions.push({ id, value: label });
                }
            },
        );
        // Parse status
        const statusOptions: { id: string; value: string }[] = [];
        $('select[name="status"] option').each((_, el) => {
            const id = $(el).val()?.toString() || "";
            const label = $(el).text().trim();
            if (id && label) {
                statusOptions.push({ id, value: label });
            }
        });
        this.filterOptionsCache = [
            {
                type: "multiselect",
                id: "genre",
                title: "Genre",
                options: genreOptions,
                value: {},
                allowExclusion: false,
                allowEmptySelection: true,
                maximum: undefined,
            },
            {
                type: "dropdown",
                id: "status",
                title: "Status",
                options: statusOptions,
                value: "all",
            },
        ];
        // Parse sorting options
        const sortOptions: { id: string; label: string }[] = [];
        $('select[name="orderby"] option').each((_, el) => {
            const id = $(el).val()?.toString() || "";
            const label = $(el).text().trim();
            if (id && label) {
                sortOptions.push({ id, label });
            }
        });
        this.sortingOptionsCache = sortOptions;
    }

    async initialise(): Promise<void> {
        // Register the Cloudflare cookie interceptor (required by Paperback for bypass flow)
        this.cookieStorageInterceptor.registerInterceptor();
    }

    // Returns the discover sections (e.g., Most Viewed, Latest Updates) for the app's home screen
    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: MOST_VIEWED_SECTION_ID,
                title: MOST_VIEWED_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: LATEST_TRANSLATION_SECTION_ID,
                title: LATEST_TRANSLATION_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: LATEST_UPDATES_SECTION_ID,
                title: LATEST_UPDATES_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: NEW_TITLES_SECTION_ID,
                title: NEW_TITLES_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: LATEST_NOVEL_SECTION_ID,
                title: LATEST_NOVEL_SECTION_TITLE,
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    // Fetches items for a given discover section (carousel)
    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: { page?: number } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        if (section.id === MOST_VIEWED_SECTION_ID) {
            const [_response, buffer] = await this.request({
                url: `${DOMAIN}/index.php`,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const items = await this.parser.parseMostViewedToday($);
            // After parsing items:
            // Map sanitizedId to realId for all items
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
                        );
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return { items, metadata: undefined };
        }
        if (section.id === LATEST_TRANSLATION_SECTION_ID) {
            const page = metadata?.page ?? 1;
            const url = `${DOMAIN}/translationlist.php${page > 1 ? `?list=${page}` : ""}`;
            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const { items, hasNextPage } =
                await this.parser.parseLatestTranslation($);
            const realHasNextPage = hasNextPage && items.length > 0;
            // After parsing items:
            // Map sanitizedId to realId for all items
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
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
        }
        if (section.id === LATEST_UPDATES_SECTION_ID) {
            const page = metadata?.page ?? 1;
            const url = `${DOMAIN}/lastupdates.php${page > 1 ? `?list=${page}` : ""}`;
            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const { items, hasNextPage } =
                await this.parser.parseLatestTranslation(cheerio.load(html));
            const realHasNextPage = hasNextPage && items.length > 0;
            // After parsing items:
            // Map sanitizedId to realId for all items
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
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
        }
        if (section.id === NEW_TITLES_SECTION_ID) {
            const page = metadata?.page ?? 1;
            const url = `${DOMAIN}/newmangalist.php${page > 1 ? `?list=${page}` : ""}`;
            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const { items, hasNextPage } =
                await this.parser.parseLatestTranslation(cheerio.load(html));
            const realHasNextPage = hasNextPage && items.length > 0;
            // After parsing items:
            // Map sanitizedId to realId for all items
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
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
        }
        if (section.id === LATEST_NOVEL_SECTION_ID) {
            const page = metadata?.page ?? 1;
            const url = `${DOMAIN}/lastnvupdates.php${page > 1 ? `?list=${page}` : ""}`;
            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const { items, hasNextPage } =
                await this.parser.parseLatestTranslation(cheerio.load(html));
            const realHasNextPage = hasNextPage && items.length > 0;
            // After parsing items:
            // Map sanitizedId to realId for all items
            if (Array.isArray(items)) {
                items.forEach((item) => {
                    if (item && "mangaId" in item && item.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
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
        }
        return { items: [], metadata: undefined };
    }

    // Handles search queries and filter/sort options
    async getSearchResults(
        query: SearchQuery,
        metadata: { page?: number } | undefined,
        sortingOption: SortingOption | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        // If searching by title, use quick search endpoint
        if (query.title && query.title.trim().length > 0) {
            const url = `${this.domain}/search.php?manga=${encodeURIComponent(query.title.trim())}`;
            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const results = await this.parser.parseQuickSearch($);
            // After parsing results:
            // Map sanitizedId to realId for all items
            if (Array.isArray(results)) {
                results.forEach((item) => {
                    if (item?.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
                        );
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return {
                items: Array.isArray(results) ? results : [],
                metadata: undefined, // No pagination for quick search
            };
        }
        // Otherwise, use advanced search with filters/sorting
        const page = metadata?.page ?? 1;
        let hasGenre = false;
        let statusNotAll = false;
        const genreIds: string[] = [];
        let statusValue: string | undefined = undefined;
        if (query.filters) {
            for (const filter of query.filters) {
                if (filter.id === "genre" && typeof filter.value === "object") {
                    for (const [genreId, state] of Object.entries(
                        filter.value,
                    )) {
                        if (state === "included") {
                            genreIds.push(genreId);
                        }
                    }
                    hasGenre = genreIds.length > 0;
                }
                if (
                    filter.id === "status" &&
                    typeof filter.value === "string"
                ) {
                    statusValue = filter.value;
                    if (filter.value !== "all") {
                        statusNotAll = true;
                    }
                }
            }
        }
        const isDefaultSort =
            !sortingOption ||
            !sortingOption.id ||
            sortingOption.id === "VIEWS DESC";

        // If no filters/sort, use GET as before
        if (!hasGenre && !statusNotAll && isDefaultSort) {
            const url = `${this.domain}/advanced.php${page > 1 ? `?list=${page}` : ""}`;

            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const results = await this.parser.parseAdvancedSearchDefault($);
            // Pagination fix: find the highest page number in the pagination links
            let hasNextPage = false;
            const nextPage = page + 1;
            let lastPage = page;
            $(".pagination a").each((_, el) => {
                const num = parseInt($(el).text().trim(), 10);
                if (!isNaN(num) && num > lastPage) {
                    lastPage = num;
                }
            });
            const nextPageLink = $(".pagination a:contains('Next')");
            if (nextPageLink.length > 0 && nextPage <= lastPage) {
                hasNextPage = true;
            }
            // After parsing results:
            // Map sanitizedId to realId for all items
            if (Array.isArray(results)) {
                results.forEach((item) => {
                    if (item?.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
                        );
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return {
                items: Array.isArray(results) ? results : [],
                metadata: hasNextPage ? { page: nextPage } : undefined,
            };
        }
        // If filters/sort are applied:
        // - page 1: POST
        // - page > 1: GET with all params in query string
        if (page === 1) {
            // POST for first page with filters/sort
            const formData: string[] = [];
            if (genreIds.length > 0) {
                for (const id of genreIds) {
                    formData.push(`genres[]=${encodeURIComponent(id)}`);
                }
            }
            if (typeof statusValue === "string") {
                formData.push(`status=${encodeURIComponent(statusValue)}`);
            }
            if (sortingOption && sortingOption.id) {
                formData.push(
                    `orderby=${encodeURIComponent(sortingOption.id)}`,
                );
            }
            formData.push("submit=Search");
            const url = `${this.domain}/advanced.php`;

            const [_response, buffer] = await this.request({
                url,
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.join("&"),
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const results = await this.parser.parseAdvancedSearchDefault($);
            let hasNextPage = false;
            const nextPageLink = $(".pagination a:contains('Next')");
            if (nextPageLink.length > 0) {
                hasNextPage = true;
            }
            // After parsing results:
            // Map sanitizedId to realId for all items
            if (Array.isArray(results)) {
                results.forEach((item) => {
                    if (item?.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
                        );
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return {
                items: Array.isArray(results) ? results : [],
                metadata: hasNextPage ? { page: page + 1 } : undefined,
            };
        } else {
            // GET for paginated filtered/sorted results
            const params: string[] = [];
            if (genreIds.length > 0) {
                for (const id of genreIds) {
                    params.push(`genre[]=${encodeURIComponent(id)}`);
                }
            }
            if (typeof statusValue === "string") {
                params.push(`status=${encodeURIComponent(statusValue)}`);
            }
            if (sortingOption && sortingOption.id) {
                params.push(`orderby=${sortingOption.id}`);
            }
            if (page > 1) {
                params.push(`list=${page}`);
            }
            // Do NOT include 'submit=Search' in GET requests
            const url = `${this.domain}/advanced.php?${params.join("&")}`;

            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const html = Application.arrayBufferToUTF8String(buffer);
            const $ = cheerio.load(html);
            const results = await this.parser.parseAdvancedSearchDefault($);
            let hasNextPage = false;
            const nextPageLink = $(".pagination a:contains('Next')");
            if (nextPageLink.length > 0) {
                hasNextPage = true;
            }
            // After parsing results:
            // Map sanitizedId to realId for all items
            if (Array.isArray(results)) {
                results.forEach((item) => {
                    if (item?.mangaId) {
                        const sanitized = String(item.mangaId).replace(
                            /[^a-zA-Z0-9]/g,
                            "",
                        );
                        this.idMap[sanitized] = item.mangaId;
                    }
                });
            }
            return {
                items: Array.isArray(results) ? results : [],
                metadata: hasNextPage ? { page: page + 1 } : undefined,
            };
        }
    }

    // Returns available search filters (genres, status, etc.)
    async getSearchFilters(): Promise<SearchFilter[]> {
        if (!this.filterOptionsCache || !this.sortingOptionsCache) {
            if (!this.filterSortCachePromise) {
                this.filterSortCachePromise =
                    this.fetchAndCacheFiltersAndSorts();
            }
            await this.filterSortCachePromise;
            this.filterSortCachePromise = null;
        }
        return this.filterOptionsCache!;
    }

    // Returns available sorting options
    async getSortingOptions(): Promise<{ id: string; label: string }[]> {
        if (!this.filterOptionsCache || !this.sortingOptionsCache) {
            if (!this.filterSortCachePromise) {
                this.filterSortCachePromise =
                    this.fetchAndCacheFiltersAndSorts();
            }
            await this.filterSortCachePromise;
            this.filterSortCachePromise = null;
        }
        return this.sortingOptionsCache!;
    }

    // Fetches and parses manga details (title, author, genres, etc.)
    async getMangaDetails(
        mangaId: string,
    ): Promise<import("@paperback/types").SourceManga> {
        // Defensive: Check for valid mangaId
        if (!mangaId) {
            throw new Error(
                "[MangaDemon][getMangaDetails] mangaId is required but was not provided",
            );
        }
        // Map sanitized IDs to real IDs for consistency
        const sanitized =
            typeof mangaId === "string"
                ? mangaId.replace(/[^a-zA-Z0-9/-]/g, "")
                : "";
        const realId = this.idMap[sanitized] || mangaId;
        let url = "";
        let cleanId = realId;
        let isNovel = false;
        // Novel support: use /novel/{slug} for novels
        if (cleanId.startsWith("/novel/")) {
            url = `${this.domain}${cleanId}`;
            cleanId = cleanId.replace("/novel/", "");
            isNovel = true;
        } else if (cleanId.startsWith("http")) {
            const match = cleanId.match(/\/manga\/([^/]+)/);
            if (match) cleanId = match[1];
            url = `${this.domain}/manga/${encodeURIComponent(cleanId)}`;
        } else if (cleanId.startsWith("/manga/")) {
            cleanId = cleanId.replace("/manga/", "");
            url = `${this.domain}/manga/${encodeURIComponent(cleanId)}`;
        } else {
            url = `${this.domain}/manga/${encodeURIComponent(cleanId)}`;
        }
        try {
            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
            // Check if the page contains manga content
            const title = $("h1.big-fat-titles").first().text().trim();
            if (!title) {
                throw new Error("No manga title found on manga URL");
            }
            const details = await this.parser.parseMangaDetails($, cleanId);
            // Defensive: If required fields are missing, throw an error
            if (!details || !details.mangaId || !details.title) {
                throw new Error(
                    `[MangaDemon][getMangaDetails] Invalid manga details: ${JSON.stringify(details)}`,
                );
            }
            // Create the SourceManga object with consistent mangaId format
            const sourceManga: SourceManga = {
                mangaId: isNovel ? `/novel/${cleanId}` : cleanId, // Preserve novel prefix for getChapters
                mangaInfo: {
                    primaryTitle: details.title || "No title",
                    secondaryTitles: [],
                    author: details.author || "Unknown",
                    tagGroups: [
                        {
                            id: "genres",
                            title: "Genres",
                            tags: details.genres.map((g) => ({
                                id: g.toLowerCase().replace(/\s+/g, "-"),
                                title: g,
                            })),
                        },
                    ],
                    synopsis: details.description || "No description available",
                    status: details.status || "Unknown",
                    ...(details.rating !== undefined
                        ? { rating: details.rating }
                        : {}),
                    thumbnailUrl: details.cover || "",
                    contentRating: ContentRating.MATURE,
                },
            };
            return sourceManga;
        } catch (error) {
            throw new Error(
                `[MangaDemon][getMangaDetails] Failed to fetch manga details: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    // Fetches the list of chapters for a manga or novel
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        // Always fetch fresh chapter list from the site
        let cleanMangaId = String(sourceManga.mangaId);
        // Novel support: use /novel/{slug} for novels
        let url = "";
        if (cleanMangaId.startsWith("/novel/")) {
            url = `${this.domain}${cleanMangaId}`;
            cleanMangaId = cleanMangaId.replace("/novel/", "");
        } else if (cleanMangaId.startsWith("http")) {
            const match = cleanMangaId.match(/\/manga\/([^/]+)/);
            if (match) cleanMangaId = match[1];
            url = `${this.domain}/manga/${encodeURIComponent(cleanMangaId)}`;
        } else if (cleanMangaId.startsWith("/manga/")) {
            cleanMangaId = cleanMangaId.replace("/manga/", "");
            url = `${this.domain}/manga/${encodeURIComponent(cleanMangaId)}`;
        } else {
            url = `${this.domain}/manga/${encodeURIComponent(cleanMangaId)}`;
        }
        try {
            const [_response, buffer] = await this.request({
                url,
                method: "GET",
            });
            const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
            const chapters = this.parser.parseChapterList($, sourceManga);
            return chapters;
        } catch {
            return [];
        }
    }

    // Fetches the image URLs for a specific chapter
    /**
     * Fetches details for a specific chapter (pages/images).
     */
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        try {
            // The chapterId should be in the format /title/{manga-title}/chapter/{chapter-number}/1
            // We need to construct the full URL
            const chapterUrl = `${this.domain}${chapter.chapterId}`;

            const [_response, buffer] = await this.request({
                url: chapterUrl,
                method: "GET",
            });

            const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

            // Parse the chapter pages using the parser
            const pages = await this.parser.parseChapterPages($, chapterUrl);

            return {
                id: chapter.chapterId,
                mangaId: chapter.sourceManga.mangaId,
                pages: pages,
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
        // Clear all the cookies first (like Madara)
        for (const cookie of cookies) {
            this.cookieStorageInterceptor.deleteCookie(cookie);
        }

        // Then set all the cookies
        for (const cookie of cookies) {
            this.cookieStorageInterceptor.setCookie(cookie);
        }

        // Nothing else to reset; Paperback should resume requests after cookies are saved
    }

    async request(
        options: Parameters<typeof Application.scheduleRequest>[0],
    ): Promise<[Response, ArrayBuffer]> {
        const [response, buffer] = await Application.scheduleRequest(options);
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

// Export the extension instance for Paperback to use
export const MangaDemon = new MangaDemonExtension();
