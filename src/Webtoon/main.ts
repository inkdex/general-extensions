import {
    Chapter,
    ChapterDetails,
    ChapterProviding,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    PagedResults,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SortingOption,
    SourceManga,
} from "@paperback/types";
import {
    getDateDayFormat,
    getLanguagesTitle,
    Language,
} from "./WebtoonI18NHelper";
import { WebtoonInfra } from "./WebtoonInfra";
import { Tag, WebtoonsSearchingMetadata } from "./WebtoonParser";

export const BASE_URL = "https://www.webtoons.com";
export const MOBILE_URL = "https://m.webtoons.com";

export class WebtoonExtention
    extends WebtoonInfra
    implements
        SearchResultsProviding,
        ChapterProviding,
        DiscoverSectionProviding
{
    constructor() {
        super(BASE_URL, MOBILE_URL);
    }

    getMangaDetails(mangaId: string): Promise<SourceManga> {
        return this.ExecRequest(
            {
                url: `${this.BASE_URL}/${mangaId}`,
            },
            ($) => this.parseDetails($, mangaId),
        );
    }

    getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return this.ExecRequest(
            {
                url: `${this.MOBILE_URL}/${sourceManga.mangaId}`,
                headers: { referer: this.MOBILE_URL },
            },
            ($) => this.parseChaptersList($, sourceManga),
        );
    }

    getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        return this.ExecRequest(
            {
                url: `${this.BASE_URL}/${chapter.chapterId}`,
            },
            ($) => this.parseChapterDetails($, chapter),
        );
    }

    getPopularTitles(
        language: Language,
        metadata: WebtoonsSearchingMetadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecPagedResultsRequest(
            { url: `${this.BASE_URL}/${language}/ranking/popular` },
            { page: metadata?.page ?? 0, maxPages: 1 },
            ($) => this.parseTodayTitles($, true),
        );
    }

    getTodayTitles(
        language: Language,
        metadata: WebtoonsSearchingMetadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecPagedResultsRequest(
            {
                url: `${this.BASE_URL}/${language}/originals/${getDateDayFormat()}`,
            },
            { page: metadata?.page ?? 0, maxPages: 1 },
            ($) => this.parseTodayTitles($, true),
        );
    }

    getTrendingTitles(
        language: Language,
        metadata: WebtoonsSearchingMetadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecPagedResultsRequest(
            { url: `${this.BASE_URL}/${language}/ranking/trending` },
            { page: metadata?.page ?? 0, maxPages: 1 },
            ($) => this.parseTodayTitles($, true),
        );
    }

    getCompletedTitles(
        language: Language,
        metadata: WebtoonsSearchingMetadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecPagedResultsRequest(
            { url: `${this.BASE_URL}/${language}/originals/complete` },
            { page: metadata?.page ?? 0, maxPages: 1 },
            ($) => this.parseTodayTitles($, true),
        );
    }

    getCanvasRecommendedTitles(
        language: Language,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecRequest(
            { url: `${this.BASE_URL}/${language}/canvas` },
            ($) => this.parseCanvasRecommendedTitles($),
        );
    }

    getCanvasPopularTitles(
        language: Language,
        metadata: WebtoonsSearchingMetadata | undefined,
        genre?: string,
        sortOrder?: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecPagedResultsRequest(
            {
                url: `${this.BASE_URL}/${language}/canvas/list`,
                params: {
                    genreTab: genre ?? "ALL",
                    sortOrder:
                        sortOrder?.id == "MANA"
                            ? "READ_COUNT"
                            : (sortOrder?.id ?? "READ_COUNT"),
                },
            },
            { page: metadata?.page ?? 0 },
            ($) => this.parseCanvasPopularTitles($),
        );
    }

    getTitlesByGenre(
        language: Language,
        genre: string,
        sortOrder: SortingOption | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecRequest(
            {
                url: `${this.BASE_URL}/${language}/genres/${genre}`,
                params: { sortOrder: sortOrder?.id ?? "" },
            },
            ($) => this.parseTagResults($),
        );
    }

    getTitlesByKeyword(
        language: Language,
        keyword: string,
        metadata: WebtoonsSearchingMetadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.ExecPagedResultsRequest(
            {
                url: `${this.BASE_URL}/${language}/search`,
                params: {
                    keyword: keyword,
                    // ...(this.canvasWanted ? {} : { searchType: "WEBTOON" }),
                },
            },
            { page: metadata?.page ?? 0 },
            ($) => this.parseSearchResults($),
        );
    }

    getSearchResults(
        query: SearchQuery,
        metadata: WebtoonsSearchingMetadata | undefined,
        sortingOption: SortingOption | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        let genre = "";
        const includedlanguage: Language[] = [];

        for (const filter of query.filters) {
            switch (filter.id) {
                case "languages": {
                    const language = (filter.value ?? {}) as Record<
                        string,
                        "included" | "excluded"
                    >;

                    for (const lang of Object.entries(language)) {
                        switch (lang[1]) {
                            case "included":
                                includedlanguage.push(lang[0] as Language);
                                break;
                            case "excluded":
                                // Excluded languages are ignored
                                break;
                        }
                    }
                    break;
                }
                case "genres":
                    genre = (filter.value as string) ?? "ALL";
                    break;
                default:
                    // Ignore other filters
                    break;
            }
        }

        const result: Promise<PagedResults<SearchResultItem>>[] = [];

        if (includedlanguage.length < 1) {
            this.languages.forEach((lang) => includedlanguage.push(lang));
        }

        includedlanguage.forEach((lang) => {
            result.push(
                genre !== "ALL"
                    ? genre.startsWith("CANVAS%%")
                        ? this.getCanvasPopularTitles(
                              lang,
                              metadata,
                              genre.split("%%")[1],
                              sortingOption,
                          )
                        : this.getTitlesByGenre(lang, genre, sortingOption)
                    : query.title
                      ? this.getTitlesByKeyword(lang, query.title, metadata)
                      : Promise.resolve({ items: [] }),
            );
        });

        return Promise.all(result).then((res) => {
            return {
                items: res.flatMap((r) => r.items),
                metadata: res[0].metadata,
            };
        });
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const genres = await this.getSearchGenres();
        return [
            {
                id: "languages",
                title: "Languages",
                type: "multiselect",
                options: Object.values(Language).map((lang) => ({
                    id: lang,
                    value: getLanguagesTitle(lang) ?? lang,
                })),
                value: {},
                allowEmptySelection: true,
                allowExclusion: false,
                maximum: undefined,
            },
            {
                id: "genres",
                title: "Genres",
                type: "dropdown",
                options: genres,
                value: "ALL",
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: WebtoonsSearchingMetadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        let result: PagedResults<SearchResultItem> = { items: [] };
        const [languagestr, sectionId] = section.id.split("-_-");
        const language = languagestr as Language;

        switch (sectionId) {
            case "trending":
                result = await this.getTrendingTitles(language, metadata);
                break;
            case "today":
                result = await this.getTodayTitles(language, metadata);
                break;
            case "popular":
                result = await this.getPopularTitles(language, metadata);
                break;
            case "completed":
                result = await this.getCompletedTitles(language, metadata);
                break;
            case "canvas_recommended":
                result = await this.getCanvasRecommendedTitles(language);
                break;
            case "canvas_popular":
                result = await this.getCanvasPopularTitles(language, metadata);
                break;
        }

        return {
            items: result.items.map((item) => ({
                type: "simpleCarouselItem",
                ...item,
            })),
            metadata: result.metadata,
        };
    }

    getDiscoverSections(): Promise<DiscoverSection[]> {
        const result: DiscoverSection[] = [];
        this.languages.forEach((language) => {
            result.push(...this.getLanguageDiscoverSections(language));
        });
        return Promise.resolve(result);
    }

    getLanguageDiscoverSections(language: Language): DiscoverSection[] {
        const idBegin = `${language}-_-`;
        const titleBegin =
            this.languages.length > 1
                ? `${getLanguagesTitle(language)} - `
                : "";
        return [
            {
                id: `${idBegin}trending`,
                title: `${titleBegin}New & Trending`,
                type: DiscoverSectionType.prominentCarousel,
            },

            {
                id: `${idBegin}today`,
                title: `${titleBegin}Today release`,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: `${idBegin}popular`,
                title: `${titleBegin}Popular`,
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: `${idBegin}completed`,
                title: `${titleBegin}Completed`,
                type: DiscoverSectionType.simpleCarousel,
            },
            ...(this.canvasWanted
                ? [
                      {
                          id: `${idBegin}canvas_recommended`,
                          title: `${titleBegin}Canvas Recommended`,
                          type: DiscoverSectionType.simpleCarousel,
                      },
                      {
                          id: `${idBegin}canvas_popular`,
                          title: `${titleBegin}Canvas Popular`,
                          type: DiscoverSectionType.simpleCarousel,
                      },
                  ]
                : []),
        ];
    }

    // TODO GENRES LOCALISATION
    async getSearchGenres(): Promise<Tag[]> {
        return [
            { id: "ALL", value: "All" },
            ...(await this.ExecRequest(
                { url: `${this.BASE_URL}/en/genres` },
                ($) => this.parseGenres($),
            )),
            ...(this.canvasWanted
                ? await this.ExecRequest(
                      { url: `${this.BASE_URL}/en/canvas` },
                      ($) => this.parseCanvasGenres($),
                  )
                : []),
        ];
    }

    async getSortingOptions(): Promise<SortingOption[]> {
        return [
            { id: "MANA", label: "Popularity" },
            { id: "LIKEIT", label: "Likes" },
            { id: "UPDATE", label: "Date" },
        ];
    }
}

export const Webtoon = new WebtoonExtention();
