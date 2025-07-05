// Responsible for parsing HTML responses from zzizz.xyz
// This file contains all the logic for extracting manga, chapter, and search data from the Zzizz site.
// Comments focus on intent, edge cases, and site-specific quirks for future maintainers.

import {
    Chapter,
    ChapterDetails,
    ContentRating,
    DiscoverSection,
    DiscoverSectionItem,
    SearchResultItem,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
import { CheerioAPI } from "cheerio";
import { API_ENDPOINTS, SELECTORS } from "./constants";
import { ZizHelpers } from "./helpers";
import { DOMAIN } from "./pbconfig";

export class ZizParser {
    /**
     * Parses manga details from the details page HTML.
     * Handles quirks of the Zzizz site, such as status wording and genre structure.
     */
    async parseMangaDetails(
        $: CheerioAPI,
        mangaId: string,
        source: { domain: string; defaultContentRating: ContentRating },
    ): Promise<SourceManga> {
        // Title is always in the main h1 tag
        const title: string = Application.decodeHTMLEntities(
            $(SELECTORS.MANGA.TITLE).first().text().trim(),
        );
        const secondaryTitles: string[] = [];

        // Author/artist are sometimes missing; send empty string if not found
        const author: string = Application.decodeHTMLEntities(
            $(SELECTORS.MANGA.AUTHOR).parent().find("a").first().text().trim(),
        );
        const artist: string = Application.decodeHTMLEntities(
            $(SELECTORS.MANGA.ARTIST).parent().find("a").first().text().trim(),
        );

        // Synopsis is under a .prose div after the 'Synopsis' heading
        // If missing, provide a fallback
        const synopsis: string = Application.decodeHTMLEntities(
            $(SELECTORS.MANGA.SYNOPSIS).next(".prose").text().trim() ||
                "No description available",
        );

        const shareUrl: string = `${source.domain}/manga/${mangaId}/`;

        // Cover image is always in the left column; build full URL if needed
        const image: string =
            $(SELECTORS.MANGA.COVER).first().attr("src") || "";
        const fullImageUrl = ZizHelpers.buildFullUrl(image, source.domain);

        // Status is a text field; Zzizz uses 'In Release' for ongoing
        // If the site adds new statuses, update the mapping in helpers/constants
        const statusText = $(SELECTORS.MANGA.STATUS)
            .parent()
            .find("p.text-white.font-bold.text-lg")
            .text()
            .trim();
        const status = ZizHelpers.normalizeStatus(statusText);

        // Genres are styled span tags; collect both for display and for content rating logic
        const genreKeywords: string[] = [];
        const genres: Tag[] = [];
        $(SELECTORS.MANGA.GENRES).each((_, obj) => {
            const title = $(obj).text().trim();
            if (!title) return;
            genreKeywords.push(title.toLowerCase());
            genres.push({
                id: title.toLowerCase().replace(/\s+/g, "-"),
                title,
            });
        });

        // Content rating is determined by genre (e.g., 'Harém' means adult)
        const contentRating = ZizHelpers.determineContentRating(genreKeywords);

        // Rating is out of 5 on the site; convert to Paperback's expected format
        // If missing or 'N/A', do not send a rating
        const ratingText = $(SELECTORS.MANGA.RATING).text().trim();
        const rating = ZizHelpers.calculateRating(ratingText);

        const tagGroups: TagSection[] = [
            { id: "genres", title: "Genres", tags: genres },
        ];

        return {
            mangaId,
            mangaInfo: {
                shareUrl: shareUrl,
                primaryTitle: title,
                secondaryTitles: secondaryTitles,
                thumbnailUrl: fullImageUrl,
                author: author,
                artist: artist,
                tagGroups: tagGroups,
                synopsis: synopsis,
                contentRating: contentRating,
                status: status,
                ...(rating !== undefined ? { rating } : {}),
            },
        };
    }

    /**
     * Parses the chapter list from a manga page.
     * Handles edge cases like missing chapter numbers or non-standard URLs.
     */
    parseChapterList(
        $: CheerioAPI,
        sourceManga: SourceManga,
        source: { domain: string; language: string },
    ): Chapter[] {
        const chapters: Chapter[] = [];

        // Each chapter is a link with the .chapter-item class
        $(SELECTORS.CHAPTER.ITEMS).each((_, obj) => {
            const href = $(obj).attr("href") || "";
            if (!href || href.startsWith("#")) return;

            let chapterId = href;
            if (href.startsWith("http")) {
                // Normalize to relative path if needed
                const match = href.match(/^https?:\/\/[^/]+(\/.*)$/);
                if (match) chapterId = match[1];
            }
            // Always ensure trailing slash for consistency
            chapterId = ZizHelpers.ensureTrailingSlash(chapterId);

            // Extract chapter number and name (fallback to URL if not in title)
            const chapterTitle = $(obj)
                .find(SELECTORS.CHAPTER.TITLE)
                .text()
                .trim();
            const { number: chapNum, name: chapName } =
                ZizHelpers.extractChapterNumber(chapterTitle, chapterId);

            // Dates are relative (e.g., '1 day ago'); parse to Date object
            const dateText = $(obj).find(SELECTORS.CHAPTER.DATE).text().trim();
            const dateMatch = dateText.match(
                /(\d+\s+(?:day|hour|minute)s?\s+ago)/i,
            );
            const chapterDate = dateMatch ? dateMatch[1] : "";
            const mangaTime = ZizHelpers.parseRelativeDate(chapterDate);

            if (!chapterId || chapterId === "#") {
                // Defensive: skip if no valid chapter ID
                return;
            }

            chapters.push({
                sourceManga: sourceManga,
                chapterId: chapterId,
                langCode: source.language,
                chapNum: chapNum,
                title: chapName ? Application.decodeHTMLEntities(chapName) : "",
                publishDate: mangaTime,
                sortingIndex: chapters.length + 1, // Use array index for sorting
            });
        });

        // Sort chapters by number (newest first)
        chapters.sort((a, b) => b.chapNum - a.chapNum);
        // Update sorting index after sorting
        chapters.forEach((chapter, index) => {
            chapter.sortingIndex = chapters.length - index;
        });

        return chapters;
    }

    /**
     * Parses the image URLs for a chapter using Zzizz's canvas-based system.
     * If the site changes to use a different system, update this logic.
     */
    async parseChapterDetails(
        $: CheerioAPI,
        chapter: Chapter,
    ): Promise<ChapterDetails> {
        const pages: string[] = [];

        // Each page is a canvas with a data-page-id attribute
        const canvases = $(SELECTORS.CHAPTER.CANVAS);
        if (canvases.length > 0) {
            // The API base URL is usually static, but check scripts in case it changes
            let pageApiUrlBase = API_ENDPOINTS.READER_BASE as string;
            $("script").each((_, script) => {
                const scriptContent = $(script).html() || "";
                const apiMatch = scriptContent.match(
                    /pageApiUrlBase\s*=\s*["']([^"']+)["']/,
                );
                if (apiMatch) {
                    pageApiUrlBase = apiMatch[1];
                }
            });
            for (let i = 0; i < canvases.length; i++) {
                const canvas = canvases.eq(i);
                const pageId = canvas.attr("data-page-id");
                if (!pageId) continue;
                // Construct the direct image URL for the page
                const pageUrl = pageApiUrlBase.startsWith("http")
                    ? `${pageApiUrlBase}${pageId}/`
                    : `${DOMAIN}${pageApiUrlBase}${pageId}/`;
                pages.push(pageUrl);
            }
        }

        // If the site ever changes to use <img> tags or another system, add a fallback here

        return {
            id: chapter.chapterId,
            mangaId: chapter.sourceManga.mangaId,
            pages: pages,
        };
    }

    /**
     * Parses search results from the /mangas page.
     * Handles empty results and builds full image URLs.
     */
    async parseSearchResults($: CheerioAPI): Promise<SearchResultItem[]> {
        const results: SearchResultItem[] = [];
        // If no results, return empty array
        const noResultsElement = $(SELECTORS.SEARCH.NO_RESULTS);
        if (noResultsElement.length > 0) {
            return results;
        }
        // Each result is a link in the content grid
        $(SELECTORS.SEARCH.RESULTS).each((_, obj) => {
            const href = $(obj).attr("href") || "";
            const title = $(obj).find(SELECTORS.SEARCH.TITLE).text().trim();
            const image =
                $(obj).find(SELECTORS.SEARCH.IMAGE).first().attr("src") || "";
            if (!title || !href) return;
            const mangaId = ZizHelpers.cleanMangaId(href);
            const fullImageUrl = ZizHelpers.buildFullUrl(
                image,
                "https://zzizz.xyz",
            );
            results.push({
                mangaId: mangaId,
                title: Application.decodeHTMLEntities(title),
                imageUrl: fullImageUrl,
            });
        });
        return results;
    }

    /**
     * Parses discover sections for the homepage (latest updates, trending, etc).
     * If the site adds new sections, add new cases here.
     */
    async parseDiscoverSections(
        $: CheerioAPI,
        section: DiscoverSection,
    ): Promise<DiscoverSectionItem[]> {
        const items: DiscoverSectionItem[] = [];
        switch (section.id) {
            case "latest_updates":
                // Each item is a card in the updates grid
                $(SELECTORS.DISCOVER.LATEST_UPDATES).each((_, obj) => {
                    const title = $(obj).find("h2").text().trim();
                    const image = $(obj).find("img").first().attr("src") || "";
                    const href = $(obj).find("a").first().attr("href") || "";
                    // Subtitle is the most recent chapter number, if available
                    const firstChapterLink = $(obj)
                        .find("div.mt-3.space-y-2 > a")
                        .first();
                    let subtitle = undefined;
                    if (firstChapterLink.length > 0) {
                        const chapterText = firstChapterLink
                            .find("p.text-white")
                            .text()
                            .trim();
                        const chapterMatch =
                            chapterText.match(/Chapter\s+(\d+)/);
                        if (chapterMatch) {
                            subtitle = `Chapter ${chapterMatch[1]}`;
                        }
                    }
                    if (!title || !href) return;
                    const mangaId = ZizHelpers.cleanMangaId(href);
                    const fullImageUrl = ZizHelpers.buildFullUrl(image, DOMAIN);
                    items.push({
                        type: "simpleCarouselItem",
                        mangaId: mangaId,
                        title: Application.decodeHTMLEntities(title),
                        imageUrl: fullImageUrl,
                        ...(subtitle ? { subtitle } : {}),
                    });
                });
                break;
            case "latest_projects":
                // Parse Latest Projects section (formerly Latest Manhua)
                $("h2:contains('Latest Projects')")
                    .parent()
                    .find(".grid a")
                    .each((_, obj) => {
                        const title = $(obj).find("h3").text().trim();
                        const image =
                            $(obj).find("img").first().attr("src") || "";
                        const href = $(obj).attr("href") || "";
                        // Find chapter count in a <p> or <span> containing 'Chapters'
                        let subtitle = undefined;
                        $(obj)
                            .find("p, span")
                            .each((_, el) => {
                                const text = $(el).text().trim();
                                if (/\bChapters?\b/i.test(text)) {
                                    subtitle = text;
                                    return false;
                                }
                            });
                        if (!title || !href) return;
                        const mangaId = this.idCleaner(href);
                        const fullImageUrl = image.startsWith("http")
                            ? image
                            : `${DOMAIN}${image}`;
                        items.push({
                            type: "simpleCarouselItem",
                            mangaId: mangaId,
                            title: Application.decodeHTMLEntities(title),
                            imageUrl: fullImageUrl,
                            ...(subtitle
                                ? {
                                      subtitle:
                                          Application.decodeHTMLEntities(
                                              subtitle,
                                          ),
                                  }
                                : {}),
                        });
                    });
                break;

            case "trending_day":
            case "trending_week":
            case "trending_all": {
                // For trending sections, we need to make AJAX calls
                const period = section.id.replace("trending_", "");
                try {
                    const trendingUrl = `${DOMAIN}/ajax/get-trending-data/?period=${period}`;
                    const [, buffer] = await Application.scheduleRequest({
                        url: trendingUrl,
                        method: "GET",
                    });
                    const response =
                        Application.arrayBufferToUTF8String(buffer);
                    const data = JSON.parse(response) as {
                        works: Array<{
                            title: string;
                            url: string;
                            cover_url: string;
                            last_chapter_num?: number;
                        }>;
                    };
                    data.works.forEach((work) => {
                        const mangaId = this.idCleaner(work.url);
                        const fullImageUrl = work.cover_url.startsWith("http")
                            ? work.cover_url
                            : `${DOMAIN}${work.cover_url}`;
                        // Use last_chapter_num if available
                        let subtitle = undefined;
                        if (work.last_chapter_num) {
                            subtitle = `${work.last_chapter_num} Chapters`;
                        }
                        items.push({
                            type: "simpleCarouselItem",
                            mangaId: mangaId,
                            title: Application.decodeHTMLEntities(work.title),
                            imageUrl: fullImageUrl,
                            ...(subtitle ? { subtitle } : {}),
                        });
                    });
                } catch (error) {
                    console.error(
                        `Failed to fetch trending data for ${period}:`,
                        error,
                    );
                }
                break;
            }

            default:
                // Fallback to general manga items
                $(".manga-item, .manga-card").each((_, obj) => {
                    const title = $(obj)
                        .find("h3, .title, .manga-title")
                        .text()
                        .trim();
                    const image = $(obj).find("img").first().attr("src") || "";
                    const href = $(obj).find("a").first().attr("href") || "";
                    // Find chapter count in a <p> or <span> containing 'Chapters'
                    let subtitle = undefined;
                    $(obj)
                        .find("p, span")
                        .each((_, el) => {
                            const text = $(el).text().trim();
                            if (/\bChapters?\b/i.test(text)) {
                                subtitle = text;
                                return false;
                            }
                        });
                    if (!title || !href) return;
                    const mangaId = this.idCleaner(href);
                    const fullImageUrl = image.startsWith("http")
                        ? image
                        : `${DOMAIN}${image}`;
                    items.push({
                        type: "simpleCarouselItem",
                        mangaId: mangaId,
                        title: Application.decodeHTMLEntities(title),
                        imageUrl: fullImageUrl,
                        ...(subtitle
                            ? {
                                  subtitle:
                                      Application.decodeHTMLEntities(subtitle),
                              }
                            : {}),
                    });
                });
        }

        return items;
    }

    // Utility methods
    public idCleaner(url: string): string {
        if (!url || typeof url !== "string") return "";
        // Remove query params and trailing slashes
        const cleanUrl = url.split("?")[0].replace(/\/$/, "");
        // Match /manga/slug or /reader/manga/slug
        const match = cleanUrl.match(/(?:\/manga\/|\/reader\/manga\/)([^/]+)/);
        return match
            ? match[1]
            : cleanUrl.split("/").filter(Boolean).pop() || "";
    }
}
