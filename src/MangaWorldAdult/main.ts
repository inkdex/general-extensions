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
    PaperbackInterceptor,
    Request,
    Response,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SettingsFormProviding,
    SortingOption,
    SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";
import {
    blacklistedTags,
    blacklistedType,
    getGenreFilter,
    getMangaTypeFilter,
    getOrderFilter,
    Metadata,
    URLBuilder,
} from "./helper";
import { Parser } from "./parser";
import { SettingsForm } from "./SettingsForm";

const MW_DOMAIN = "https://www.mangaworldadult.net";
// Should match the capabilities which you defined in pbconfig.ts
type ContentTemplateImplementation = SettingsFormProviding &
    Extension &
    DiscoverSectionProviding &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;
// Intercepts all the requests and responses and allows you to make changes to them
class MainInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        return request;
    }

    override async interceptResponse(
        request: Request,
        response: Response,
        data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
        void request;
        void response;

        return data;
    }
}

// Main extension class
export class MangaAdultExtension implements ContentTemplateImplementation {
    // Implementation of the main rate limiter
    mainRateLimiter = new BasicRateLimiter("main", {
        numberOfRequests: 15,
        bufferInterval: 10,
        ignoreImages: true,
    });
    baseUrl = MW_DOMAIN;
    RETRIES = 10;
    private parser = new Parser();
    // Implementation of the main interceptor
    mainInterceptor = new MainInterceptor("main");

    // Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
    }

    // Implements the settings form, check SettingsForm.ts for more info
    async getSettingsForm(): Promise<Form> {
        return new SettingsForm();
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];
        const def_value = ((Application.getState("def_type") as string[]) ??
            [])[0];
        filters.push({
            type: "multiselect",
            options: getMangaTypeFilter().filter(
                (option) => !blacklistedType(option.value),
            ),
            id: "types",
            allowExclusion: false,
            title: "Tipo",
            value: def_value ? { [def_value]: "included" } : {},
            allowEmptySelection: true,
            maximum: 1,
        });
        filters.push({
            type: "multiselect",
            options: getGenreFilter().filter(
                (option) => !blacklistedTags([option.value]),
            ),
            id: "genres",
            allowExclusion: false,
            title: "Generi",
            value: {},
            allowEmptySelection: true,
            maximum: 5,
        });
        return filters;
    }

    // Populates search
    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
        sorting: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        let manga: SearchResultItem[] = [];
        let page = metadata?.page ?? 1;
        if (page == -1) return { items: [] };
        const url = this.constructSearchRequestURL(page, query, sorting);
        const data = (
            await Application.scheduleRequest({
                url: `${url}`,
                method: "GET",
            })
        )[1];
        const $: cheerio.CheerioAPI = cheerio.load(
            Application.arrayBufferToUTF8String(data),
        );
        manga = this.parser.parseSearchResults($);
        page++;
        return { items: manga, metadata: { page: page } };
    }

    // Populates the title details
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        console.log(mangaId);
        console.log("Get Details of MangaID " + mangaId);
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${mangaId}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        return this.parser.parseMangaDetails(
            $,
            mangaId,
            `${this.baseUrl}/manga/${mangaId}`,
        );
    }

    // Populates the chapter list
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        console.log("Get Chapters of MangaID " + sourceManga.mangaId);
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${sourceManga.mangaId}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        return this.parser.parseChapters($, sourceManga);
    }

    // Populates a chapter with images
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}/manga/${chapter.sourceManga.mangaId}/read/${chapter.chapterId}/?style=list`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        return this.parser.parseChapterDetails(
            $,
            chapter.sourceManga.mangaId,
            chapter.chapterId,
        );
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "popular_section",
                title: "Capitoli In Tendenza",
                type: DiscoverSectionType.featured,
            },
            {
                id: "mese_section",
                title: "Manga del Mese",
                subtitle: "Manga più letti del mese",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "updated_section",
                title: "Aggiornati di Recente",
                subtitle: "Ultimi Capitoli Aggiunti",
                type: DiscoverSectionType.chapterUpdates,
            },
            {
                id: "new_manga_section",
                title: "Nuove Aggiunte",
                subtitle: "Nuovi Manga",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "type_section",
                title: "Tipo",
                subtitle: "Manga più letti di un tipo",
                type: DiscoverSectionType.genres,
            },
            {
                id: "genre_section",
                title: "Generi",
                subtitle: "Manga più letti di un genere",
                type: DiscoverSectionType.genres,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const data = (
            await Application.scheduleRequest({
                url: `${this.baseUrl}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        const mangaType: DiscoverSectionItem[] = [];
        const allGenres: DiscoverSectionItem[] = [];
        getGenreFilter()
            .filter((option) => !blacklistedTags([option.value]))
            .forEach((filter) => {
                allGenres.push({
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            {
                                id: "genres",
                                value: { [filter.id]: "included" },
                            },
                        ],
                    },
                    name: filter.value,
                    metadata: metadata,
                    contentRating: ContentRating.ADULT,
                });
            });
        getMangaTypeFilter()
            .filter((option) => !blacklistedType(option.value))
            .forEach((filter) => {
                mangaType.push({
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            { id: "types", value: { [filter.id]: "included" } },
                        ],
                    },
                    name: filter.value,
                    metadata: metadata,
                    contentRating: ContentRating.ADULT,
                });
            });

        switch (section.id) {
            case "popular_section": {
                console.log("Loading popular_section loaded");
                return this.parser.parseCapitoliInTendenza($, metadata);
            }
            case "mese_section": {
                console.log("Loading mese_section loaded");
                return this.parser.parseInTendenzaMese($, metadata);
            }
            case "updated_section": {
                console.log("Loading updated_section loaded");
                return this.parser.parseLastAddedSection(
                    $,
                    metadata,
                    this.baseUrl,
                );
            }
            case "new_manga_section": {
                console.log("Loading new_manga_section loaded");
                return this.parser.parseLastMangaAddedSection(
                    metadata,
                    this.baseUrl,
                );
            }
            case "genre_section": {
                console.log("Loading type_section loaded");
                return {
                    items: allGenres,
                    metadata: metadata,
                };
            }
            case "type_section": {
                console.log("Loading type_section loaded");
                return {
                    items: mangaType,
                    metadata: metadata,
                };
            }
            default:
                return { items: [], metadata: metadata };
        }
    }

    async getSortingOptions(): Promise<SortingOption[]> {
        return getOrderFilter();
    }

    constructSearchRequestURL(
        page: number,
        query: SearchQuery = { title: "", filters: [] },
        sorting: SortingOption | undefined,
    ): string {
        const generi: string[] = [];
        const tipologia: string[] = [];
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        console.log(getFilterValue("genres"));
        const genres: string | Record<string, "included" | "excluded"> =
            getFilterValue("genres") ?? "";
        const types: string | Record<string, "included" | "excluded"> =
            getFilterValue("types") ?? "";
        if (genres && typeof genres === "object") {
            for (const tag of Object.entries(genres)) {
                if (tag[0].length > 0) generi.push(tag[0]);
            }
        } else if (genres.length > 0) generi.push(genres);

        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                if (tag[0].length > 0) tipologia.push(tag[0]);
            }
        } else if (types.length > 0) tipologia.push(types);

        console.log("Search query: " + query.title);
        const urlBuilder = new URLBuilder(this.baseUrl).addPathComponent(
            "archive",
        );
        if (query.title.toString().length > 0)
            urlBuilder.addQueryParameter(
                "keyword",
                query.title.toString() ?? "",
            );
        if (page.toString().length > 0)
            urlBuilder.addQueryParameter("page", page.toString());
        if (sorting?.id) urlBuilder.addQueryParameter("sort", sorting?.id);
        if (generi.length > 0) urlBuilder.addQueryParameter("genre", generi);
        if (tipologia.length > 0)
            urlBuilder.addQueryParameter("type", tipologia);
        return urlBuilder.buildUrl();
    }
}

export const MangaWorldAdult = new MangaAdultExtension();
