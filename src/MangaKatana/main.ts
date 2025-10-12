import {
    BasicRateLimiter,
    ContentRating,
    DiscoverSectionType,
    PaperbackInterceptor,
    type Chapter,
    type ChapterDetails,
    type ChapterProviding,
    type DiscoverSection,
    type DiscoverSectionItem,
    type DiscoverSectionProviding,
    type Extension,
    type MangaProviding,
    type PagedResults,
    type Request,
    type Response,
    type SearchFilter,
    type SearchQuery,
    type SearchResultItem,
    type SearchResultsProviding,
    type SourceManga,
    type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { type CheerioAPI } from "cheerio";
import { URLBuilder } from "../utils/url-builder/base";
import { genreOptions } from "./genreOptions";
import { genres } from "./genres";
import { isLastPage, parseSearch, parseTags } from "./MangaKatanaParser";

const DOMAIN_NAME = "https://mangakatana.com/";

// Define CloudflareError class for handling Cloudflare protection
class CloudflareError extends Error {
    constructor(request: { url: string; method: string }) {
        super("Cloudflare protection detected");
        this.name = "CloudflareError";
        this.request = request;
    }

    request: { url: string; method: string };
}

// Should match the capabilities which you defined in pbconfig.ts
type MangaKatanaImplementation = Extension &
    DiscoverSectionProviding &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;

// Intercepts all the requests and responses and allows you to make changes to them
class MangaKatanaInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...request.headers,
            referer: DOMAIN_NAME,
            origin: DOMAIN_NAME,
            "user-agent": await Application.getDefaultUserAgent(),
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

// Main extension class
export class MangaKatanaExtension implements MangaKatanaImplementation {
    // Implementation of the main rate limiter
    mainRateLimiter = new BasicRateLimiter("main", {
        numberOfRequests: 15,
        bufferInterval: 10,
        ignoreImages: true,
    });

    // Implementation of the main interceptor
    mangaKatanaInterceptor = new MangaKatanaInterceptor("main");

    // Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mangaKatanaInterceptor.registerInterceptor();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        const get_Hot_Updates_Section: DiscoverSection = {
            id: "hot-updates",
            title: "Hot Updates",
            type: DiscoverSectionType.featured,
        };

        const get_Latest_Updates_Section: DiscoverSection = {
            id: "latest-updates",
            title: "Latest Updates",
            type: DiscoverSectionType.simpleCarousel,
        };

        const get_New_Manga_Section: DiscoverSection = {
            id: "new-manga",
            title: "New Manga",
            type: DiscoverSectionType.simpleCarousel,
        };

        const get_Genres_Section: DiscoverSection = {
            id: "genres",
            title: "Genres",
            type: DiscoverSectionType.genres,
        };

        return [
            get_Hot_Updates_Section,
            get_Latest_Updates_Section,
            get_New_Manga_Section,
            get_Genres_Section,
        ];
    }

    // Populates both the discover sections
    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Katana.Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        switch (section.id) {
            case "hot-updates":
                return this.getHotUpdatesSectionItems();
            case "latest-updates":
                return this.getLatestUpdatesSectionItems(section, metadata);
            case "new-manga":
                return this.getNewMangaSectionItems(section, metadata);
            case "genres":
                return this.getGenresSectionItems();
            default:
                return { items: [] };
        }
    }

    // Populates the hot updates section
    async getHotUpdatesSectionItems(): Promise<
        PagedResults<DiscoverSectionItem>
    > {
        const request = {
            url: new URLBuilder(DOMAIN_NAME).build(),
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);

        const items: DiscoverSectionItem[] = [];

        // Extract Hot Updates from the #hot_update section
        $("#hot_update .item").each((_, element) => {
            const unit = $(element);
            const titleLink = unit.find("h3.title a").first();
            const title = titleLink.text().trim();
            const href = titleLink.attr("href") || "";

            let mangaId = href.split("/").pop() || "";
            mangaId = decodeURIComponent(mangaId)
                .replace(/[^\w@.]/g, "_")
                .trim();

            const image = unit.find(".wrap_img img").attr("src") || "";
            const chapter = unit.find(".chapter a").first().text().trim();

            if (mangaId && title && image) {
                items.push(
                    createDiscoverSectionItem({
                        id: mangaId,
                        image: image,
                        title: title,
                        subtitle: chapter,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        // No pagination available, so no next page
        return {
            items: items,
            metadata: undefined,
        };
    }

    async getLatestUpdatesSectionItems(
        section: DiscoverSection,
        metadata: Katana.Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = (metadata as { page?: number } | undefined)?.page ?? 1;
        const collectedIds = metadata?.collectedIds ?? [];

        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("page")
                .addPath(page.toString())
                .build(),
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);

        const items: DiscoverSectionItem[] = [];

        $("#book_list .item").each((_, element) => {
            const unit = $(element);
            const titleLink = unit.find("h3.title a").first();
            const title = titleLink.text().trim();
            const href = titleLink.attr("href") || "";

            let mangaId = href.split("/").pop() || "";
            mangaId = decodeURIComponent(mangaId)
                .replace(/[^\w@.]/g, "_")
                .trim();

            const image = unit.find(".wrap_img img").attr("src") || "";

            // Extract latest chapter info
            const chapters = unit.find(".chapters .chapter a");
            const latestChapter = chapters.first().text().trim();
            const subtitleSpan = unit
                .find("h3.title span")
                .text()
                .trim()
                .replace(/^-\s*/, "");
            const subtitle = latestChapter || subtitleSpan;

            if (mangaId && title && image && !collectedIds.includes(mangaId)) {
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

        // Check for next page
        const nextPageHref = $("a.next.page-numbers").attr("href");
        let nextPage: number | undefined;
        if (nextPageHref) {
            const pageMatch = nextPageHref.match(/\/page\/(\d+)/);
            if (pageMatch) {
                nextPage = parseInt(pageMatch[1], 10);
            } else {
                nextPage = page + 1;
            }
        }

        return {
            items: items,
            metadata: nextPage ? { page: nextPage, collectedIds } : undefined,
        };
    }

    // Populates the new manga section
    async getNewMangaSectionItems(
        section: DiscoverSection,
        metadata: Katana.Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = (metadata as { page?: number } | undefined)?.page ?? 1;
        const collectedIds = metadata?.collectedIds ?? [];

        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("new-manga")
                .addPath("page")
                .addPath(page.toString())
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const items: DiscoverSectionItem[] = [];

        $("#book_list .item").each((_, element) => {
            const unit = $(element);
            const titleLink = unit.find("h3.title a").first();
            const title = titleLink.text().trim();
            const href = titleLink.attr("href") || "";

            let mangaId = href.split("/").pop() || "";
            mangaId = decodeURIComponent(mangaId)
                .replace(/[^\w@.]/g, "_")
                .trim();

            const image = unit.find(".wrap_img img").attr("src") || "";

            // Extract latest chapter info
            const chapters = unit.find(".chapters .chapter a");
            const latestChapter = chapters.first().text().trim();
            const subtitleSpan = unit
                .find("h3.title span")
                .text()
                .trim()
                .replace(/^-\s*/, "");
            const subtitle = latestChapter || subtitleSpan;

            if (mangaId && title && image && !collectedIds.includes(mangaId)) {
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

        // Check for next page
        const nextPageHref = $("a.next.page-numbers").attr("href");
        let nextPage: number | undefined;
        if (nextPageHref) {
            const pageMatch = nextPageHref.match(/\/page\/(\d+)/);
            if (pageMatch) {
                nextPage = parseInt(pageMatch[1], 10);
            } else {
                nextPage = page + 1;
            }
        }

        return {
            items: items,
            metadata: nextPage ? { page: nextPage, collectedIds } : undefined,
        };
    }

    // Populates the genres section
    async getGenresSectionItems(): Promise<PagedResults<DiscoverSectionItem>> {
        // We are using genres array from the imported file here
        return {
            items: genres.map((genre) => ({
                type: "genresCarouselItem",
                searchQuery: {
                    title: "",
                    filters: [
                        { id: "genres", value: { [genre.id]: "included" } },
                    ],
                },
                name: genre.name,
                // No need to pass metadata for genres as it's a static list
                metadata: undefined,
            })),
        };
    }

    async getCloudflareBypassRequestAsync(): Promise<Request> {
        return {
            url: `${DOMAIN_NAME}/`,
            method: "GET",
            headers: {
                referer: `${DOMAIN_NAME}/`,
                origin: `${DOMAIN_NAME}/`,
                "user-agent": await Application.getDefaultUserAgent(),
            },
        };
    }

    async fetchCheerio(request: Request): Promise<CheerioAPI> {
        const [response, data] = await Application.scheduleRequest(request);
        this.checkCloudflareStatus(response.status);
        return cheerio.load(Application.arrayBufferToUTF8String(data));
    }

    checkCloudflareStatus(status: number): void {
        if (status === 503 || status === 403) {
            throw new CloudflareError({ url: DOMAIN_NAME, method: "GET" });
        }
    }

    // Populate search filters
    async getSearchFilters(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];

        // Type filter dropdown
        filters.push({
            id: "genres",
            type: "multiselect",
            options: genreOptions,
            allowExclusion: true,
            value: {},
            title: "Genre Filter",
            allowEmptySelection: false,
            maximum: undefined,
        });

        return filters;
    }

    async getSearchTags(): Promise<TagSection[]> {
        const request = {
            url: `${DOMAIN_NAME}/genres`,
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        return parseTags($);
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Katana.Metadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = (metadata as { page?: number } | undefined)?.page ?? 1;

        // Skip search for single character queries
        if (query.title && query.title.length === 1) {
            return { items: [], metadata: undefined };
        }

        // Set up request
        let request;
        if (query.title) {
            request = {
                url: new URLBuilder(DOMAIN_NAME)
                    .addPath("page")
                    .addPath(String(page))
                    .addQuery("search", encodeURIComponent(query.title))
                    .addQuery("search_by", "book_name")
                    .build(),
                method: "GET",
            };
        } else {
            // Extract the genre ID from the filters
            const genreFilter = query.filters?.find((f) => f.id === "genres");
            const genreValue = genreFilter?.value;

            // Get all included genre IDs
            const includedGenreIds = Object.entries(genreValue || {})
                .filter(([, value]) => value === "included")
                .map(([id]) => id);

            // Map genre IDs to their values
            const includedGenreValues = includedGenreIds
                .map((id) => {
                    const genreOption = genreOptions.find(
                        (option) => option.id === id,
                    );
                    return genreOption
                        ? genreOption.value.toLowerCase().replace(/ /g, "_")
                        : "";
                })
                .filter(Boolean);

            // Join multiple genres with underscores
            const includeValue = includedGenreValues.join("_");

            request = {
                url: new URLBuilder(DOMAIN_NAME)
                    .addPath("genres")
                    .addPath("page")
                    .addPath(String(page))
                    .addQuery("filter", "1")
                    .addQuery("include", includeValue)
                    .addQuery("include_mode", "and")
                    .addQuery("bookmark_opts", "off")
                    .addQuery("chapters", "1")
                    .build(),
                method: "GET",
            };
        }

        try {
            // Execute the request
            const $ = await this.fetchCheerio(request);

            const manga = parseSearch($);

            console.log(`\n\n It failed from here \n\n`);

            // Return results
            const nextPageMeta = !isLastPage($)
                ? { page: page + 1 }
                : undefined;

            console.log(
                `\n\nThe Mangas Length: ${manga.length} , the page: ${page} and nextPageMeta: ${JSON.stringify(nextPageMeta)}\n\n`,
            );

            return {
                items: manga,
                metadata: nextPageMeta,
            };
        } catch (error) {
            console.error(`Error fetching search results: `, error);
            throw new Error("Tap to retry search");
        }
    }

    // Populates the chapter list
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("manga")
                .addPath(sourceManga.mangaId)
                .build(),
            method: "GET",
        };
        const $ = await this.fetchCheerio(request);

        const chapters: Chapter[] = [];

        $(".chapters table.uk-table tbody tr").each((_, element) => {
            const row = $(element);
            const chapterLink = row.find(".chapter a");
            const chapterPath = chapterLink.attr("href") || "";
            const chapterId = chapterPath.split("/").pop() || "";
            const rawChapterText = chapterLink.text().trim();

            // Extract chapter number and subtitle using regex
            const chapterMatch = rawChapterText.match(
                /Chapter\s+([\d.]+)(?:\s*-\s*(.*))?/i,
            );
            const chapterNumber = chapterMatch
                ? parseFloat(chapterMatch[1])
                : 0;
            const chapterSubtitle = chapterMatch?.[2]?.trim() || "";

            // Format title: Use subtitle if available, otherwise blank
            const formattedTitle = chapterSubtitle;

            // Parse publish date
            const rawDate = row.find(".update_time").text().trim();
            const [month, day, year] = rawDate.split("-");
            const publishDate = new Date(`${month} ${day}, ${year}`);

            chapters.push({
                chapterId: chapterId,
                title: formattedTitle, // Will be empty if no subtitle
                sourceManga,
                chapNum: chapterNumber,
                publishDate: publishDate,
                langCode: "en",
            });
        });

        return chapters.reverse();
    }

    // Populates a chapter with images
    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const url = new URLBuilder(DOMAIN_NAME)
            .addPath("manga")
            .addPath(chapter.sourceManga.mangaId)
            .addPath(chapter.chapterId)
            .build();

        const request = {
            url: url,
            method: "GET",
            headers: {
                referer: DOMAIN_NAME,
                origin: DOMAIN_NAME,
                "user-agent": await Application.getDefaultUserAgent(),
            },
        };

        try {
            const [response, data] = await Application.scheduleRequest(request);
            if (response.status !== 200) {
                throw new Error(
                    `Failed to fetch chapter data: HTTP ${response.status}`,
                );
            }

            const htmlStr = Application.arrayBufferToUTF8String(data);
            const $ = cheerio.load(htmlStr);

            let pages: string[] = [];

            // Extract JavaScript variables
            const scripts = $("script")
                .toArray()
                .filter(
                    (script) =>
                        $(script).text().includes("var ytaw") ||
                        $(script).text().includes("var thzq"),
                )
                .map((script) => $(script).text())
                .join("");

            const ytawMatch = scripts.match(/var ytaw\s*=\s*\[([^\]]+)\]/);
            const thzqMatch = scripts.match(/var thzq\s*=\s*\[([^\]]+)\]/);

            const parseUrls = (matchStr: RegExpMatchArray | null) => {
                if (!matchStr) return [];
                return matchStr[1]
                    .split(",")
                    .map((url) => url.trim().replace(/['"]/g, ""))
                    .filter((url) => url && !url.includes("about:blank"))
                    .map((url) =>
                        url.startsWith("http") ? url : `${DOMAIN_NAME}${url}`,
                    ); // Ensure absolute URLs
            };

            pages = [...parseUrls(ytawMatch), ...parseUrls(thzqMatch)];

            // Fallback: Extract from DOM elements
            if (pages.length === 0) {
                $("#imgs .wrap_img img").each((_, img) => {
                    let imageUrl =
                        $(img).attr("data-src") || $(img).attr("src");
                    if (imageUrl) {
                        imageUrl = imageUrl.startsWith("http")
                            ? imageUrl
                            : `${DOMAIN_NAME}${imageUrl}`;
                        pages.push(imageUrl);
                    }
                });
            }

            // Debugging Log
            console.log(`Extracted pages: ${JSON.stringify(pages)}`);

            if (pages.length === 0) {
                throw new Error("No valid image URLs found");
            }

            return {
                id: chapter.chapterId, // Return only the chapter ID, not the full URL
                mangaId: chapter.sourceManga.mangaId,
                pages: pages,
            };
        } catch (error) {
            console.error(
                `Failed to load chapter details: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error(
                `Failed to load chapter: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    getMangaShareUrl(mangaId: string): string {
        return `${DOMAIN_NAME}/manga/${mangaId}`;
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("manga")
                .addPath(mangaId)
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        // Extract basic manga details
        const title = $("h1.heading").text().trim();
        const image = $(".cover img").attr("src") || "";
        const description = $(".summary p").text().trim();

        // Extract alternative titles
        const altTitles = $(".alt_name")
            .text()
            .trim()
            .split(";")
            .map((t) => t.trim())
            .filter((t) => t);

        // Extract authors
        const authors: string[] = [];
        $('td:contains("Author")')
            .next()
            .find("a")
            .each((_, el) => {
                authors.push($(el).text().trim());
            });

        // Extract status
        let status = "UNKNOWN";
        const statusLabel = $('div.d-cell-small.label:contains("Status")');
        if (statusLabel.length) {
            const statusElement = statusLabel.siblings("div.value");
            if (statusElement.length) {
                const statusText = statusElement.text().trim().toLowerCase();
                if (statusText.includes("ongoing")) {
                    status = "ONGOING";
                } else if (statusText.includes("completed")) {
                    status = "COMPLETED";
                } else if (statusText.includes("hiatus")) {
                    status = "HIATUS";
                } else if (statusText.includes("discontinued")) {
                    status = "DISCONTINUED";
                }
            }
        }

        // Extract genres
        // Extract genres
        const genres: string[] = [];
        $('div.label:contains("Genres")').each((_, el) => {
            $(el)
                .next("div.value")
                .find("a")
                .each((_, genreEl) => {
                    genres.push($(genreEl).text().trim());
                });
        });

        // Extract rating
        // let rating = 1;
        // const ratingText = $('.score').text().trim();
        // if (ratingText) {
        //     rating = parseFloat(ratingText) / 2; // Convert to 5-point scale
        // }

        // Build tag sections
        const tags: TagSection[] = [];
        if (genres.length > 0) {
            tags.push({
                id: "genres",
                title: "Genres",
                tags: genres.map((genre) => ({
                    id: genre.toLowerCase().replace(/\s+/g, "_"),
                    title: genre,
                })),
            });
        }

        // Determine content rating based on genres
        let contentRating = ContentRating.EVERYONE;
        const matureGenres = [
            "Adult",
            "Ecchi",
            "Erotica",
            "Sexual violence",
            "Gore",
        ];
        const adultGenres = ["Erotica", "Sexual violence"];

        if (genres.some((genre) => adultGenres.includes(genre))) {
            contentRating = ContentRating.ADULT;
        } else if (genres.some((genre) => matureGenres.includes(genre))) {
            contentRating = ContentRating.MATURE;
        }

        return {
            mangaId: mangaId,
            mangaInfo: {
                primaryTitle: title,
                secondaryTitles: altTitles,
                thumbnailUrl: image,
                synopsis: description,
                //rating: rating,
                contentRating: contentRating,
                status: status as "ONGOING" | "COMPLETED" | "UNKNOWN",
                tagGroups: tags,
                //authors: authors,
            },
        };
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

export const MangaKatana = new MangaKatanaExtension();
