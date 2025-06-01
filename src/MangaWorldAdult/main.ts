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
    getStatusFilter,
    getYearFilter,
    Metadata,
    populateFilter,
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
        await populateFilter(this.baseUrl);
        const filters: SearchFilter[] = [];
        const def_value = ((Application.getState("def_type") as string[]) ??
            [])[0];
        const getExcludedTypeObject = {
            ...Object.fromEntries(
                getMangaTypeFilter()
                    .filter((option) => blacklistedType(option.id))
                    .map((item) => [item.id, "excluded" as const]),
            ),
            ...(def_value
                ? { [def_value.toLowerCase()]: "included" as const }
                : {}),
        } as Record<string, "included" | "excluded">;

        const getExcludedValueObject = Object.fromEntries(
            getGenreFilter()
                .filter((option) => blacklistedTags([option.id]))
                .map((item) => [item.id, "excluded" as const]),
        ) as Record<string, "included" | "excluded">;
        filters.push({
            type: "multiselect",
            options: getMangaTypeFilter(),
            id: "types",
            allowExclusion: true,
            title: "Tipo",
            value: getExcludedTypeObject,
            allowEmptySelection: true,
            maximum: 3,
        });
        filters.push({
            type: "multiselect",
            options: getGenreFilter(),
            id: "genres",
            allowExclusion: true,
            title: "Generi",
            value: getExcludedValueObject,
            allowEmptySelection: true,
            maximum: 5,
        });
        filters.push({
            type: "dropdown",
            options: getStatusFilter(),
            id: "status",
            title: "Stato",
            value: "",
        });
        filters.push({
            type: "dropdown",
            options: getYearFilter(),
            id: "year",
            title: "Anno",
            value: "",
        });
        return filters;
    }

    // Populates search
    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
        sorting: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        const manga: SearchResultItem[] = [];
        let page = metadata?.page ?? 1;
        if (page === -1) return { items: [] };
        for (let cycle = 0; cycle < 5 && manga.length <= 16; cycle++, page++) {
            const { url, excluded } = this.constructSearchRequestURL(
                page,
                query,
                sorting,
            );
            const [_, data] = await Application.scheduleRequest({
                url,
                method: "GET",
            });
            const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
            const newPage = await this.parser.parseSearchResults($, excluded);
            manga.push(...newPage);
            const pag = $(".search-quantity").text().split(" ")[0];
            if (Number(pag) === manga.length) {
                break;
            }
        }

        return { items: manga.slice(0, 16), metadata: { page } };
    }

    // Populates the title details
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
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
        await populateFilter(this.baseUrl);
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
            .filter((option) => !blacklistedTags([option.id]))
            .forEach((filter) => {
                const getExcludedValueObject = {
                    ...Object.fromEntries(
                        getGenreFilter()
                            .filter((option) => blacklistedTags([option.id]))
                            .map((item) => [item.id, "excluded" as const]),
                    ),
                    [filter.id]: "included" as const,
                } as Record<string, "included" | "excluded">;
                allGenres.push({
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            {
                                id: "genres",
                                value: getExcludedValueObject,
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
                const getExcludedTypeObject = {
                    ...Object.fromEntries(
                        getMangaTypeFilter()
                            .filter((option) => blacklistedType(option.value))
                            .map((item) => [item.id, "excluded" as const]),
                    ),
                    [filter.id]: "included" as const,
                } as Record<string, "included" | "excluded">;
                mangaType.push({
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            {
                                id: "types",
                                value: getExcludedTypeObject,
                            },
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
                return this.parser.parseTrendingChapters($, metadata);
            }
            case "mese_section": {
                console.log("Loading mese_section loaded");
                return this.parser.parseMonthTrending($, metadata);
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
        return getOrderFilter().map((item) => ({
            id: item.id,
            label: item.value,
        }));
    }

    constructSearchRequestURL(
        page: number,
        query: SearchQuery = { title: "", filters: [] },
        sorting: SortingOption | undefined,
    ): {
        url: string;
        excluded: { generi: string[]; tipi: string[] };
    } {
        const generi: string[] = [];
        const generi_esclusi: string[] = [];
        const tipi_esclusi: string[] = [];
        const tipologia: string[] = [];
        const stato: string[] = [];
        const anno: string[] = [];
        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        const genres: string | Record<string, "included" | "excluded"> =
            getFilterValue("genres") ?? "";
        const types: string | Record<string, "included" | "excluded"> =
            getFilterValue("types") ?? "";
        const status: string | Record<string, "included" | "excluded"> =
            getFilterValue("status") ?? "";
        const year: string | Record<string, "included" | "excluded"> =
            getFilterValue("year") ?? "";
        if (genres && typeof genres === "object") {
            for (const tag of Object.entries(genres)) {
                if (tag[1] == "included") generi.push(tag[0]);
                if (tag[1] == "excluded")
                    generi_esclusi.push(
                        getGenreFilter().find((item) => item.id === tag[0])
                            ?.value ?? "",
                    );
            }
        }

        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                if (tag[1] == "included") tipologia.push(tag[0]);
                if (tag[1] == "excluded") tipi_esclusi.push(tag[0]);
            }
        }

        if (status && typeof status === "object") {
            for (const tag of Object.entries(status)) {
                if (tag[0].length > 0) stato.push(tag[0]);
            }
        } else if (status.length > 0) stato.push(status);

        if (year && typeof year === "object") {
            for (const tag of Object.entries(year)) {
                if (tag[0].length > 0) anno.push(tag[0]);
            }
        } else if (year.length > 0) anno.push(year);

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
        if (stato.length > 0) urlBuilder.addQueryParameter("status", stato[0]);
        if (anno.length > 0) urlBuilder.addQueryParameter("year", anno[0]);
        return {
            url: urlBuilder.buildUrl(),
            excluded: { generi: generi_esclusi, tipi: tipi_esclusi },
        };
    }
}

export const MangaWorldAdult = new MangaAdultExtension();
