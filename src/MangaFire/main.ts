import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    CloudflareError,
    ContentRating,
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
    SortingOption,
    SourceManga,
    TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import * as htmlparser2 from "htmlparser2";
// import { postToDiscordWebhook } from "../utils/discord_debugging";
import { URLBuilder } from "../utils/url-builder/base";
import { FireInterceptor } from "./MangaFireInterceptor";
import { getLanguages, MangaFireSettingsForm } from "./MangaFireSettings";

const baseUrl = "https://mangafire.to";

type MangaFireImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    SettingsFormProviding &
    DiscoverSectionProviding;

export class MangaFireExtension implements MangaFireImplementation {
    requestManager = new FireInterceptor("main");
    globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 10,
        bufferInterval: 1,
        ignoreImages: true,
    });

    async initialise(): Promise<void> {
        this.requestManager.registerInterceptor();
        this.globalRateLimiter.registerInterceptor();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "popular_section",
                title: "Popular",
                type: DiscoverSectionType.featured,
            },
            {
                id: "updated_section",
                title: "Recently Updated",
                type: DiscoverSectionType.chapterUpdates,
            },
            {
                id: "new_manga_section",
                title: "New Manga",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "languages_section",
                title: "Languages",
                type: DiscoverSectionType.genres,
            },
            {
                id: "types_section",
                title: "Types",
                type: DiscoverSectionType.genres,
            },
            {
                id: "genres_section",
                title: "Genres",
                type: DiscoverSectionType.genres,
            },
        ];
    }

    async getSettingsForm(): Promise<Form> {
        return new MangaFireSettingsForm();
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: MangaFire.Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        switch (section.id) {
            case "popular_section":
                return this.getPopularSectionItems(section, metadata);
            case "updated_section":
                return this.getUpdatedSectionItems(section, metadata);
            case "new_manga_section":
                return this.getNewMangaSectionItems(section, metadata);
            case "types_section":
                return this.getTypesSection();
            case "genres_section":
                return this.getFilterSection();
            case "languages_section":
                return this.getLanguagesSection();
            default:
                return { items: [] };
        }
    }

    private async getSearchDetails() {
        try {
            const request = {
                url: `${baseUrl}/filter`,
                method: "GET",
            };

            const $ = await this.fetchCheerio(request);
            const types: { id: string; label: string }[] = [];
            const genres: { id: string; label: string }[] = [];
            const status: { id: string; label: string }[] = [];
            const languages: { id: string; label: string }[] = [];
            const years: { id: string; label: string }[] = [];
            const lengths: { id: string; label: string }[] = [];
            const sorts: { id: string; label: string }[] = [];

            $(
                ".dropdown:has(button .value[data-placeholder='Type']) .dropdown-menu.noclose.c1 li",
            ).each((_, element) => {
                const id = $(element).find("input").attr("value") ?? "";
                const label = $(element).find("label").text().trim();
                if (label) {
                    types.push({ id, label });
                }
            });

            $(".genres li").each((_, element) => {
                const id = $(element).find("input").attr("value") ?? "";
                const label = $(element).find("label").text().trim();
                if (label && id) {
                    genres.push({ id, label });
                }
            });

            $(
                ".dropdown:has(button .value[data-placeholder='Status']) .dropdown-menu.noclose.c1 li",
            ).each((_, element) => {
                const id = $(element).find("input").attr("value") ?? "";
                const label = $(element).find("label").text().trim();
                if (label && id) {
                    status.push({ id, label });
                }
            });

            $(
                ".dropdown:has(button .value[data-placeholder='Language']) .dropdown-menu.noclose.c1 li",
            ).each((_, element) => {
                const id = $(element).find("input").attr("value") ?? "";
                const label = $(element).find("label").text().trim();
                if (label && id) {
                    languages.push({ id, label });
                }
            });

            $(
                ".dropdown:has(button .value[data-placeholder='Year']) .dropdown-menu.noclose.md.c3 li",
            ).each((_, element) => {
                const id = $(element).find("input").attr("value") ?? "";
                const label = $(element).find("label").text().trim();
                if (label && id) {
                    years.push({ id, label });
                }
            });

            $(
                ".dropdown:has(button .value[data-placeholder='Length']) .dropdown-menu.noclose.c1 li",
            ).each((_, element) => {
                const id = $(element).find("input").attr("value") ?? "";
                const label = $(element).find("label").text().trim();
                if (label && id) {
                    lengths.push({ id, label });
                }
            });

            $(
                ".dropdown:has(button .value[data-placeholder='Sort']) .dropdown-menu.noclose.c1 li",
            ).each((_, element) => {
                const id = $(element).find("input").attr("value") ?? "";
                const label = $(element).find("label").text().trim();
                if (label && id) {
                    sorts.push({ id, label });
                }
            });

            return {
                types: types,
                genres: genres,
                status: status,
                languages: languages,
                years: years,
                lengths: lengths,
                sorts: sorts,
            };
        } catch (error) {
            console.error("Error fetching search details:", error);
        }
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];
        const searchDetails = await this.getSearchDetails();
        filters.push({
            id: "type",
            type: "dropdown",
            options: [
                { id: "all", value: "All" },
                ...(searchDetails?.types?.map((t) => ({
                    id: t.id,
                    value: t.label,
                })) || []),
            ],
            value: "all",
            title: "Type Filter",
        });

        filters.push({
            id: "genres",
            type: "multiselect",
            options:
                searchDetails?.genres?.map((g) => ({
                    id: g.id,
                    value: g.label,
                })) || [],
            allowExclusion: true,
            value: {},
            title: "Genre Filter",
            allowEmptySelection: false,
            maximum: undefined,
        });

        filters.push({
            id: "status",
            type: "dropdown",
            options: [
                { id: "all", value: "All" },
                ...(searchDetails?.status?.map((s) => ({
                    id: s.id,
                    value: s.label,
                })) || []),
            ],
            value: "all",
            title: "Status Filter",
        });

        filters.push({
            id: "language",
            type: "dropdown",
            options: [
                { id: "all", value: "All" },
                ...(searchDetails?.languages?.map((l) => ({
                    id: l.id,
                    value: l.label,
                })) || []),
            ],
            value: "all",
            title: "Language Filter",
        });

        filters.push({
            id: "year",
            type: "dropdown",
            options: [
                { id: "all", value: "All" },
                ...(searchDetails?.years?.map((y) => ({
                    id: y.id,
                    value: y.label,
                })) || []),
            ],
            value: "all",
            title: "Year Filter",
        });

        filters.push({
            id: "length",
            type: "dropdown",
            options: [
                { id: "all", value: "All" },
                ...(searchDetails?.lengths?.map((l) => ({
                    id: l.id,
                    value: l.label,
                })) || []),
            ],
            value: "all",
            title: "Length Filter",
        });

        return filters;
    }

    async getSortingOptions(query: SearchQuery): Promise<SortingOption[]> {
        void query;

        const searchDetails = await this.getSearchDetails();
        const sortingOptions: SortingOption[] =
            searchDetails?.sorts?.map((sort) => ({
                id: sort.id,
                label: sort.label,
            })) || [];

        return sortingOptions;
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: { page?: number } | undefined,
        sortingOption?: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;
        // Example: https://mangafire.to/filter?keyword=one%20piece&page=1&genre_mode=and&type[]=manhwa&genre[]=action&status[]=releasing&sort=most_relevance
        // Multple Genres: https://mangafire.to/filter?keyword=one+piece&type%5B%5D=manga&genre%5B%5D=1&genre%5B%5D=31&genre_mode=and&status%5B%5D=releasing&sort=most_relevance
        // No Genre: https://mangafire.to/filter?keyword=one+piece&type%5B%5D=manga&genre_mode=and&status%5B%5D=releasing&sort=most_relevance
        // With pages: https://mangafire.to/filter?page=2&keyword=one%20piece
        // ALL: https://mangafire.to/filter?keyword=one+peice&sort=recently_updated
        // Exclude: https://mangafire.to/filter?keyword=&genre%5B%5D=-9&sort=recently_updated
        const searchUrl = new URLBuilder(baseUrl)
            .addPath("filter")
            .addQuery("keyword", query.title)
            .addQuery("page", page.toString())
            .addQuery("genre_mode", "and");

        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;

        const type = getFilterValue("type");
        const genres = getFilterValue("genres") as
            | Record<string, "included" | "excluded">
            | undefined;
        const status = getFilterValue("status");
        const languages = getFilterValue("language");
        const year = getFilterValue("year");
        const length = getFilterValue("length");

        if (type && type != "all") {
            searchUrl.addQuery("type[]", type);
        }

        let url = searchUrl.build();

        if (genres && typeof genres === "object") {
            const includedGenres: string[] = [];
            const excludedGenres: string[] = [];

            Object.entries(genres).forEach(([id, value]) => {
                if (value === "included") {
                    includedGenres.push(id);
                    url += `&genre[]=${id}`;
                } else if (value === "excluded") {
                    const excludedId = `-${id}`;
                    excludedGenres.push(excludedId);
                    url += `&genre[]=${excludedId}`;
                }
            });
        }

        if (status && status !== "all" && typeof status === "string") {
            url += `&status[]=${status}`;
        }

        if (languages && languages !== "all" && typeof languages === "string") {
            url += `&language[]=${languages}`;
        }

        if (year && year !== "all" && typeof year === "string") {
            url += `&year[]=${year}`;
        }

        if (length && length !== "all" && typeof length === "string") {
            url += `&length[]=${length}`;
        }

        if (sortingOption) {
            url += `&sort=${sortingOption.id}`;
        }

        const request = { url, method: "GET" };

        const $ = await this.fetchCheerio(request);
        const searchResults: SearchResultItem[] = [];

        $(".original.card-lg .unit .inner").each((_, element) => {
            const unit = $(element);
            const infoLink = unit.find(".info > a");
            const title = infoLink.text().trim();
            const image = unit.find("img").attr("src") || "";
            const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";
            const latestChapter = unit
                .find(".content[data-name='chap'] a")
                .first()
                .find("span")
                .first()
                .text()
                .trim();
            const latestChapterMatch = latestChapter.match(/Chap (\d+)/);
            const subtitle = latestChapterMatch
                ? `Ch. ${latestChapterMatch[1]}`
                : undefined;

            if (!title || !mangaId) {
                return;
            }

            searchResults.push({
                mangaId: mangaId,
                imageUrl: image,
                title: title,
                subtitle: subtitle,
                metadata: undefined,
            });
        });

        const hasNextPage = !!$(".page-item.active + .page-item .page-link")
            .length;

        return {
            items: searchResults,
            metadata: hasNextPage ? { page: page + 1 } : undefined,
        };
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request = {
            url: new URLBuilder(baseUrl)
                .addPath("manga")
                .addPath(mangaId)
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        const title = $(".manga-detail .info h1").text().trim();
        const altTitles = [$(".manga-detail .info h6").text().trim()];
        const image = $(".manga-detail .poster img").attr("src") || "";
        const description =
            $("#synopsis .modal-content").text().trim() ||
            $(".manga-detail .info .description").text().trim();
        const authors: string[] = [];
        $("#info-rating .meta div").each((_, element) => {
            const label = $(element).find("span").first().text().trim();
            if (label === "Author:") {
                $(element)
                    .find("a")
                    .each((_, authorElement) => {
                        authors.push($(authorElement).text().trim());
                    });
            }
        });
        let status = "UNKNOWN";
        let statusText = "Unknown";
        $(".manga-detail .info p").each((_, element) => {
            statusText = $(element).text().trim();
        });

        if (statusText.includes("Releasing")) {
            status = "ONGOING";
        } else if (statusText.includes("Completed")) {
            status = "COMPLETED";
        } else if (
            statusText.includes("hiatus") ||
            statusText.includes("discontinued") ||
            statusText.includes("not yet published") ||
            statusText.includes("completed")
        ) {
            status = statusText.toLocaleUpperCase().replace(/\s+/g, "_");
        }

        const tags: TagSection[] = [];
        const genres: string[] = [];
        let rating = 1;

        $("#info-rating .meta div").each((_, element) => {
            const label = $(element).find("span").first().text().trim();
            if (label === "Genres:") {
                $(element)
                    .find("a")
                    .each((_, genreElement) => {
                        genres.push($(genreElement).text().trim());
                    });
            }
        });

        const ratingValue = $("#info-rating .score .live-score").text().trim();
        if (ratingValue) {
            rating = parseFloat(ratingValue);
        }

        if (genres.length > 0) {
            tags.push({
                id: "genres",
                title: "Genres",
                tags: genres.map((genre) => ({
                    id: genre
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    title: genre,
                })),
            });
        }

        return {
            mangaId: mangaId,
            mangaInfo: {
                primaryTitle: title,
                secondaryTitles: altTitles,
                thumbnailUrl: image,
                synopsis: description,
                rating: rating,
                contentRating: ContentRating.EVERYONE,
                status: status as "ONGOING" | "COMPLETED" | "UNKNOWN",
                tagGroups: tags,
            },
        };
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const mangaId = sourceManga.mangaId.split(".")[1];

        const languages = getLanguages();
        const allRequests = [];

        for (const lang of languages) {
            for (const type of ["read", "manga"]) {
                allRequests.push({
                    url: new URLBuilder(baseUrl)
                        .addPath("ajax")
                        .addPath(type)
                        .addPath(mangaId)
                        .addPath("chapter")
                        .addPath(lang)
                        .build(),
                    method: "GET",
                    language: lang,
                    type: type,
                });
            }
        }

        const responses = await Promise.allSettled(
            allRequests.map((req) =>
                Application.scheduleRequest({
                    url: req.url,
                    method: req.method,
                }).then(([, buffer]) => ({
                    buffer,
                    language: req.language,
                    type: req.type,
                })),
            ),
        );

        const chapters: Chapter[] = [];
        const timestampMaps = new Map<string, Map<string, string>>();

        for (const response of responses) {
            if (
                response.status === "fulfilled" &&
                response.value.type === "manga"
            ) {
                try {
                    const buffer = response.value.buffer;
                    const language = response.value.language;

                    const r2 = JSON.parse(
                        Application.arrayBufferToUTF8String(buffer),
                    ) as MangaFire.Result;

                    const html =
                        typeof r2?.result === "string"
                            ? r2.result
                            : r2?.result?.html || "";

                    if (html) {
                        const $r2 = cheerio.load(html);
                        const timestampMap = new Map<string, string>();

                        $r2("li").each((_, el) => {
                            const li = $r2(el);
                            const chapterNumber = li.attr("data-number") || "0";
                            const dateText = li
                                .find("span")
                                .last()
                                .text()
                                .trim();
                            timestampMap.set(chapterNumber, dateText);
                        });

                        if (timestampMap.size > 0) {
                            timestampMaps.set(language, timestampMap);
                        }
                    }
                } catch (error) {
                    console.error(
                        `Failed to parse buffer for language ${response.value.language}:`,
                        error,
                    );
                }
            }
        }

        for (const response of responses) {
            if (
                response.status === "fulfilled" &&
                response.value.type === "read"
            ) {
                try {
                    const buffer = response.value.buffer;
                    const language = response.value.language;

                    const r1 = JSON.parse(
                        Application.arrayBufferToUTF8String(buffer),
                    ) as MangaFire.Result;

                    if (
                        r1?.result &&
                        typeof r1.result !== "string" &&
                        r1.result.html
                    ) {
                        const $1 = cheerio.load(r1.result.html);
                        const timestampMap = timestampMaps.get(language);

                        $1("li").each((_, el) => {
                            const li = $1(el);
                            const link = li.find("a");
                            const chapterNumber =
                                link.attr("data-number") || "0";
                            const timestamp = timestampMap?.get(chapterNumber);

                            chapters.push({
                                chapterId: link.attr("data-id") || "0",
                                title: link.find("span").first().text().trim(),
                                sourceManga,
                                chapNum: parseFloat(String(chapterNumber)),
                                publishDate: timestamp
                                    ? new Date(convertToISO8601(timestamp))
                                    : undefined,
                                volume: undefined,
                                langCode: getLanguageFlag(language),
                                version: getLanguageVersion(language),
                            });
                        });
                    }
                } catch (error) {
                    console.error(
                        `Failed to parse buffer for language ${response.value.language}:`,
                        error,
                    );
                }
            }
        }

        return chapters;
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        try {
            // Utilizing ajax API
            // Example: https://mangafire.to/ajax/read/chapter/3832635
            const url = new URLBuilder(baseUrl)
                .addPath("ajax")
                .addPath("read")
                .addPath("chapter")
                .addPath(chapter.chapterId)
                .build();

            const request: Request = { url, method: "GET" };

            const [_, buffer] = await Application.scheduleRequest(request);
            const json: MangaFire.PageResponse = JSON.parse(
                Application.arrayBufferToUTF8String(buffer),
            ) as MangaFire.PageResponse;

            const pages: string[] = [];
            json.result.images.forEach((value: MangaFire.ImageData) => {
                pages.push(value[0]);
            });
            return {
                mangaId: chapter.sourceManga.mangaId,
                id: chapter.chapterId,
                pages: pages,
            };
        } catch (error) {
            console.error("Error fetching chapter details:", error);
            throw error;
        }
    }

    getMangaShareUrl(mangaId: string): string {
        return `${baseUrl}/manga/${mangaId}`;
    }

    async getUpdatedSectionItems(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const collectedIds = metadata?.collectedIds ?? [];

        // Example: https://mangafire.to/filter?keyword=&language[]=en&sort=recently_updated&page=1
        const request = {
            url: new URLBuilder(baseUrl)
                .addPath("filter")
                .addQuery("keyword", "")
                .addQuery("language[]", "en")
                .addQuery("sort", "recently_updated")
                .addQuery("page", page.toString())
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const items: DiscoverSectionItem[] = [];

        $(".unit .inner").each((_, element) => {
            const unit = $(element);
            const infoLink = unit.find(".info > a").last();
            const title = infoLink.text().trim();
            const image = unit.find(".poster img").attr("src") || "";
            const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";
            const latest_chapter = unit
                .find(".content[data-name='chap']")
                .find("a")
                .eq(0)
                .text()
                .trim();
            const latestChapterMatch = latest_chapter.match(/Chap (\d+)/);
            const subtitle = latestChapterMatch
                ? `Ch. ${latestChapterMatch[1]}`
                : undefined;

            const chapterLink = unit
                .find(".content[data-name='chap'] a")
                .first();
            const chapterId = chapterLink.attr("href")?.split("/").pop() || "";

            if (title && mangaId && !collectedIds.includes(mangaId)) {
                collectedIds.push(mangaId);
                items.push({
                    type: "chapterUpdatesCarouselItem",
                    mangaId: mangaId,
                    chapterId: chapterId,
                    imageUrl: image,
                    title: title,
                    subtitle: subtitle,
                    metadata: undefined,
                });
            }
        });

        const hasNextPage = !!$(".page-item.active + .page-item .page-link")
            .length;

        return {
            items: items,
            metadata: hasNextPage
                ? { page: page + 1, collectedIds }
                : undefined,
        };
    }

    async getPopularSectionItems(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const collectedIds = metadata?.collectedIds ?? [];

        const request = {
            url: new URLBuilder(baseUrl)
                .addPath("filter")
                .addQuery("keyword", "")
                .addQuery("language[]", "en")
                .addQuery("sort", "most_viewed")
                .addQuery("page", page.toString())
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const items: DiscoverSectionItem[] = [];

        $(".unit .inner").each((_, element) => {
            const unit = $(element);
            const infoLink = unit.find(".info > a").last();
            const title = infoLink.text().trim();
            const image = unit.find(".poster img").attr("src") || "";
            const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";

            const latestChapter = unit
                .find(".content[data-name='chap'] a")
                .filter((_, el) => $(el).find("b").text() === "EN")
                .first()
                .find("span")
                .first()
                .text()
                .trim();

            const chapterMatch = latestChapter.match(/Chap (\d+)/);
            const supertitle = chapterMatch ? `Ch. ${chapterMatch[1]}` : "";

            if (title && mangaId && !collectedIds.includes(mangaId)) {
                collectedIds.push(mangaId);
                items.push({
                    type: "featuredCarouselItem",
                    mangaId: mangaId,
                    imageUrl: image,
                    title: title,
                    supertitle: supertitle,
                    metadata: undefined,
                });
            }
        });

        const hasNextPage = !!$(".hpage .r").length;

        return {
            items: items,
            metadata: hasNextPage
                ? { page: page + 1, collectedIds }
                : undefined,
        };
    }

    async getNewMangaSectionItems(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const collectedIds = metadata?.collectedIds ?? [];

        const request = {
            url: new URLBuilder(baseUrl).addPath("added").build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const items: DiscoverSectionItem[] = [];

        $(".unit .inner").each((_, element) => {
            const unit = $(element);
            const infoLink = unit.find(".info > a").last();
            const title = infoLink.text().trim();
            const image = unit.find(".poster img").attr("src") || "";
            const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";

            const latestChapter = unit
                .find(".content[data-name='chap'] a")
                .first()
                .find("span")
                .first()
                .text()
                .trim();
            const latestChapterMatch = latestChapter.match(/Chap (\d+)/);
            const subtitle = latestChapterMatch
                ? `Ch. ${latestChapterMatch[1]}`
                : undefined;

            if (title && mangaId && !collectedIds.includes(mangaId)) {
                collectedIds.push(mangaId);
                items.push(
                    createDiscoverSectionItem({
                        id: mangaId,
                        image: image,
                        title: title,
                        subtitle: subtitle,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        const hasNextPage = !!$(".page-item.active + .page-item .page-link")
            .length;

        return {
            items: items,
            metadata: hasNextPage
                ? { page: page + 1, collectedIds }
                : undefined,
        };
    }

    async getTypesSection(): Promise<PagedResults<DiscoverSectionItem>> {
        const searchDetails = await this.getSearchDetails();
        const types = searchDetails?.types || [];

        return {
            items: types.map((type) => ({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [
                        {
                            id: type.id,
                            value: type.label,
                        },
                    ],
                },
                name: type.label,
                metadata: undefined,
            })),
            metadata: undefined,
        };
    }

    async getFilterSection(): Promise<PagedResults<DiscoverSectionItem>> {
        const items = [
            { id: "manhua", name: "Manhua", type: "type" },
            { id: "manhwa", name: "Manhwa", type: "type" },
            { id: "manga", name: "Manga", type: "type" },
            { id: "1", name: "Action", type: "genres" },
            { id: "78", name: "Adventure", type: "genres" },
            { id: "3", name: "Avant Garde", type: "genres" },
            { id: "4", name: "Boys Love", type: "genres" },
            { id: "5", name: "Comedy", type: "genres" },
            { id: "77", name: "Demons", type: "genres" },
            { id: "6", name: "Drama", type: "genres" },
            { id: "7", name: "Ecchi", type: "genres" },
            { id: "79", name: "Fantasy", type: "genres" },
            { id: "9", name: "Girls Love", type: "genres" },
            { id: "10", name: "Gourmet", type: "genres" },
            { id: "11", name: "Harem", type: "genres" },
            { id: "530", name: "Horror", type: "genres" },
            { id: "13", name: "Isekai", type: "genres" },
            { id: "531", name: "Iyashikei", type: "genres" },
            { id: "15", name: "Josei", type: "genres" },
            { id: "532", name: "Kids", type: "genres" },
            { id: "539", name: "Magic", type: "genres" },
            { id: "533", name: "Mahou Shoujo", type: "genres" },
            { id: "534", name: "Martial Arts", type: "genres" },
            { id: "19", name: "Mecha", type: "genres" },
            { id: "535", name: "Military", type: "genres" },
            { id: "21", name: "Music", type: "genres" },
            { id: "22", name: "Mystery", type: "genres" },
            { id: "23", name: "Parody", type: "genres" },
            { id: "536", name: "Psychological", type: "genres" },
            { id: "25", name: "Reverse Harem", type: "genres" },
            { id: "26", name: "Romance", type: "genres" },
            { id: "73", name: "School", type: "genres" },
            { id: "28", name: "Sci-Fi", type: "genres" },
            { id: "537", name: "Seinen", type: "genres" },
            { id: "30", name: "Shoujo", type: "genres" },
            { id: "31", name: "Shounen", type: "genres" },
            { id: "538", name: "Slice of Life", type: "genres" },
            { id: "33", name: "Space", type: "genres" },
            { id: "34", name: "Sports", type: "genres" },
            { id: "75", name: "Super Power", type: "genres" },
            { id: "76", name: "Supernatural", type: "genres" },
            { id: "37", name: "Suspense", type: "genres" },
            { id: "38", name: "Thriller", type: "genres" },
            { id: "39", name: "Vampire", type: "genres" },
        ];

        return {
            items: items.map((item) => ({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [
                        {
                            id: item.type,
                            value:
                                item.type === "genres"
                                    ? { [item.id]: "included" }
                                    : item.id,
                        },
                    ],
                },
                name: item.name,
                metadata: undefined,
            })),
            metadata: undefined,
        };
    }

    async getLanguagesSection(): Promise<PagedResults<DiscoverSectionItem>> {
        const searchDetails = await this.getSearchDetails();
        const languages = searchDetails?.languages || [];

        return {
            items: languages.map((lang) => ({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [
                        {
                            id: lang.id,
                            value: lang.label,
                        },
                    ],
                },
                name: `${getLanguageFlag(lang.id)} ${lang.label}`,
                metadata: undefined,
            })),
            metadata: undefined,
        };
    }

    checkCloudflareStatus(status: number): void {
        if (status == 503 || status == 403) {
            throw new CloudflareError({ url: baseUrl, method: "GET" });
        }
    }

    async fetchCheerio(request: Request): Promise<CheerioAPI> {
        const [response, data] = await Application.scheduleRequest(request);
        this.checkCloudflareStatus(response.status);
        const htmlStr = Application.arrayBufferToUTF8String(data);
        const dom = htmlparser2.parseDocument(htmlStr);
        return cheerio.load(dom);
    }
}

function createDiscoverSectionItem(options: {
    id: string;
    image: string;
    title: string;
    subtitle?: string;
    type: "simpleCarouselItem";
}): DiscoverSectionItem {
    return {
        type: options.type,
        mangaId: options.id,
        imageUrl: options.image,
        title: options.title,
        subtitle: options.subtitle,
        metadata: undefined,
    };
}

function convertToISO8601(dateText: string): string {
    const now = new Date();

    if (!dateText?.trim()) return now.toISOString();

    if (/^yesterday$/i.test(dateText)) {
        now.setDate(now.getDate() - 1);
        return now.toISOString();
    }

    const relativeMatch = dateText.match(
        /(\d+)\s+(second|minute|hour|day)s?\s+ago/i,
    );
    if (relativeMatch) {
        const [_, value, unit] = relativeMatch;
        switch (unit.toLowerCase()) {
            case "second":
                now.setSeconds(now.getSeconds() - +value);
                break;
            case "minute":
                now.setMinutes(now.getMinutes() - +value);
                break;
            case "hour":
                now.setHours(now.getHours() - +value);
                break;
            case "day":
                now.setDate(now.getDate() - +value);
                break;
        }
        return now.toISOString();
    }

    const parsedDate = new Date(dateText);
    return isNaN(parsedDate.getTime())
        ? now.toISOString()
        : parsedDate.toISOString();
}

function getLanguageFlag(language: string): string {
    switch (language) {
        case "en":
            return "🇬🇧";
        case "fr":
            return "🇫🇷";
        case "es":
            return "🇪🇸";
        case "es-la":
            return "🇲🇽";
        case "pt":
            return "🇵🇹";
        case "pt-br":
            return "🇧🇷";
        case "ja":
            return "🇯🇵";
        default:
            return "🇬🇧";
    }
}

function getLanguageVersion(language: string): string {
    switch (language) {
        case "en":
            return "EN";
        case "fr":
            return "FR";
        case "es":
            return "ES";
        case "es-la":
            return "ESLA";
        case "pt":
            return "PT";
        case "pt-br":
            return "PTBR";
        case "ja":
            return "JP";
        default:
            return "EN";
    }
}

export const MangaFire = new MangaFireExtension();
