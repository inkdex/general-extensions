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
    SortingOption,
    SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { Forms } from "./forms";
import {
    baseUrl,
    blacklistedTags,
    blacklistedType,
    getGenreFilter,
    getMangaTypeFilter,
    getOrderFilter,
    getPageCache,
    getRating,
    getStatusFilter,
    getYearFilter,
    Metadata,
    populateFilter,
} from "./helpers";
import { MainInterceptor } from "./interceptors";
import { Parsers } from "./parsers";
import { Requests } from "./requests";

// Should match the capabilities which you defined in pbconfig.ts
type ContentTemplateImplementation = SettingsFormProviding &
    Extension &
    DiscoverSectionProviding &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;

// Main extension class
export class MangaWorldExtension implements ContentTemplateImplementation {
    // Implementation of the main rate limiter
    mainRateLimiter = new BasicRateLimiter("main", {
        numberOfRequests: 15,
        bufferInterval: 10,
        ignoreImages: true,
    });
    RETRIES = 10;
    private parser = new Parsers();
    private requests = new Requests();
    // Implementation of the main interceptor
    mainInterceptor = new MainInterceptor("main");

    // Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
    }

    // Implements the settings form, check SettingsForm.ts for more info
    async getSettingsForm(): Promise<Form> {
        await populateFilter();
        return new Forms();
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        await populateFilter();
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
            title: "Tipologia",
            value: getExcludedTypeObject,
            allowEmptySelection: true,
            maximum: 3,
        });
        filters.push({
            type: "multiselect",
            options: getGenreFilter(),
            id: "genres",
            allowExclusion: true,
            title: "Genere",
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
        let page = Math.max(metadata?.page ?? 1, 1);
        for (let cycle = 0; cycle < 5 && manga.length < 16; cycle++, page++) {
            const { url, excluded } = this.requests.constructSearchRequestURL(
                page,
                query,
                sorting,
            );
            const $ = await this.requests.getSearchResultsRequests(url);
            const pagText = $(".search-quantity").text().trim().split(" ")[0];
            const total = pagText === "Nessun" ? 0 : Number(pagText);
            if (Number.isNaN(total) || total <= 0) break; // No results or invalid number
            const newPage = await this.parser.parseSearchResults($, excluded);
            manga.push(...newPage);
            console.log(
                `[SEARCH] Parsed total: ${total}, current manga count: ${manga.length}`,
            );
            if (manga.length >= total) break; // all results inside the array
        }
        return { items: manga, metadata: { page } };
    }

    // Populates the title details
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        console.log("[MANGA] Get Details of MangaID " + mangaId);
        const data = getPageCache(mangaId, `${baseUrl}/manga/${mangaId}`);
        const $ = cheerio.load(Application.arrayBufferToUTF8String(await data));
        return this.parser.parseMangaDetails(
            $,
            mangaId,
            `${baseUrl}/manga/${mangaId}`,
        );
    }

    // Populates the chapter list
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        console.log("[MANGA] Get Chapters of MangaID " + sourceManga.mangaId);
        const data = getPageCache(
            sourceManga.mangaId,
            `${baseUrl}/manga/${sourceManga.mangaId}`,
        );
        const $ = cheerio.load(Application.arrayBufferToUTF8String(await data));
        return this.parser.parseChapters($, sourceManga);
    }

    // Populates a chapter with images
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const data = getPageCache(
            `${chapter.sourceManga.mangaId}-${chapter.chapterId}`,
            `${baseUrl}/manga/${chapter.sourceManga.mangaId}/read/${chapter.chapterId}/?style=list`,
        );
        const $ = cheerio.load(Application.arrayBufferToUTF8String(await data));
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
                title: "Tendenze del Mese",
                subtitle: "Più letti del mese",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "most_read_section",
                title: "Più Letti",
                subtitle: "I più popolari di sempre",
                type: DiscoverSectionType.simpleCarousel,
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
                subtitle: "Le nuove Aggiunte",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "type_section",
                title: "Tipologia",
                subtitle: "Più letti di una tipologia",
                type: DiscoverSectionType.genres,
            },
            {
                id: "genre_section",
                title: "Genere",
                subtitle: "Più letti di un genere",
                type: DiscoverSectionType.genres,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const $ = cheerio.load(
            Application.arrayBufferToUTF8String(
                await getPageCache("home", baseUrl),
            ),
        );
        switch (section.id) {
            case "popular_section": {
                console.log("[HOME] Loading popular_section");
                return this.parser.parseTrendingChapters($, metadata);
            }
            case "mese_section": {
                console.log("[HOME] Loading mese_section");
                return this.parser.parseMonthTrending($, metadata);
            }
            case "most_read_section": {
                console.log("[HOME] Loading most_read_section");
                return this.parser.parseMostReadSection(metadata);
            }
            case "updated_section": {
                console.log("[HOME] Loading updated_section");
                return this.parser.parseLastAddedSection($, metadata);
            }
            case "new_manga_section": {
                console.log("[HOME] Loading new_manga_section");
                return this.parser.parseLastMangaAddedSection(metadata);
            }
            case "genre_section": {
                await populateFilter();
                const allGenres: DiscoverSectionItem[] = [];
                getGenreFilter()
                    .filter((option) => !blacklistedTags([option.id]))
                    .forEach((filter) => {
                        const getExcludedValueObject = {
                            ...Object.fromEntries(
                                getGenreFilter()
                                    .filter((option) =>
                                        blacklistedTags([option.id]),
                                    )
                                    .map((item) => [
                                        item.id,
                                        "excluded" as const,
                                    ]),
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
                            contentRating: getRating([filter.value]),
                        });
                    });
                console.log("[HOME] Loading genre_section");
                return {
                    items: allGenres,
                    metadata: metadata,
                };
            }
            case "type_section": {
                await populateFilter();
                const mangaType: DiscoverSectionItem[] = [];
                getMangaTypeFilter()
                    .filter((option) => !blacklistedType(option.value))
                    .forEach((filter) => {
                        const getExcludedTypeObject = {
                            ...Object.fromEntries(
                                getMangaTypeFilter()
                                    .filter((option) =>
                                        blacklistedType(option.value),
                                    )
                                    .map((item) => [
                                        item.id,
                                        "excluded" as const,
                                    ]),
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
                            contentRating: ContentRating.EVERYONE,
                        });
                    });
                console.log("[HOME] Loading type_section");
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
}

export const MangaWorld = new MangaWorldExtension();
