import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    EndOfPageResults,
    Extension,
    Form,
    MangaProviding,
    PagedResults,
    PaperbackInterceptor,
    Request,
    Response,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SettingsFormProviding,
    SourceManga,
} from "@paperback/types";
import { URLBuilder } from "../utils/url-builder/array-query-variant";
import {
    parseChapterDetails,
    parseChapters,
    parseChapterSinceDate,
    parseDiscoverSection,
    parseMangaDetails,
    parseSearch,
    parseTags,
} from "./ComicKParser";
import {
    ComicKSettingsForm,
    getAggresiveUploadersFiltering,
    getChapterScoreFiltering,
    getCloudflareRateLimitBackoff,
    getHideUnreleasedChapters,
    getLanguages,
    getShowTitle,
    getShowVolumeNumber,
    getStrictNameMatching,
    getUploaders,
    getUploadersFiltering,
    getUploadersWhitelisted,
} from "./ComicKSettings";
import {
    COMIC_TYPE_FILTER,
    CREATED_AT_FILTER,
    DEMOGRAPHIC_FILTER,
    SEARCH_BY_FILTER,
    SORT_FILTER,
} from "./utils/filters";

const COMICK_DOMAIN = "https://comick.io";
const COMICK_API = "https://api.comick.fun";
const LIMIT = 60;

type ComicKImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    SettingsFormProviding &
    DiscoverSectionProviding;

class ComicKInterceptor extends PaperbackInterceptor {
    async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...(request.headers ?? {}),
            ...{
                referer: COMICK_DOMAIN,
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

export class ComicKExtension implements ComicKImplementation {
    globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 4,
        bufferInterval: 1,
        ignoreImages: true,
    });

    mainRequestInterceptor = new ComicKInterceptor("main");

    async initialise(): Promise<void> {
        this.globalRateLimiter.registerInterceptor();
        this.mainRequestInterceptor.registerInterceptor();
    }

    async getSettingsForm(): Promise<Form> {
        return new ComicKSettingsForm();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "most_viewed",
                title: "Most Viewed",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "most_followed",
                title: "Most Followed",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "latest_uploads",
                title: "Latest Uploads",
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
        metadata: ComicK.Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        switch (section.id) {
            case "most_viewed":
                return this.getDiscoverSectionItemsWrapper(
                    section,
                    metadata,
                    "view",
                    20,
                );
            case "most_followed":
                return this.getDiscoverSectionItemsWrapper(
                    section,
                    metadata,
                    "follow",
                    20,
                );
            case "latest_uploads":
                return this.getDiscoverSectionItemsWrapper(
                    section,
                    metadata,
                    "uploaded",
                    20,
                );
            case "genres":
                return this.getDiscoverSectionGenres();
            default:
                return this.getDiscoverSectionItemsWrapper(
                    section,
                    metadata,
                    "",
                    20,
                );
        }
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request: Request = {
            url: new URLBuilder(COMICK_API)
                .addPath("comic")
                .addPath(mangaId)
                .addQuery("tachiyomi", "true")
                .build(),
            method: "GET",
        };
        const parsedData = await this.fetchApi<ComicK.MangaDetails>(request);

        return parseMangaDetails(parsedData, mangaId, COMICK_DOMAIN);
    }

    async getChapters(
        sourceManga: SourceManga,
        sinceDate?: Date,
    ): Promise<Chapter[]> {
        const chapterFilter = this.getChapterFilter();
        const chapters: Chapter[] = [];
        let limit = 100000;

        // Set to default fetch limit for faster chapter refresh
        if (sinceDate) {
            limit = LIMIT;
        }

        let page = 1;
        let data = await this.createChapterRequest(
            sourceManga.mangaId,
            page++,
            limit,
        );

        const { hasNewChapters, parsedChapters } = parseChapterSinceDate(
            parseChapters(data, sourceManga, chapterFilter),
            sinceDate,
        );
        parsedChapters.forEach((chapter) => chapters.push(chapter));

        // Try next page if number of chapters is same as limit
        if (hasNewChapters) {
            while (data.chapters.length === limit) {
                data = await this.createChapterRequest(
                    sourceManga.mangaId,
                    page++,
                    limit,
                );

                const { hasNewChapters, parsedChapters } =
                    parseChapterSinceDate(
                        parseChapters(data, sourceManga, chapterFilter),
                        sinceDate,
                    );
                parsedChapters.forEach((chapter) => chapters.push(chapter));

                if (!hasNewChapters) {
                    break;
                }
            }
        }

        return chapters;
    }

    async createChapterRequest(
        mangaId: string,
        page: number,
        limit = 100000,
    ): Promise<ComicK.ChapterList> {
        const builder = new URLBuilder(COMICK_API)
            .addPath("comic")
            .addPath(mangaId)
            .addPath("chapters")
            .addQuery("page", page.toString())
            .addQuery("limit", limit.toString())
            .addQuery("tachiyomi", "true");

        const languages = getLanguages();
        if (languages[0] != "all") {
            builder.addQuery("lang", languages.join(","));
        }

        const request: Request = {
            url: builder.build(),
            method: "GET",
        };
        const parsedData = await this.fetchApi<ComicK.ChapterList>(request);

        return parsedData;
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const request: Request = {
            url: new URLBuilder(COMICK_API)
                .addPath("chapter")
                .addPath(chapter.chapterId)
                .addQuery("tachiyomi", "true")
                .build(),
            method: "GET",
        };
        const parsedData = await this.fetchApi<ComicK.ChapterImages>(request);

        return parseChapterDetails(parsedData, chapter);
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];

        filters.push({
            id: "sort",
            type: "dropdown",
            options: SORT_FILTER,
            value: "",
            title: "Sort",
        });

        filters.push({
            type: "multiselect",
            options: DEMOGRAPHIC_FILTER,
            id: "demographic",
            allowExclusion: false,
            title: "Demographic",
            value: {},
            allowEmptySelection: true,
            maximum: DEMOGRAPHIC_FILTER.length,
        });

        filters.push({
            id: "type",
            type: "dropdown",
            options: SEARCH_BY_FILTER,
            value: "",
            title: "Search by Entity Type",
        });

        filters.push({
            id: "created-at",
            type: "dropdown",
            options: CREATED_AT_FILTER,
            value: "",
            title: "Created At",
        });

        filters.push({
            type: "multiselect",
            options: COMIC_TYPE_FILTER,
            id: "comic-type",
            allowExclusion: false,
            title: "Comic Type",
            value: {},
            allowEmptySelection: true,
            maximum: COMIC_TYPE_FILTER.length,
        });

        // Genre Filters
        const genres = await this.getGenres();
        const searchTagSections = parseTags(genres, "genres", "Genres");

        for (const tagSection of searchTagSections) {
            filters.push({
                type: "multiselect",
                options: tagSection.tags.map((x) => ({
                    id: x.id,
                    value: x.title,
                })),
                id: tagSection.id,
                allowExclusion: true,
                title: tagSection.title,
                value: {},
                allowEmptySelection: false,
                maximum: undefined,
            });
        }

        return filters;
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: ComicK.Metadata,
    ): Promise<PagedResults<SearchResultItem>> {
        if (metadata?.completed) return EndOfPageResults;

        const page: number = metadata?.page ?? 1;

        const builder = new URLBuilder(COMICK_API)
            .addPath("v1.0")
            .addPath("search")
            .addQuery("page", page)
            .addQuery("limit", LIMIT)
            .addQuery("tachiyomi", "true");

        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;

        const genres = getFilterValue("genres");
        if (genres && typeof genres === "object") {
            const excludes = [];
            const includes = [];

            for (const tag of Object.entries(genres)) {
                switch (tag[1]) {
                    case "excluded":
                        excludes.push(tag[0]);
                        break;
                    case "included":
                        includes.push(tag[0]);
                        break;
                }
            }

            builder.addQuery("excludes", excludes);
            builder.addQuery("genres", includes);
        }

        const sort = getFilterValue("sort");
        if (sort && typeof sort === "string") {
            builder.addQuery("sort", sort);
        }

        const createdAt = getFilterValue("created-at");
        if (createdAt && typeof createdAt === "string") {
            builder.addQuery("time", createdAt);
        }

        const mangaType = getFilterValue("type");
        if (mangaType && typeof mangaType === "string") {
            builder.addQuery("type", mangaType);
        }

        const demographic = getFilterValue("demographic");
        if (demographic && typeof demographic === "object") {
            builder.addQuery("demographic", Object.keys(demographic));
        }

        const comicType = getFilterValue("comic-type");
        if (comicType && typeof comicType === "object") {
            builder.addQuery("country", Object.keys(comicType));
        }

        builder.addQuery("q", query.title.replace(/ /g, "%20"));

        const request: Request = {
            url: builder.build(),
            method: "GET",
        };

        const parsedData = await this.fetchApi<ComicK.SearchData[]>(request);

        const manga = parseSearch(parsedData);
        metadata =
            parsedData.length === LIMIT
                ? { page: page + 1, completed: false }
                : { completed: true };
        const pagedResults: PagedResults<SearchResultItem> = {
            items: manga,
            metadata: metadata,
        };
        return pagedResults;
    }

    async getGenres(): Promise<ComicK.Item[]> {
        const request: Request = {
            url: new URLBuilder(COMICK_API)
                .addPath("genre")
                .addQuery("tachiyomi", "true")
                .build(),
            method: "GET",
        };
        return await this.fetchApi<ComicK.Item[]>(request);
    }

    async getDiscoverSectionGenres(): Promise<
        PagedResults<DiscoverSectionItem>
    > {
        const genres = await this.getGenres();

        return {
            items: genres.map((genre) => ({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [
                        { id: "genres", value: { [genre.slug]: "included" } },
                    ],
                },
                name: genre.name,
                metadata: undefined,
            })),
            metadata: undefined,
        };
    }

    async getDiscoverSectionItemsWrapper(
        section: DiscoverSection,
        metadata: ComicK.Metadata,
        sort: string,
        limit: number,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        if (sort.length == 0) {
            return {
                items: [],
                metadata: undefined,
            };
        }

        if (metadata?.completed) return EndOfPageResults;

        const page: number = metadata?.page ?? 1;
        const request: Request = {
            url: new URLBuilder(COMICK_API)
                .addPath("v1.0")
                .addPath("search")
                .addQuery("sort", sort)
                .addQuery("limit", limit)
                .addQuery("page", page)
                .addQuery("tachiyomi", "true")
                .build(),
            method: "GET",
        };
        const parsedData = await this.fetchApi<ComicK.SearchData[]>(request);

        const manga = parseDiscoverSection(parsedData, section.type);
        metadata =
            parsedData.length === limit
                ? { page: page + 1, completed: false }
                : { completed: true };

        const pagedResults: PagedResults<DiscoverSectionItem> = {
            items: manga,
            metadata: metadata,
        };
        return pagedResults;
    }

    getChapterFilter(): ComicK.ChapterFilter {
        return {
            showTitle: getShowTitle(),
            showVol: getShowVolumeNumber(),
            chapterScoreFiltering: getChapterScoreFiltering(),
            uploadersToggled: getUploadersFiltering(),
            uploadersWhitelisted: getUploadersWhitelisted(),
            aggressiveUploadersFilter: getAggresiveUploadersFiltering(),
            strictNameMatching: getStrictNameMatching(),
            uploaders: getUploaders(),
            hideUnreleasedChapters: getHideUnreleasedChapters(),
        };
    }

    async fetchApi<T>(
        request: Request,
        attempt = 1,
        maxAttempts = 4,
    ): Promise<T> {
        let response: Response;
        let data: ArrayBuffer;
        try {
            [response, data] = await Application.scheduleRequest(request);
        } catch {
            throw new Error(
                `Failed to fetch data from ${request.url} (request error)`,
            );
        }

        if (response.status === 429 && getCloudflareRateLimitBackoff()) {
            if (attempt < maxAttempts) {
                const delay = 2 ** attempt * (1 + Math.random() / 2);
                console.log(
                    `Failed to fetch data from ${request.url} (Cloudflare rate limit, attempt ${attempt}, retrying in ${delay}s)`,
                );
                await Application.sleep(delay);
                return this.fetchApi(request, attempt + 1, maxAttempts);
            }

            throw new Error(
                `Failed to fetch data from ${request.url} (Cloudflare rate limit)`,
            );
        }

        try {
            return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
        } catch {
            throw new Error(
                `Failed to fetch data from ${request.url} (invalid response)`,
            );
        }
    }
}

export const ComicK = new ComicKExtension();
