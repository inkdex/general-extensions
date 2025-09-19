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
import { URLBuilder } from "../utils/url-builder/base";
import {
    getBlacklistDemographics,
    getBlacklistGenres,
    getEnableChapterFiltering,
    getWhitelistDemographics,
    getWhitelistGenres,
    SettingsForm,
} from "./forms";
import { Interceptor } from "./interceptors";
import { metadata, SearchDetails, STATIC_SEARCH_DETAILS } from "./model";

const baseUrl = "https://mangapark.io/";

type MangaparkImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    SettingsFormProviding &
    DiscoverSectionProviding;

export class MangaparkExtension implements MangaparkImplementation {
    requestManager = new Interceptor("main");
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
                id: "popular_updates_section",
                title: "Popular Updates",
                type: DiscoverSectionType.featured,
            },
            {
                id: "latest_releases_section",
                title: "Latest Releases",
                type: DiscoverSectionType.chapterUpdates,
            },
            {
                id: "new_releases_section",
                title: "New Releases",
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    async getSettingsForm(): Promise<Form> {
        return new SettingsForm();
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        switch (section.id) {
            case "popular_updates_section":
                return this.getPopularSectionItems(section, metadata);
            case "latest_releases_section":
                return this.getUpdatedSectionItems(section, metadata);
            case "new_releases_section":
                return this.getNewMangaSectionItems(section, metadata);
            default:
                return { items: [] };
        }
    }

    private async getSearchDetails(): Promise<SearchDetails | undefined> {
        // Return static search details to avoid network requests
        return STATIC_SEARCH_DETAILS;
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

        const blacklistedGenres = getBlacklistGenres();
        const whitelistedGenres = getWhitelistGenres();
        const genreValue: Record<string, "included" | "excluded"> = {};
        for (const genreId of blacklistedGenres) {
            genreValue[genreId] = "excluded";
        }
        for (const genreId of whitelistedGenres) {
            genreValue[genreId] = "included";
        }

        filters.push({
            id: "genres",
            type: "multiselect",
            options:
                searchDetails?.genres?.map((g) => ({
                    id: g.id,
                    value: g.label,
                })) || [],
            allowExclusion: true,
            value: genreValue,
            title: "Genre Filter",
            allowEmptySelection: false,
            maximum: undefined,
        });

        const blacklistedDemographics = getBlacklistDemographics();
        const whitelistedDemographics = getWhitelistDemographics();
        const demographicValue: Record<string, "included" | "excluded"> = {};
        for (const demoId of blacklistedDemographics) {
            demographicValue[demoId] = "excluded";
        }
        for (const demoId of whitelistedDemographics) {
            demographicValue[demoId] = "included";
        }

        filters.push({
            id: "contentRating",
            type: "multiselect",
            options:
                searchDetails?.contentRating?.map((c) => ({
                    id: c.id,
                    value: c.label,
                })) || [],
            allowExclusion: true,
            value: {},
            title: "Content Rating",
            allowEmptySelection: true,
            maximum: undefined,
        });

        filters.push({
            id: "demographics",
            type: "multiselect",
            options:
                searchDetails?.demographics?.map((d) => ({
                    id: d.id,
                    value: d.label,
                })) || [],
            allowExclusion: true,
            value: demographicValue,
            title: "Demographic Filter",
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

    async getSortingOptions(): Promise<SortingOption[]> {
        const searchDetails = await this.getSearchDetails();

        if (!searchDetails || !searchDetails.sorts) {
            return [];
        }

        return searchDetails.sorts.map((sort) => ({
            id: sort.id,
            label: sort.label,
        }));
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: metadata | undefined,
        sortingOption?: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;
        const collectedIds = metadata?.searchCollectedIds ?? [];

        // Mangapark search URL format:
        // https://mangapark.io/search?genres=manga,shounen,ecchi,action|loli,reverse_harem,sm_bdsm&status=ongoing&chapters=1&sortby=field_score&page=1
        const searchUrl = new URLBuilder(baseUrl)
            .addPath("search")
            .addQuery("page", page.toString());

        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;

        const type = getFilterValue("type");
        const genres = getFilterValue("genres") as
            | Record<string, "included" | "excluded">
            | undefined;
        const contentRating = getFilterValue("contentRating") as
            | Record<string, "included">
            | undefined;
        const demographics = getFilterValue("demographics") as
            | Record<string, "included" | "excluded">
            | undefined;
        const status = getFilterValue("status");
        const languages = getFilterValue("language");
        const year = getFilterValue("year");
        const length = getFilterValue("length");

        // Aggregate included/excluded tokens across genres, demographics, contentRating, and type
        const includedTokens: string[] = [];
        const excludedTokens: string[] = [];

        const addRecord = (rec?: Record<string, "included" | "excluded">) => {
            if (!rec) return;
            for (const [id, v] of Object.entries(rec)) {
                if (v === "included") includedTokens.push(id);
                else if (v === "excluded") excludedTokens.push(id);
            }
        };

        addRecord(genres);
        addRecord(demographics);
        addRecord(contentRating);

        // Handle type (manga, manhua, manhwa) - always treated as included when selected
        if (type && type !== "all" && typeof type === "string") {
            includedTokens.push(type);
        }

        // Build genres param with %7C as separator between included and excluded
        let genresParam = "";
        const includedStr = includedTokens.join(",");
        const excludedStr = excludedTokens.join(",");
        if (includedTokens.length > 0 && excludedTokens.length > 0) {
            genresParam = `${includedStr}%7C${excludedStr}`;
        } else if (includedTokens.length > 0) {
            genresParam = includedStr;
        } else if (excludedTokens.length > 0) {
            genresParam = `%7C${excludedStr}`;
        }

        // Add genres parameter if we have any
        if (genresParam) {
            searchUrl.addQuery("genres", genresParam);
        }

        // Handle status
        if (status && status !== "all" && typeof status === "string") {
            searchUrl.addQuery("status", status);
        }

        // Handle language
        if (languages && languages !== "all" && typeof languages === "string") {
            searchUrl.addQuery("language", languages);
        }

        // Handle year
        if (year && year !== "all" && typeof year === "string") {
            searchUrl.addQuery("year", year);
        }

        // Handle chapters (length)
        if (length && length !== "all" && typeof length === "string") {
            searchUrl.addQuery("chapters", length);
        }

        // Handle sorting
        if (sortingOption) {
            searchUrl.addQuery("sortby", sortingOption.id);
        }

        // Add keyword if present
        if (query.title && query.title.trim()) {
            searchUrl.addQuery("word", query.title.trim());
        }

        searchUrl.addQuery("lang", "en");

        const url = searchUrl.build();
        const request = { url, method: "GET" };

        const $ = await this.fetchCheerio(request);
        const searchResults: SearchResultItem[] = [];

        $(".flex.border-b.border-b-base-200.pb-5").each((_, element) => {
            const unit = $(element);
            const titleLink = unit.find("h3 a");
            const title = titleLink.find("span").text().trim();
            const imageSrc = unit.find("img").attr("src") || "";
            const image = imageSrc.startsWith("http")
                ? imageSrc
                : `${baseUrl}${imageSrc}`;
            const mangaId =
                titleLink.attr("href")?.replace("/title/", "") || "";
            const chapterLink = unit.find(
                ".flex.flex-nowrap.justify-between a",
            );
            const latestChapter = chapterLink.find("span").text().trim();
            const latestChapterMatch = latestChapter.match(/Chapter (\d+)/);
            const subtitle = latestChapterMatch
                ? `Ch. ${latestChapterMatch[1]}`
                : undefined;
            const chapterId = chapterLink.attr("href")?.split("/").pop() || "";

            if (!title || !mangaId || collectedIds.includes(mangaId)) {
                return;
            }

            collectedIds.push(mangaId);

            searchResults.push({
                mangaId: mangaId,
                imageUrl: image,
                title: title,
                subtitle: subtitle,
                metadata: { chapterId }, // Store chapterId in metadata
            });
        });

        const hasNextPage = !!$(".btn-accent").next("a").length;

        return {
            items: searchResults,
            metadata: hasNextPage
                ? { page: page + 1, searchCollectedIds: collectedIds }
                : undefined,
        };
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request = {
            url: new URLBuilder(baseUrl)
                .addPath("title")
                .addPath(mangaId)
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        const title = $("h3 a").first().text().trim();
        const altTitles = [$("div[q\\:key='tz_2'] span").first().text().trim()];
        const imageElem = $("img[alt]").first();
        let image = imageElem.attr("src") || imageElem.attr("data-src") || "";
        if (image && !image.startsWith("http")) {
            // normalize to absolute URL
            image = image.startsWith("/")
                ? `${baseUrl}${image.slice(1)}`
                : `${baseUrl}${image}`;
        }
        const description =
            $(".limit-html").first().text().trim() ||
            $(".manga-detail .info .description").text().trim();
        const authors: string[] = [];
        $("div[q\\:key='tz_4'] a").each((_, authorElement) => {
            authors.push($(authorElement).text().trim());
        });
        let status = "UNKNOWN";
        let statusText = "";
        $("div[q\\:key='Yn_8'] span")
            .last()
            .each((_, element) => {
                statusText = $(element).text().trim();
            });

        if (statusText.includes("Ongoing")) {
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

        // Parse genres from the flex items-center flex-wrap div
        $("div[q\\:key='30_2'] span").each((_, element) => {
            const genreText = $(element).find("span").text().trim();
            if (
                genreText &&
                !genreText.includes(",") &&
                genreText !== "Manga"
            ) {
                genres.push(genreText);
            }
        });

        // Try to get rating from the star rating section
        const ratingText = $(".text-sm.opacity-80.whitespace-nowrap")
            .first()
            .text()
            .trim();
        const ratingMatch = ratingText.match(/(\d+(?:\.\d+)?)/);
        if (ratingMatch) {
            rating = parseFloat(ratingMatch[1]);
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
        // The mangaId from search is already like 26964-en-triage-x
        const mangaId = sourceManga.mangaId;
        const request = {
            url: new URLBuilder(baseUrl)
                .addPath("title")
                .addPath(mangaId)
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        type ChapterCandidate = Chapter & {
            groupName?: string;
            groupViews?: number;
        };
        const candidates: ChapterCandidate[] = [];
        const groupViewsAggregate: Map<string, number> = new Map();

        $(".px-2.py-2.flex.flex-wrap.justify-between").each((_, element) => {
            const row = $(element);
            const chapterElement = row.find("a").first();
            const href = chapterElement.attr("href") || "";

            const lastSegment = href.split("/").filter(Boolean).pop() || "";
            const chapterId = lastSegment.split(/[?#]/)[0];

            const title = chapterElement.text().trim();
            // Remove any Volume prefix like "Vol.02" before extracting chapter
            const cleanedTitle = title
                .replace(/Vol\.?\s*\d+(?:\.\d+)?/gi, "")
                .trim();
            let chapNum = 0;
            const match = cleanedTitle.match(
                /(?:Ch(?:apter)?[.\s-]*(\d+(?:\.\d+)?))/i,
            );
            if (match) {
                chapNum = parseFloat(match[1]);
            } else {
                // Fallback: try extracting from href like /.../ch-020 or /.../chapter-020
                const hrefLower = href.toLowerCase();
                const hrefMatch = hrefLower.match(
                    /\/(?:ch|chapter)[-_]?(\d+(?:\.\d+)?)(?:\b|\/|$)/i,
                );
                if (hrefMatch) {
                    chapNum = parseFloat(hrefMatch[1]);
                }
            }

            const timeElement = row.find("time").first();
            const timestamp = timeElement.attr("data-time");
            const publishDate = timestamp
                ? new Date(parseInt(timestamp))
                : undefined;

            // Parse group/version name and views from the right-side metadata
            const meta = row
                .find(
                    ".ml-auto.inline-flex.flex-wrap.justify-end.items-center.text-sm.opacity-70.space-x-2",
                )
                .first();
            let groupName = meta
                .find(".inline-flex.items-center.space-x-1 span")
                .first()
                .text()
                .trim();
            if (!groupName) groupName = "Unknown";

            let viewsForThisChapter = 0;
            meta.find(".inline-flex.items-center")
                .filter((_, el) => $(el).find("i[name='eye']").length > 0)
                .each((_, el) => {
                    const txt = $(el).find("span.ml-1").first().text().trim();
                    if (txt.includes("+")) {
                        for (const part of txt.split("+")) {
                            const n = parseInt(part.replace(/[^\d]/g, ""), 10);
                            if (!isNaN(n)) viewsForThisChapter += n;
                        }
                    } else {
                        const n = parseInt(txt.replace(/[^\d]/g, ""), 10);
                        if (!isNaN(n)) viewsForThisChapter += n;
                    }
                });

            groupViewsAggregate.set(
                groupName,
                (groupViewsAggregate.get(groupName) ?? 0) +
                    (viewsForThisChapter || 0),
            );

            candidates.push({
                chapterId,
                sourceManga,
                title,
                volume: 0,
                chapNum,
                publishDate,
                langCode: "🇬🇧", // English by default on this page
                version: groupName,
                groupName,
                groupViews: viewsForThisChapter,
            });
        });

        const enableFiltering = getEnableChapterFiltering();
        if (!enableFiltering) {
            return candidates;
        }

        // Establish group priority by total views (desc)
        const groupOrder = Array.from(groupViewsAggregate.entries())
            .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
            .map(([name]) => name);

        // Group by chapter number
        const byChapter: Map<string, ChapterCandidate[]> = new Map();
        for (const c of candidates) {
            const key = String(c.chapNum ?? 0);
            const list = byChapter.get(key) ?? [];
            list.push(c);
            byChapter.set(key, list);
        }

        const finalChapters: Chapter[] = [];
        for (const [, list] of byChapter) {
            let chosen: ChapterCandidate | undefined;
            for (const g of groupOrder) {
                chosen = list.find((c) => c.groupName === g);
                if (chosen) break;
            }
            if (!chosen) chosen = list[0];
            finalChapters.push(chosen);
        }

        // finalChapters.sort((a, b) => (b.chapNum ?? 0) - (a.chapNum ?? 0));
        return finalChapters;
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const request = {
            url: new URLBuilder(baseUrl)
                .addPath("title")
                .addPath(chapter.sourceManga.mangaId)
                .addPath(chapter.chapterId)
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const pages: string[] = [];

        $('script[type="qwik/json"]').each((_, script) => {
            const scriptContent = $(script).text();
            if (scriptContent) {
                const urlRegex =
                    /https?:\/\/[^"'()\s]*\.org\/media\/[^\s"'()]+/g;
                const matches = scriptContent.match(urlRegex);
                if (matches) {
                    pages.push(...matches);
                }
            }
        });

        return {
            id: chapter.chapterId,
            mangaId: chapter.sourceManga.mangaId,
            pages,
        };
    }

    getMangaShareUrl(mangaId: string): string {
        return `${baseUrl}/manga/${mangaId}`;
    }

    async getUpdatedSectionItems(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        // Use getSearchResults with New Chapters sort
        const searchQuery: SearchQuery = {
            title: "",
            filters: [],
        };

        const sortingOption: SortingOption = {
            id: "field_update",
            label: "New Chapters",
        };

        const searchResults = await this.getSearchResults(
            searchQuery,
            metadata,
            sortingOption,
        );

        // Convert SearchResultItem[] to DiscoverSectionItem[]
        const items: DiscoverSectionItem[] = searchResults.items.map(
            (item) => ({
                type: "chapterUpdatesCarouselItem",
                mangaId: item.mangaId,
                chapterId:
                    (item.metadata as { chapterId?: string })?.chapterId || "",
                imageUrl: item.imageUrl,
                title: item.title,
                subtitle: item.subtitle,
                metadata: undefined,
            }),
        );

        return {
            items,
            metadata: searchResults.metadata,
        };
    }

    async getPopularSectionItems(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const collectedIds = metadata?.collectedIds ?? [];

        const request = {
            url: baseUrl,
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const items: DiscoverSectionItem[] = [];

        // Updated selectors based on current Mangapark HTML structure
        $(".relative.w-full.group").each((_, element) => {
            const unit = $(element);
            const titleLink = unit
                .find("div.absolute a.link.link-hover.text-sm")
                .first();
            const title = titleLink.text().trim();
            const imageSrc = unit.find("a.block.w-full img").attr("src") || "";
            const image = imageSrc.startsWith("http")
                ? imageSrc
                : imageSrc.startsWith("/")
                  ? `${baseUrl}${imageSrc.slice(1)}`
                  : `${baseUrl}${imageSrc}`;
            const mangaId =
                titleLink.attr("href")?.replace("/title/", "") || "";

            const chapterLink = unit
                .find(
                    "div.absolute span.line-clamp-1 a.link.link-hover.text-xs",
                )
                .first();
            const latestChapter = chapterLink.text().trim();
            const latestChapterMatch = latestChapter.match(/Chapter (\d+)/);
            const supertitle = latestChapterMatch
                ? `Ch. ${latestChapterMatch[1]}`
                : undefined;

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

        const hasNextPage = !!$(".btn-accent").next("a").length;

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
        // Use getSearchResults with Recently Created sort
        const searchQuery: SearchQuery = {
            title: "",
            filters: [],
        };

        const sortingOption: SortingOption = {
            id: "field_create",
            label: "Recently Created",
        };

        const searchResults = await this.getSearchResults(
            searchQuery,
            metadata,
            sortingOption,
        );

        // Convert SearchResultItem[] to DiscoverSectionItem[]
        const items: DiscoverSectionItem[] = searchResults.items.map(
            (item) => ({
                type: "simpleCarouselItem",
                mangaId: item.mangaId,
                imageUrl: item.imageUrl,
                title: item.title,
                subtitle: item.subtitle,
                metadata: undefined,
            }),
        );

        return {
            items,
            metadata: searchResults.metadata,
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
                name: `${lang.label}`,
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

export const Mangapark = new MangaparkExtension();
