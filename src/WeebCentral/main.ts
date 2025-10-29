import {
    BasicRateLimiter,
    DiscoverSectionType,
    Form,
    type Chapter,
    type ChapterDetails,
    type ChapterProviding,
    type DiscoverSection,
    type DiscoverSectionItem,
    type DiscoverSectionProviding,
    type Extension,
    type MangaProviding,
    type PagedResults,
    type SearchFilter,
    type SearchQuery,
    type SearchResultItem,
    type SearchResultsProviding,
    type SettingsFormProviding,
    type SourceManga,
    type Tag,
    type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { getState } from "../utils/state";
import { SettingsForm } from "./forms";
import {
    getFilterTagsBySection,
    getShareUrl,
    getTagFromTagStore,
    isInvalidTags,
    newQuery,
} from "./helpers";
import { WeebCentralInterceptor } from "./interceptors";
import { TagSectionId, type Metadata } from "./models";
import {
    isLastPage,
    parseChapterDetails,
    parseChapters,
    parseHotSection,
    parseMangaDetails,
    parseRecentSection,
    parseRecentSectionViewMore,
    parseRecommendedSection,
    parseSearch,
    parseTags,
} from "./parsers";
import pbconfig from "./pbconfig";
import {
    fetchChapterDetailsPage,
    fetchChaptersPage,
    fetchHomepage,
    fetchMangaDetailsPage,
    fetchRecentViewMorePage,
    fetchSearchPage,
} from "./requests";

export class WeebCentralExtension
    implements
        Extension,
        SearchResultsProviding,
        MangaProviding,
        ChapterProviding,
        DiscoverSectionProviding,
        SettingsFormProviding
{
    globalRateLimiter = new BasicRateLimiter("ratelimiter", {
        numberOfRequests: 10,
        bufferInterval: 0.5,
        ignoreImages: true,
    });

    requestManager = new WeebCentralInterceptor("main");

    async initialise(): Promise<void> {
        this.globalRateLimiter.registerInterceptor();
        this.requestManager.registerInterceptor();
        if (Application.isResourceLimited) return;
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "recommended",
                title: "Recommended Mangas",
                type: DiscoverSectionType.featured,
            },

            {
                id: "recent",
                title: "Recently Updated",
                type: DiscoverSectionType.chapterUpdates,
            },

            {
                id: "hot",
                title: "Hot Updates",
                type: DiscoverSectionType.simpleCarousel,
            },

            { id: "genres", title: "Genres", type: DiscoverSectionType.genres },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        let items: DiscoverSectionItem[] = [];
        const page: number = metadata?.page ?? 1;

        switch (section.id) {
            case "recommended": {
                const [_, buffer] = await fetchHomepage();
                const $ = cheerio.load(
                    Application.arrayBufferToUTF8String(buffer),
                );
                items = await parseRecommendedSection($);
                break;
            }
            case "recent": {
                let $: cheerio.CheerioAPI;
                if (page == 1) {
                    const [_, buffer] = await fetchHomepage();
                    $ = cheerio.load(
                        Application.arrayBufferToUTF8String(buffer),
                    );

                    items = await parseRecentSection($);
                } else {
                    const [_, buffer] = await fetchRecentViewMorePage(page);
                    $ = cheerio.load(
                        Application.arrayBufferToUTF8String(buffer),
                    );
                    items = await parseRecentSectionViewMore($);
                }
                metadata = !isLastPage($, "View More...")
                    ? { page: page + 1 }
                    : undefined;
                break;
            }
            case "hot": {
                const [_, buffer] = await fetchHomepage();
                const $ = cheerio.load(
                    Application.arrayBufferToUTF8String(buffer),
                );
                items = await parseHotSection($);
                break;
            }
            case "genres": {
                const genres = await this.getGenres();
                items = genres.map((genre) => ({
                    type: "genresCarouselItem",
                    searchQuery: {
                        title: "",
                        filters: [
                            {
                                id: TagSectionId.Genres,
                                value: { [genre.id]: "included" },
                            },
                        ],
                    },
                    name: genre.title,
                    metadata: metadata,
                }));
            }
        }
        return { items, metadata };
    }

    getMangaShareUrl(mangaId: string): string {
        return getShareUrl(mangaId);
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const [_, buffer] = await fetchMangaDetailsPage(mangaId);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return await parseMangaDetails($, mangaId);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const [_, buffer] = await fetchChaptersPage(sourceManga.mangaId);
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return parseChapters($, sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const [_, buffer] = await fetchChapterDetailsPage(chapter.chapterId);
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return parseChapterDetails(
            $,
            chapter.sourceManga.mangaId,
            chapter.chapterId,
        );
    }

    async supportsTagExclusion(): Promise<boolean> {
        return false;
    }

    async getGenres(): Promise<Tag[]> {
        let tags = getState<TagSection[]>("tags", []);
        if (tags.length == 0) {
            tags = await this.getSearchTags();
            if (tags.length == 0) {
                throw new Error("Tags not found");
            }
        }
        const genreTag = tags.find(
            (tag) => (tag.id as TagSectionId) === TagSectionId.Genres,
        );
        if (genreTag === undefined) {
            throw new Error("Genres tag section not found");
        }
        if (isInvalidTags(genreTag.tags)) {
            throw new Error(`Please reset ${pbconfig.name} state in settings`);
        }
        return genreTag.tags;
    }

    async getSearchTags(): Promise<TagSection[]> {
        let tags = getState<TagSection[]>("tags", []);
        if (tags.length > 0) {
            console.log("bypassing web request");
            return tags;
        }
        try {
            console.log("fetching tags from web request");
            const [_, buffer] = await fetchSearchPage([], []);
            const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
            tags = await parseTags($);
            Application.setState(tags, "tags");
            return tags;
        } catch (error) {
            throw new Error(error as string);
        }
    }
    async getSearchFilters(): Promise<SearchFilter[]> {
        const tags = await this.getSearchTags();
        const filters: SearchFilter[] = [];

        filters.push(
            this.getGenresFilter(tags),
            this.getSeriesStatusFilter(tags),
            this.getSeriesTypeFilter(tags),
            this.getOrderFilter(tags),
        );

        return filters;
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const LIMIT = 32;
        const offset = metadata?.offset ?? 0;
        const paths = ["data"];
        const queries = [
            newQuery("sort", "Best Match"),
            newQuery("display_mode", "Full Display"),
            newQuery("limit", LIMIT.toString()),
            newQuery("offset", offset.toString()),
        ];
        if (query.title) {
            queries.push(newQuery("text", query.title));
        }

        queries.push(
            newQuery(
                TagSectionId.Genres,
                getFilterTagsBySection(TagSectionId.Genres, query.filters),
            ),
            newQuery(
                TagSectionId.SeriesStatus,
                getFilterTagsBySection(
                    TagSectionId.SeriesStatus,
                    query.filters,
                ),
            ),
            newQuery(
                TagSectionId.SeriesType,
                getFilterTagsBySection(TagSectionId.SeriesType, query.filters),
            ),
            newQuery(
                TagSectionId.Order,
                getFilterTagsBySection(TagSectionId.Order, query.filters),
            ),
        );

        const [_, buffer] = await fetchSearchPage(paths, queries);
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

        const items = await parseSearch($);
        metadata = isLastPage($, "View More Results...")
            ? undefined
            : { ...metadata, offset: offset + LIMIT };
        return { items, metadata };
    }

    getGenresFilter(tags: TagSection[]): SearchFilter {
        const tag = getTagFromTagStore(TagSectionId.Genres, tags);
        return {
            id: tag.id,
            title: tag.title,
            type: "multiselect",
            options: tag.tags.map((x) => ({ id: x.id, value: x.title })),
            allowExclusion: false,
            value: {},
            allowEmptySelection: false,
            maximum: undefined,
        };
    }

    getSeriesStatusFilter(tags: TagSection[]): SearchFilter {
        const tag = getTagFromTagStore(TagSectionId.SeriesStatus, tags);
        return {
            id: tag.id,
            title: tag.title,
            type: "multiselect",
            options: tag.tags.map((x) => ({ id: x.id, value: x.title })),
            allowExclusion: false,
            value: {},
            allowEmptySelection: false,
            maximum: undefined,
        };
    }

    getSeriesTypeFilter(tags: TagSection[]): SearchFilter {
        const tag = getTagFromTagStore(TagSectionId.SeriesType, tags);
        return {
            id: tag.id,
            title: tag.title,
            type: "multiselect",
            options: tag.tags.map((x) => ({ id: x.id, value: x.title })),
            allowExclusion: false,
            value: {},
            allowEmptySelection: false,
            maximum: undefined,
        };
    }

    getOrderFilter(tags: TagSection[]): SearchFilter {
        const tag = getTagFromTagStore(TagSectionId.Order, tags);
        return {
            id: tag.id,
            title: tag.title,
            type: "dropdown",
            options: tag.tags.map((x) => ({ id: x.id, value: x.title })),
            value: "Ascending",
        };
    }

    async getSettingsForm(): Promise<Form> {
        return new SettingsForm();
    }
}

export const WeebCentral = new WeebCentralExtension();
