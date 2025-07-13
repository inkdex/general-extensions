import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    Extension,
    Form,
    MangaProviding,
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SettingsFormProviding,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { getState } from "../utils/state";
import { URLBuilder } from "../utils/url-builder/array-query-variant";
import { WeebCentralMetadata } from "./interfaces/WeebCentralInterfaces";
import pbconfig from "./pbconfig";
import { WC_DOMAIN } from "./WeebCentralConfig";
import { TagSectionId } from "./WeebCentralEnums";
import { WeebCentralForm } from "./WeebCentralForm";
import {
    getFilterTagsBySection,
    getShareUrl,
    getTagFromTagStore,
    isInvalidTags,
} from "./WeebCentralHelper";
import { WeebCentralInterceptor } from "./WeebCentralInterceptor";
import {
    isLastPage,
    parseChapterDetails,
    parseChapters,
    parseHotSection,
    parseMangaDetails,
    parseRecentSection,
    parseRecommendedSection,
    parseSearch,
    parseTags,
} from "./WeebCentralParser";

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
        metadata: WeebCentralMetadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        let items: DiscoverSectionItem[] = [];
        const urlBuilder = new URLBuilder(WC_DOMAIN);
        const page: number = metadata?.page ?? 1;

        switch (section.id) {
            case "recommended": {
                const [_, buffer] = await Application.scheduleRequest({
                    url: urlBuilder.build(),
                    method: "GET",
                });
                const $ = cheerio.load(
                    Application.arrayBufferToUTF8String(buffer),
                );
                items = await parseRecommendedSection($);
                break;
            }
            case "recent": {
                const [_, buffer] = await Application.scheduleRequest({
                    url: urlBuilder.build(),
                    method: "GET",
                });
                const $ = cheerio.load(
                    Application.arrayBufferToUTF8String(buffer),
                );
                items = await parseRecentSection($);
                metadata = !isLastPage($) ? { page: page + 1 } : undefined;
                break;
            }
            case "hot": {
                const [_, buffer] = await Application.scheduleRequest({
                    url: urlBuilder.build(),
                    method: "GET",
                });
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
        const request = {
            url: new URLBuilder(WC_DOMAIN)
                .addPath("series")
                .addPath(mangaId)
                .build(),
            method: "GET",
        };

        const [_, buffer] = await Application.scheduleRequest(request);

        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return await parseMangaDetails($, mangaId);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const request = {
            url: new URLBuilder(WC_DOMAIN)
                .addPath("series")
                .addPath(sourceManga.mangaId)
                .addPath("full-chapter-list")
                .build(),
            method: "GET",
        };
        const [_, buffer] = await Application.scheduleRequest(request);
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        return parseChapters($, sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const url = new URLBuilder(WC_DOMAIN)
            .addPath("chapters")
            .addPath(chapter.chapterId)
            .addPath("images")
            .addQuery("reading_style", "long_strip")
            .build();

        const request: Request = { url, method: "GET" };

        const [_, buffer] = await Application.scheduleRequest(request);
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
            const request = {
                url: new URLBuilder(WC_DOMAIN).addPath("search").build(),
                method: "GET",
            };

            const [_, buffer] = await Application.scheduleRequest(request);
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

        filters.push(this.getGenresFilter(tags));
        filters.push(this.getSeriesStatusFilter(tags));
        filters.push(this.getSeriesTypeFilter(tags));
        filters.push(this.getOrderFilter(tags));

        return filters;
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: WeebCentralMetadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const LIMIT = 32;
        const offset = metadata?.offset ?? 0;
        let newUrlBuilder: URLBuilder = new URLBuilder(WC_DOMAIN)
            .addPath("search")
            .addPath("data")
            .addQuery("sort", "Best Match")
            .addQuery("display_mode", "Full Display")
            .addQuery("limit", LIMIT.toString())
            .addQuery("offset", offset.toString());

        if (query.title) {
            newUrlBuilder = newUrlBuilder.addQuery("text", query.title);
        }

        newUrlBuilder = newUrlBuilder
            .addQuery(
                TagSectionId.Genres,
                getFilterTagsBySection(TagSectionId.Genres, query.filters),
            )
            .addQuery(
                TagSectionId.SeriesStatus,
                getFilterTagsBySection(
                    TagSectionId.SeriesStatus,
                    query.filters,
                ),
            )
            .addQuery(
                TagSectionId.SeriesType,
                getFilterTagsBySection(TagSectionId.SeriesType, query.filters),
            )
            .addQuery(
                TagSectionId.Order,
                getFilterTagsBySection(TagSectionId.Order, query.filters),
            );

        const response = await Application.scheduleRequest({
            url: newUrlBuilder.build(),
            method: "GET",
        });
        const $ = cheerio.load(
            Application.arrayBufferToUTF8String(response[1]),
        );

        const items = await parseSearch($);
        metadata = isLastPage($)
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
        return new WeebCentralForm();
    }
}

export const WeebCentral = new WeebCentralExtension();
