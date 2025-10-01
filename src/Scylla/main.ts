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
    PaperbackInterceptor,
    URL as PBURL,
    Request,
    Response,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SourceManga,
    TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import {
    isLastPage,
    parseChapterDetails,
    parseChapters,
    parseGenreTags,
    parseMangaDetails,
    parseSearch,
    parseViewMore,
} from "./parsers";

const SCYLLA_DOMAIN = "https://scyllacomics.xyz";

type ScyllaImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    DiscoverSectionProviding &
    CloudflareBypassRequestProviding;

type Metadata = {
    page?: number;
    completed?: boolean;
};

class ScyllaInterceptor extends PaperbackInterceptor {
    async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...(request.headers ?? {}),
            ...{
                referer: `${SCYLLA_DOMAIN}/`,
                "user-agent": await Application.getDefaultUserAgent(),
            },
        };
        return request;
    }

    override async interceptResponse(
        request: Request,
        response: Response,
        data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
        return data;
    }
}

export class ScyllaExtension implements ScyllaImplementation {
    globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 4,
        bufferInterval: 1,
        ignoreImages: true,
    });

    mainRequestInterceptor = new ScyllaInterceptor("main");
    cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });

    async initialise(): Promise<void> {
        this.globalRateLimiter.registerInterceptor();
        this.cookieStorageInterceptor.registerInterceptor();
        this.mainRequestInterceptor.registerInterceptor();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "most_viewed",
                title: "Most Viewed",
                type: DiscoverSectionType.prominentCarousel,
            },
            //{
            //    id: "new",
            //    title: "New",
            //    type: DiscoverSectionType.simpleCarousel,
            //},
            //{
            //    id: "latest_updates",
            //    title: "Latest Updates",
            //    type: DiscoverSectionType.simpleCarousel,
            //},
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
        switch (section.id) {
            case "most_viewed":
                return this.getFilteredSectionItems("/?popular", metadata);
            //case "new":
            //return this.getFilteredSectionItems("/?latest", metadata);
            //case "latest_updates":
            //return this.getFilteredSectionItems("Updated", metadata);
            case "genres":
                return this.getGenreSectionItems();
            default:
                return {
                    items: [],
                    metadata: undefined,
                };
        }
    }

    async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
        for (const cookie of cookies) {
            if (
                cookie.name.startsWith("cf") ||
                cookie.name.startsWith("_cf") ||
                cookie.name.startsWith("__cf")
            ) {
                // Find existing cookie with the same name
                const existingCookie =
                    this.cookieStorageInterceptor.cookies.find(
                        (x) => x.name === cookie.name,
                    );
                // Remove existing cookie
                if (existingCookie) {
                    this.cookieStorageInterceptor.deleteCookie(existingCookie);
                }

                this.cookieStorageInterceptor.setCookie(cookie);
            }
        }
    }

    async getGenreTags(): Promise<TagSection[]> {
        const request: Request = {
            url: new PBURL(SCYLLA_DOMAIN).addPathComponent("manga").toString(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        return parseGenreTags($);
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request: Request = {
            url: new PBURL(SCYLLA_DOMAIN)
                .addPathComponent("manga")
                .addPathComponent(mangaId)
                .toString(),
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);
        return parseMangaDetails($, mangaId, SCYLLA_DOMAIN);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const request: Request = {
            url: new PBURL(SCYLLA_DOMAIN)
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
            url: new PBURL(SCYLLA_DOMAIN)
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

        const url = new PBURL("https://scyllacomics.xyz")
            .addPathComponent("manga")
            .setQueryItem(
                "title",
                encodeURIComponent(query.title?.trim() ?? ""),
            )
            .setQueryItem("type", "")
            .setQueryItem("status", "")
            .setQueryItem("page", String(page));

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
            url: new PBURL(SCYLLA_DOMAIN)
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
            throw new CloudflareError({ url: SCYLLA_DOMAIN, method: "GET" });
        }
        if (status === 403) {
            throw new Error(
                "Server returned 403 Forbidden. Logins not yet supported. Let me know on Discord if you can view this title when logged in on the website.",
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

export const Scylla = new ScyllaExtension();
