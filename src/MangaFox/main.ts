// TODO:
// - Add the English name to the title view
// - Add additional info to the title view
// - Make getChapterDetails only return new chapters
// - Fix exclude search

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
    MangaProviding,
    PagedResults,
    PaperbackInterceptor,
    Request,
    Response,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
// Template content
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import { URLBuilder } from "../utils/url-builder/base";
import { genreOptions } from "./genreOptions";
import { genres } from "./genres";

const DOMAIN_NAME = "https://fanfox.net";

type Metadata = { offset?: number; collectedIds?: string[] };

// Should match the capabilities which you defined in pbconfig.ts
type MangaFoxImplementation = Extension &
    DiscoverSectionProviding &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding;

// Intercepts all the requests and responses and allows you to make changes to them
class MainInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...(request.headers ?? {}),
            ...{
                referer: `${DOMAIN_NAME}/`,
                "user-agent": await Application.getDefaultUserAgent(),
            },
        };

        request.cookies = { name: "isAdult", value: "1", domain: "fanfox.net" };

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
export class MangaFoxExtension implements MangaFoxImplementation {
    // Implementation of the main rate limiter
    mainRateLimiter = new BasicRateLimiter("main", {
        numberOfRequests: 4,
        bufferInterval: 1,
        ignoreImages: true,
    });

    // Implementation of the main interceptor
    mainInterceptor = new MainInterceptor("main");

    // Method from the Extension interface which we implement, initializes the rate limiter, interceptor, discover sections and search filters
    async initialise(): Promise<void> {
        this.mainRateLimiter.registerInterceptor();
        this.mainInterceptor.registerInterceptor();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        const get_Hot_Release: DiscoverSection = {
            id: "hot-release",
            title: "Hot Release",
            type: DiscoverSectionType.featured,
        };

        const get_New_Manga: DiscoverSection = {
            id: "new-manga",
            title: "New Manga",
            type: DiscoverSectionType.prominentCarousel,
        };

        const get_Latest_Updates: DiscoverSection = {
            id: "latest-updates",
            title: "Latest Updates",
            type: DiscoverSectionType.simpleCarousel,
        };

        const get_Genre_Section: DiscoverSection = {
            id: "get-genre-section",
            title: "Genres",
            type: DiscoverSectionType.genres,
        };

        return [
            get_Hot_Release,
            get_New_Manga,
            get_Latest_Updates,
            get_Genre_Section,
        ];
    }

    // Populates both the discover sections
    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        switch (section.id) {
            case "hot-release":
                return this.getHotRelease(metadata);
            case "new-manga":
                return this.getNewManga(section, metadata);
            case "latest-updates":
                return this.getLatestUpdates(section, metadata);
            case "get-genre-section":
                return this.getGenresSectionItems();
            default:
                return { items: [] };
        }
    }

    async getHotRelease(
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const items: DiscoverSectionItem[] = [];
        const collectedIds = metadata?.collectedIds ?? [];

        const request = {
            url: new URLBuilder(DOMAIN_NAME).build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        $("div.manga-list-1 ul.manga-list-1-list li").each((_, element) => {
            const unit = $(element);
            const mangaLink = $('a[href^="/manga/"]', unit).first();
            const mangaId =
                mangaLink
                    .attr("href")
                    ?.split("/manga/")[1]
                    ?.replace(/\//g, "") || "";
            const image = $("img.manga-list-1-cover", unit).attr("src") ?? "";
            const title = mangaLink.attr("title")?.trim() ?? "";
            const subtitle = $("p.manga-list-1-item-subtitle", unit)
                .text()
                .trim();

            const safeId = decodeURIComponent(mangaId)
                .replace(/[^\w@.]/g, "_")
                .trim();

            if (safeId && title && image && !collectedIds.includes(safeId)) {
                collectedIds.push(safeId);
                items.push(
                    createDiscoverSectionItem({
                        id: safeId,
                        image: image,
                        title: title,
                        subtitle: subtitle,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        return {
            items: items,
            metadata: undefined,
        };
    }

    async getNewManga(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const items: DiscoverSectionItem[] = [];
        const collectedIds = metadata?.collectedIds ?? [];
        const page = (metadata as { page?: number } | undefined)?.page ?? 1;

        // Build the URL with proper pagination
        const urlBuilder = new URLBuilder(DOMAIN_NAME).addPath("directory");

        if (page > 1) {
            urlBuilder.addPath(`${page}.html?news`);
        } else {
            urlBuilder.addPath("?news");
        }

        const request = {
            url: urlBuilder.build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        // Process manga items - keeping this part unchanged
        $("div.manga-list-1 ul.manga-list-1-list li").each((_, element) => {
            const unit = $(element);

            const mangaLink = $('a[href^="/manga/"]', unit).first();
            const mangaId =
                mangaLink
                    .attr("href")
                    ?.split("/manga/")[1]
                    ?.replace(/\//g, "") || "";
            const image = $("img.manga-list-1-cover", unit).attr("src") ?? "";
            const title = mangaLink.attr("title")?.trim() ?? "";
            const subtitle = $("ul.manga-list-4-item-part > li", unit)
                .text()
                .trim();

            const safeId = decodeURIComponent(mangaId)
                .replace(/[^\w@.]/g, "_")
                .trim();

            if (safeId && title && image && !collectedIds.includes(safeId)) {
                collectedIds.push(safeId);
                items.push(
                    createDiscoverSectionItem({
                        id: safeId,
                        image: image,
                        title: title,
                        subtitle: subtitle,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        // Improved pagination detection based on the provided HTML
        let nextPage: number | undefined;

        // Look for the ">" link which indicates next page is available
        const nextPageLink = $(".pager-list-left a").filter(function () {
            return $(this).text() === ">";
        });

        if (nextPageLink.length > 0) {
            const nextPageHref = nextPageLink.attr("href");
            if (nextPageHref) {
                // Extract page number from href format like "/directory/2.html?news"
                const pageMatch = nextPageHref.match(
                    /\/directory\/(\d+)\.html/,
                );
                if (pageMatch && pageMatch[1]) {
                    nextPage = parseInt(pageMatch[1], 10);
                } else {
                    // Fallback - increment current page
                    nextPage = page + 1;
                }
            }
        }

        return {
            items: items,
            metadata: nextPage ? { page: nextPage, collectedIds } : undefined,
        };
    }

    async getLatestUpdates(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const items: DiscoverSectionItem[] = [];
        const collectedIds = metadata?.collectedIds ?? [];
        const page = (metadata as { page?: number } | undefined)?.page ?? 1;

        // Build the URL with proper pagination
        const urlBuilder = new URLBuilder(DOMAIN_NAME).addPath("releases");

        if (page > 1) {
            urlBuilder.addPath(`${page}.html`);
        }

        const request = {
            url: urlBuilder.build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        // Process manga items - updated for manga-list-4 structure
        $("div.manga-list-4 ul.manga-list-4-list li").each((_, element) => {
            const unit = $(element);

            const mangaLink = $("p.manga-list-4-item-title a", unit).first();
            const mangaId =
                mangaLink
                    .attr("href")
                    ?.split("/manga/")[1]
                    ?.replace(/\//g, "") || "";
            const image = $("img.manga-list-4-cover", unit).attr("src") ?? "";
            const title = mangaLink.attr("title")?.trim() ?? "";
            //const subtitle = $('p.manga-list-4-item-subtitle', unit).text().trim();
            const subtitle = $("ul.manga-list-4-item-part > li", unit)
                .first()
                .text()
                .trim();

            const safeId = decodeURIComponent(mangaId)
                .replace(/[^\w@.]/g, "_")
                .trim();

            if (safeId && title && image && !collectedIds.includes(safeId)) {
                collectedIds.push(safeId);
                items.push(
                    createDiscoverSectionItem({
                        id: safeId,
                        image: image,
                        title: title,
                        subtitle: subtitle,
                        type: "simpleCarouselItem",
                    }),
                );
            }
        });

        // Improved pagination detection based on the provided HTML
        let nextPage: number | undefined;

        // Look for the ">" link which indicates next page is available
        const nextPageLink = $(".pager-list-left a").filter(function () {
            return $(this).text() === ">";
        });

        if (nextPageLink.length > 0) {
            const nextPageHref = nextPageLink.attr("href");
            if (nextPageHref) {
                // Extract page number from href format like "/directory/2.html?news"
                const pageMatch = nextPageHref.match(
                    /\/directory\/(\d+)\.html/,
                );
                if (pageMatch && pageMatch[1]) {
                    nextPage = parseInt(pageMatch[1], 10);
                } else {
                    // Fallback - increment current page
                    nextPage = page + 1;
                }
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

    // Populates search
    async getSearchResults(
        query: SearchQuery,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const collectedIds = metadata?.collectedIds ?? [];
        const page = (metadata as { page?: number } | undefined)?.page ?? 1;
        const urlBuilder = new URLBuilder(DOMAIN_NAME).addPath("search");
        let fixedUrl = "";

        if (page > 1) {
            urlBuilder.addQuery("page", page.toString());
        }

        // Get the filters to access the genre options
        const filters = await this.getSearchFilters();
        const genreFilter = filters.find((f) => f.id === "genres");

        // Define type for the multiselect filter
        interface FilterOption {
            id: string;
            value: string;
        }

        type MultiselectFilter = SearchFilter & {
            type: "multiselect";
            options: FilterOption[];
        };

        // Handle genres
        const genresFilter = query.filters?.find((f) => f.id === "genres")
            ?.value as Record<string, "included" | "excluded">;
        if (genresFilter && genreFilter) {
            const typedGenreFilter = genreFilter as MultiselectFilter;
            Object.entries(genresFilter).forEach(([id, inclusion]) => {
                if (inclusion === "included") {
                    // Get the genre option by id with proper typing
                    const genreOption = typedGenreFilter.options.find(
                        (opt) => opt.id === id,
                    );
                    if (genreOption) {
                        // Use the genre's ID directly for the query parameter
                        urlBuilder.addQuery("genres", genreOption.id);
                    }
                }
                // Excluded genres not supported in the provided URL examples
            });
        }

        if (query.title && query.title.trim() !== "") {
            // Don't encode apostrophes as they should remain in the URL
            urlBuilder.addQuery("title", query.title);

            fixedUrl = urlBuilder.build();
        } else {
            urlBuilder.addQuery("title", "");
            const url = urlBuilder.build();

            fixedUrl = url.replace("title=%22%22", "title=");
        }

        const request = {
            url: fixedUrl,
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);
        const searchResults: SearchResultItem[] = [];

        // Process manga items - updated for manga-list-4 structure
        $("div.manga-list-4 ul.manga-list-4-list li").each((_, element) => {
            const unit = $(element);

            const mangaLink = $("p.manga-list-4-item-title a", unit).first();
            const mangaId =
                mangaLink
                    .attr("href")
                    ?.split("/manga/")[1]
                    ?.replace(/\//g, "") || "";
            const image = $("img.manga-list-4-cover", unit).attr("src") ?? "";
            const title = mangaLink.attr("title")?.trim() ?? "";
            //const subtitle = $('p.manga-list-4-item-subtitle', unit).text().trim();
            const subtitle = $("ul.manga-list-4-item-part > li", unit)
                .first()
                .text()
                .trim();

            const safeId = decodeURIComponent(mangaId)
                .replace(/[^\w@.]/g, "_")
                .trim();

            if (safeId && title && image && !collectedIds.includes(safeId)) {
                collectedIds.push(safeId);
                searchResults.push({
                    mangaId: safeId,
                    imageUrl: image,
                    title: title,
                    subtitle: subtitle,
                });
            }
        });

        // Improved pagination detection based on the provided HTML
        let nextPage: number | undefined;

        // Look for the ">" link which indicates next page is available
        const nextPageLink = $(".pager-list-left a").filter(function () {
            return $(this).text() === ">";
        });

        if (nextPageLink.length > 0) {
            const nextPageHref = nextPageLink.attr("href");
            if (nextPageHref) {
                // Extract page number from href format like "/directory/2.html?news"
                const pageMatch = nextPageHref.match(
                    /\/directory\/(\d+)\.html/,
                );
                if (pageMatch && pageMatch[1]) {
                    nextPage = parseInt(pageMatch[1], 10);
                } else {
                    // Fallback - increment current page
                    nextPage = page + 1;
                }
            }
        }

        return {
            items: searchResults,
            metadata: nextPage ? { page: nextPage, collectedIds } : undefined,
        };
    }

    // Populates the title details
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("manga")
                .addPath(mangaId)
                .build(),
            method: "GET",
        };

        const $ = await this.fetchCheerio(request);

        const section = $(".detail-info");

        const title = $("span.detail-info-right-title-font", section)
            .text()
            .trim();
        const rating = $("span.item-score", section)
            .text()
            .trim()
            .replace(",", ".");
        const author = $("p.detail-info-right-say a", section).text().trim();
        const image =
            $(".detail-info-cover-img", $(".detail-info-cover")).attr("src") ??
            "";
        const description = $("p.fullcontent").text().trim();

        const arrayTags: Tag[] = [];
        for (const tag of $("a", ".detail-info-right-tag-list").toArray()) {
            const id = $(tag)
                .attr("href")
                ?.split("/directory/")[1]
                ?.replace(/\//g, "");
            const label = $(tag).text().trim();

            if (!id || !label) continue;
            arrayTags.push({ id: id, title: label });
        }
        //const tagSections: TagSection[] = [App.createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => App.createTag(x)) })]

        // Build tag sections
        const tags: TagSection[] = [];
        if (genres.length > 0) {
            tags.push({
                id: "genres",
                title: "Genres",
                tags: arrayTags.map((genre) => ({
                    id: genre.id.toLowerCase().replace(/\s+/g, "_"),
                    title: genre.title,
                })),
            });
        }

        const rawStatus = $(".detail-info-right-title-tip", section)
            .text()
            .trim();
        let status = "ONGOING";
        switch (rawStatus.toUpperCase()) {
            case "ONGOING":
                status = "Ongoing";
                break;
            case "COMPLETED":
                status = "Completed";
                break;
            default:
                status = "Ongoing";
                break;
        }

        // Determine content rating based on genres
        let contentRating = ContentRating.EVERYONE;

        // These are the genres considered for higher content rating
        const adultGenres = ["Adult", "Lolicon", "Shotacon"];
        const matureGenres = [
            "Ecchi",
            "Mature",
            "Smut",
            "Yaoi",
            "Yuri",
            ...adultGenres, // Include adult genres as mature as well
        ];

        // Access the name property of each genre object for comparison
        if (genres.some((genre) => adultGenres.includes(genre.name))) {
            contentRating = ContentRating.ADULT;
        } else if (genres.some((genre) => matureGenres.includes(genre.name))) {
            contentRating = ContentRating.MATURE;
        }

        return {
            mangaId: mangaId,
            mangaInfo: {
                primaryTitle: title,
                thumbnailUrl: image,
                rating: Number(rating),
                status: status,
                author: author,
                artist: author,
                tagGroups: tags,
                synopsis: description,
                secondaryTitles: [],
                contentRating: contentRating,
            },
        };
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

        for (const chapter of $("div#chapterlist ul li")
            .children("a")
            .toArray()) {
            //const title = $('p.title3', chapter).html() ?? ''
            const date = parseDate($("p.title2", chapter).html() ?? "");
            const chapterIdRaw = $(chapter).attr("href")?.trim();

            const chapterIdRegex = chapterIdRaw?.match(
                /\/manga\/[a-zA-Z0-9_]*\/(.*)\//,
            );

            let chapterId: string | null = null;
            if (chapterIdRegex && chapterIdRegex[1])
                chapterId = chapterIdRegex[1].split("/").pop() ?? null;

            if (!chapterId) continue;

            console.log(`Chapter ID: ${chapterId}`);

            const chapRegex = chapterId?.match(/c([0-9.]+)/);
            let chapNum = 0;
            if (chapRegex && chapRegex[1]) chapNum = Number(chapRegex[1]);

            chapters.push({
                chapterId: chapterId,
                sourceManga: sourceManga,
                //title: title,
                langCode: "🇬🇧",
                chapNum: isNaN(chapNum) ? 0 : chapNum,
                publishDate: date,
            });
        }

        // Reverse to show newest chapters first
        return chapters.reverse();
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        console.log(`Fetching chapter details for ${chapter.chapterId}`);

        const request = {
            url: new URLBuilder(DOMAIN_NAME)
                .addPath("manga")
                .addPath(chapter.sourceManga.mangaId)
                .addPath(chapter.chapterId)
                .build(),
            method: "GET",
        };

        try {
            const $ = await this.fetchCheerio(request);
            const pages: string[] = [];

            // Check if it's a webtoon-style chapter with chapter_bar
            const isWebtoon = $("script[src*=chapter_bar]").length > 0;

            if (isWebtoon) {
                // Handle webtoon format
                const script = $("script:contains(function(p,a,c,k,e,d))")
                    .html()
                    ?.replace("eval", "");
                if (script) {
                    const deobfuscatedScript = (
                        (0, eval)(script) as unknown as { toString(): string }
                    ).toString();
                    const urlsMatch =
                        deobfuscatedScript.match(/newImgs=\['(.+?)'\]/);
                    if (urlsMatch && urlsMatch[1]) {
                        const urls = urlsMatch[1].split("','");
                        for (const url of urls) {
                            pages.push("https:" + url.replace("'", ""));
                        }
                    }
                }
            } else {
                // Handle regular manga format
                const script = $("script:contains(function(p,a,c,k,e,d))")
                    .html()
                    ?.replace("eval", "");
                if (script) {
                    const deobfuscatedScript = (
                        (0, eval)(script) as unknown as { toString(): string }
                    ).toString();

                    // Extract secret key
                    const secretKeyStart = deobfuscatedScript.indexOf("'");
                    const secretKeyEnd = deobfuscatedScript.indexOf(";");
                    const secretKeyResultScript = deobfuscatedScript
                        .substring(secretKeyStart, secretKeyEnd)
                        .trim();
                    let secretKey = "";
                    try {
                        secretKey = (
                            (0, eval)(secretKeyResultScript) as unknown as {
                                toString(): string;
                            }
                        ).toString();
                    } catch (e) {
                        console.error("Error extracting secret key:", e);
                    }

                    // Find chapter ID
                    const chapterIdStartLoc = $.html().indexOf("chapterid");
                    if (chapterIdStartLoc > -1) {
                        const numericChapterId = $.html()
                            .substring(
                                chapterIdStartLoc + 11,
                                $.html().indexOf(";", chapterIdStartLoc),
                            )
                            .trim();

                        // Find number of pages
                        const pagesLinksElements = $(
                            "a",
                            $(".pager-list-left > span").first(),
                        );
                        const pagesNumber =
                            Number(
                                $(
                                    pagesLinksElements[
                                        pagesLinksElements.length - 2
                                    ],
                                )?.attr("data-page"),
                            ) || 0;

                        if (pagesNumber > 0) {
                            const pageBase = request.url.substring(
                                0,
                                request.url.lastIndexOf("/"),
                            );

                            // Fetch each page
                            for (let i = 1; i <= pagesNumber; i++) {
                                let responseString = "";

                                // Try up to 3 times to get the page
                                for (let tr = 1; tr <= 3; tr++) {
                                    const pageRequest = {
                                        url: `${pageBase}/chapterfun.ashx?cid=${numericChapterId}&page=${i}&key=${secretKey}`,
                                        method: "GET",
                                        headers: {
                                            Referer: request.url,
                                            Accept: "*/*",
                                            "Accept-Language": "en-US,en;q=0.9",
                                            Connection: "keep-alive",
                                            "X-Requested-With":
                                                "XMLHttpRequest",
                                        },
                                    };

                                    try {
                                        const [_, buffer] =
                                            await Application.scheduleRequest(
                                                pageRequest,
                                            );
                                        responseString =
                                            Application.arrayBufferToUTF8String(
                                                buffer,
                                            );
                                        if (responseString) {
                                            secretKey = ""; // Clear key after successful request
                                            break;
                                        }
                                    } catch (err) {
                                        console.error(
                                            `Error on attempt ${tr} for page ${i}:`,
                                            err,
                                        );
                                        // Continue to next attempt
                                    }
                                }

                                if (responseString) {
                                    try {
                                        const deobfuscatedPageScript = (
                                            (0, eval)(
                                                responseString.replace(
                                                    "eval",
                                                    "",
                                                ),
                                            ) as unknown as {
                                                toString(): string;
                                            }
                                        ).toString();

                                        // Extract base link and image link
                                        const baseLinkStartPos =
                                            deobfuscatedPageScript.indexOf(
                                                "pix=",
                                            ) + 5;
                                        const baseLink =
                                            deobfuscatedPageScript.substring(
                                                baseLinkStartPos,
                                                deobfuscatedPageScript.indexOf(
                                                    ";",
                                                    baseLinkStartPos,
                                                ) - 1,
                                            );

                                        const imageLinkStartPos =
                                            deobfuscatedPageScript.indexOf(
                                                "pvalue=",
                                            ) + 9;
                                        const imageLinkEndPos =
                                            deobfuscatedPageScript.indexOf(
                                                '"',
                                                imageLinkStartPos,
                                            );
                                        const imageLink =
                                            deobfuscatedPageScript.substring(
                                                imageLinkStartPos,
                                                imageLinkEndPos,
                                            );

                                        pages.push(
                                            `https:${baseLink}${imageLink}`,
                                        );
                                    } catch (e) {
                                        console.error(
                                            `Error processing page ${i}:`,
                                            e,
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Alternative extraction method in case the above methods fail
            if (pages.length === 0) {
                // Try to find images directly in the HTML
                $("img.img-fluid").each((_, element) => {
                    const src = $(element).attr("src");
                    if (src && src.length > 0) {
                        pages.push(src);
                    }
                });

                // Or check for JSON data in script tags
                $("script:not([src])").each((_, element) => {
                    const scriptText = $(element).html() || "";
                    if (
                        scriptText.includes('"images"') ||
                        scriptText.includes('"pages"')
                    ) {
                        try {
                            const match = scriptText.match(
                                /(\{.*"images":\s*\[.*\].*\})/,
                            );
                            if (match && match[1]) {
                                interface ChapterImagesJson {
                                    images: Array<string | string[]>;
                                }
                                const json = JSON.parse(
                                    match[1],
                                ) as ChapterImagesJson;
                                if (json.images && Array.isArray(json.images)) {
                                    json.images.forEach(
                                        (img: string | string[]) => {
                                            if (typeof img === "string") {
                                                pages.push(img);
                                            } else if (
                                                Array.isArray(img) &&
                                                img.length > 0
                                            ) {
                                                pages.push(img[0]);
                                            }
                                        },
                                    );
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing JSON from script:", e);
                        }
                    }
                });
            }

            if (pages.length === 0) {
                throw new Error("No images found for this chapter");
            }

            console.log(`Successfully extracted ${pages.length} pages`);

            return {
                id: chapter.chapterId,
                mangaId: chapter.sourceManga.mangaId,
                pages: pages,
            };
        } catch (error) {
            console.error(
                `Failed to get chapter details: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw new Error(
                `Failed to load chapter: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
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

const parseDate = (date: string): Date => {
    date = date.toUpperCase();
    let time: Date;
    const number = Number((/\d*/.exec(date) ?? [])[0]);
    if (date.includes("LESS THAN AN HOUR") || date.includes("JUST NOW")) {
        time = new Date(Date.now());
    } else if (date.includes("YEAR") || date.includes("YEARS")) {
        time = new Date(Date.now() - number * 31556952000);
    } else if (date.includes("MONTH") || date.includes("MONTHS")) {
        time = new Date(Date.now() - number * 2592000000);
    } else if (date.includes("WEEK") || date.includes("WEEKS")) {
        time = new Date(Date.now() - number * 604800000);
    } else if (date.includes("YESTERDAY")) {
        time = new Date(Date.now() - 86400000);
    } else if (date.includes("DAY") || date.includes("DAYS")) {
        time = new Date(Date.now() - number * 86400000);
    } else if (date.includes("HOUR") || date.includes("HOURS")) {
        time = new Date(Date.now() - number * 3600000);
    } else if (date.includes("MINUTE") || date.includes("MINUTES")) {
        time = new Date(Date.now() - number * 60000);
    } else if (date.includes("SECOND") || date.includes("SECONDS")) {
        time = new Date(Date.now() - number * 1000);
    } else {
        time = new Date(date);
    }
    return time;
};

export const MangaFox = new MangaFoxExtension();
