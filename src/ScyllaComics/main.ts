import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    CloudflareBypassRequestProviding,
    CloudflareError,
    Cookie,
    CookieStorageInterceptor,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    EndOfPageResults,
    Extension,
    MangaProviding,
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SourceManga,
    TagSection,
    URL,
} from "@paperback/types";
import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import { Metadata } from "./models";
import { ScyllaComicsInterceptor } from "./network";
import {
    isLastPage,
    parseChapterDetails,
    parseChapters,
    parseGenreTags,
    parseMangaDetails,
    parseSearch,
    parseViewMore,
} from "./parsers";

export const SCYLLA_COMICS_DOMAIN = "https://scyllacomics.xyz";

type ScyllaComicsImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    DiscoverSectionProviding &
    CloudflareBypassRequestProviding;

export class ScyllaComicsExtension implements ScyllaComicsImplementation {
    globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 4,
        bufferInterval: 1,
        ignoreImages: true,
    });

    mainRequestInterceptor = new ScyllaComicsInterceptor("main");
    cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });

    async initialise(): Promise<void> {
        this.mainRequestInterceptor.registerInterceptor();
        this.cookieStorageInterceptor.registerInterceptor();
        this.globalRateLimiter.registerInterceptor();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "featured",
                title: "Featured",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "most_popular",
                title: "Most Popular",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "recently_added",
                title: "Recently Added",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "recent_chapters",
                title: "Recent Chapters",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "genres",
                title: "Genres",
                type: DiscoverSectionType.genres,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;

        const hasNext = ($: CheerioAPI, cur: number) =>
            $("li.pagination-link").filter((_, el) => {
                const txt = $(el).text().trim();
                return /^\d+$/.test(txt) && parseInt(txt) === cur + 1;
            }).length > 0;

        let url = SCYLLA_COMICS_DOMAIN;
        if (section.id === "recent_chapters" && page > 1) {
            url = `${SCYLLA_COMICS_DOMAIN}/?page=${page}`;
        } else if (
            (section.id === "most_popular" ||
                section.id === "recently_added") &&
            page > 1
        ) {
            url = `${SCYLLA_COMICS_DOMAIN}/manga?page=${page}`;
        }

        const request: Request = { url, method: "GET" };
        const $ = await this.fetchCheerio(request);

        switch (section.id) {
            case "featured":
                return {
                    items: parseViewMore($, "#home-slider", "featured"),
                    metadata: undefined,
                };

            case "most_popular": {
                let items: DiscoverSectionItem[];

                // page 1 = homepage carousel
                if (page === 1) {
                    items = parseViewMore($, "#popular-cards", "most_popular");
                    return { items, metadata: { page: 2 } }; // prepare next page
                }

                // page >= 2
                const url = `${SCYLLA_COMICS_DOMAIN}/manga?page=${page - 1}`; // offset because page 1 was carousel
                const req: Request = { url, method: "GET" };
                const $$ = await this.fetchCheerio(req);

                items = parseViewMore($$, "div#card-real", "most_popular");

                const currentPage =
                    parseInt(
                        $$("li.pagination-link.pagination-active span")
                            .text()
                            .trim(),
                    ) || page - 1;
                const nextPageExists = hasNext($$, currentPage);

                return {
                    items,
                    metadata: nextPageExists ? { page: page + 1 } : undefined,
                };
            }

            case "recently_added": {
                const url = `${SCYLLA_COMICS_DOMAIN}/manga?page=${page}`;
                const req: Request = { url, method: "GET" };
                const $$ = await this.fetchCheerio(req);

                const items = parseViewMore(
                    $$,
                    "div#card-real",
                    "recently_added",
                );

                const currentPage =
                    parseInt(
                        $$("li.pagination-link.pagination-active span")
                            .text()
                            .trim(),
                    ) || page;
                const nextPageExists = hasNext($$, currentPage);

                return {
                    items,
                    metadata: nextPageExists
                        ? { page: currentPage + 1 }
                        : undefined,
                };
            }

            case "recent_chapters": {
                const items = parseViewMore(
                    $,
                    "section:last-of-type",
                    "recent_chapters",
                );

                const currentPage =
                    parseInt(
                        $("li.pagination-link.pagination-active span")
                            .text()
                            .trim(),
                    ) || page;
                const nextPageExists = hasNext($, currentPage);

                return {
                    items,
                    metadata: nextPageExists
                        ? { page: currentPage + 1 }
                        : undefined,
                };
            }

            case "genres":
                return this.getGenreSectionItems();

            default:
                return { items: [], metadata: undefined };
        }
    }

    async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
        for (const cookie of cookies) {
            if (
                cookie.name.startsWith("cf") ||
                cookie.name.startsWith("_cf") ||
                cookie.name.startsWith("__cf")
            ) {
                this.cookieStorageInterceptor.setCookie(cookie);
            }
        }
    }

    async getGenreTags(): Promise<TagSection[]> {
        const request: Request = {
            url: new URL(SCYLLA_COMICS_DOMAIN)
                .addPathComponent("manga")
                .toString(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        return parseGenreTags($);
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request: Request = {
            url: new URL(SCYLLA_COMICS_DOMAIN)
                .addPathComponent("manga")
                .addPathComponent(mangaId)
                .toString(),
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);
        return parseMangaDetails($, mangaId, SCYLLA_COMICS_DOMAIN);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const request: Request = {
            url: new URL(SCYLLA_COMICS_DOMAIN)
                .addPathComponent("manga")
                .addPathComponent(sourceManga.mangaId)
                .toString(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        return parseChapters($, sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const request: Request = {
            url: new URL(SCYLLA_COMICS_DOMAIN)
                .addPathComponent("manga")
                .addPathComponent(chapter.sourceManga.mangaId)
                .addPathComponent(chapter.chapterId)
                .toString(),
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);
        return parseChapterDetails($, chapter);
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const page: number = metadata?.page ?? 1;

        const url = new URL("https://scyllacomics.xyz")
            .addPathComponent("manga")
            .setQueryItem(
                "title",
                encodeURIComponent(query.title?.trim() ?? ""),
            )
            .setQueryItem("type", "")
            .setQueryItem("status", "")
            .setQueryItem("page", String(page));

        this.applyFiltersToUrl(query, url);

        const request: Request = {
            url: url.toString(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const manga = parseSearch($, "https://scyllacomics.xyz");

        metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        return {
            items: manga,
            metadata: metadata,
        };
    }

    private applyFiltersToUrl(query: SearchQuery, url: URL): void {
        const getFilterValue = (id: string) =>
            query.filters?.find((filter) => filter.id === id)?.value;

        const genres =
            (getFilterValue("genres") as Record<
                string,
                "included" | "excluded"
            >) ?? {};
        for (const [key, value] of Object.entries(genres)) {
            if (value === "included") {
                url.setQueryItem("genre[]", key);
            }
        }

        // strict matching filter, look into getting paperback to use this with a toggle
        const strictVal = getFilterValue("strict");
        const isStrict =
            typeof strictVal === "string" &&
            (strictVal.toLowerCase() === "on" ||
                strictVal.toLowerCase() === "true");

        if (isStrict) {
            url.setQueryItem("strict", "on");
        }
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];

        const searchTags = await this.getGenreTags();
        for (const tags of searchTags) {
            filters.push({
                type: "multiselect",
                options: tags.tags.map((x) => ({ id: x.id, value: x.title })),
                id: tags.id,
                allowExclusion: true,
                title: tags.title,
                value: {},
                allowEmptySelection: true,
                maximum: undefined,
            });
        }

        // Register Sort By Filter
        filters.push({
            id: "sortBy",
            type: "dropdown",
            options: [
                { id: "Random", value: "Random" },
                { id: "New", value: "New" },
                { id: "Updated", value: "Updated" },
                { id: "Views", value: "Views" },
            ],
            value: "Views",
            title: "Sort By Filter",
        });

        return filters;
    }

    private async getFilteredSectionItems(
        filter: string,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        if (metadata?.completed) return EndOfPageResults;

        const page: number = metadata?.page ?? 1;

        const request: Request = {
            url: new URL(SCYLLA_COMICS_DOMAIN)
                .addPathComponent("manga")
                .setQueryItem("page", String(page))
                .setQueryItem("filter", filter)
                .toString(),
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);
        const manga = parseViewMore($);
        metadata = !isLastPage($) ? { page: page + 1 } : undefined;

        return {
            items: manga,
            metadata: metadata,
        };
    }

    async getGenreSectionItems(): Promise<PagedResults<DiscoverSectionItem>> {
        const genres = (await this.getGenreTags())[0];

        return {
            items: genres.tags.map((genre) => ({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [
                        { id: "genres", value: { [genre.id]: "included" } },
                    ],
                },
                name: genre.title,
                metadata: undefined,
            })),
            metadata: undefined,
        };
    }

    // may need to check for cf headers if challenges appear in future
    checkCloudflareStatus(status: number): void {
        if (status === 503) {
            throw new CloudflareError({
                url: SCYLLA_COMICS_DOMAIN,
                method: "GET",
            });
        }
        if (status === 403) {
            throw new Error(
                "Server returned 403 Forbidden. This title may have been removed due to a DMCA request or is otherwise unavailable.",
            );
        }
    }

    async fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
        const [response, data] = await Application.scheduleRequest(request);
        this.checkCloudflareStatus(response.status);
        return cheerio.load(Application.arrayBufferToUTF8String(data), {
            xml: {
                xmlMode: false,
                decodeEntities: false,
            },
        });
    }
}

export const ScyllaComics = new ScyllaComicsExtension();
