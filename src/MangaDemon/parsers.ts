// MangaDemon Parser for Paperback
// ------------------------------
// Responsible for parsing HTML responses from demonicscans.org.
// Extracts manga details, chapter lists, search results, and chapter page images.

import { type DiscoverSectionItem } from "@paperback/types";
import { type CheerioAPI } from "cheerio";
import { type SearchResultItem } from "./models";

export class MangaDemonParser {
    /**
     * Parses the "Most Viewed Today" carousel for the discover section.
     * Returns an array of items with mangaId, title, and imageUrl.
     */
    async parseMostViewedToday($: CheerioAPI): Promise<DiscoverSectionItem[]> {
        const items: DiscoverSectionItem[] = [];
        $(".owl-carousel#carousel .owl-element").each((_, el) => {
            const anchor = $(el).find("a");
            const title = anchor.attr("title")?.trim() || "";
            const img = anchor.find("img");
            const imageUrl = img.attr("src") || "";
            // The views are inside the <div> after the <svg> in the <h1>
            const viewsDiv = anchor.find("h1 > div");
            const viewsText = viewsDiv.text().replace(/[^0-9]/g, "");
            const views = parseInt(viewsText, 10);
            const href = anchor.attr("href") || "";
            const mangaId = decodeURIComponent(
                href.replace("/manga/", "").replace(/\/$/, ""),
            );
            items.push({
                type: "simpleCarouselItem",
                mangaId,
                title,
                imageUrl,
                subtitle: `${views.toLocaleString()} views`,
            });
        });
        return items;
    }

    /**
     * Parses the "Latest Translation" carousel for the discover section.
     * Returns items and a flag for next page.
     */
    async parseLatestTranslation(
        $: CheerioAPI,
        nextLabel: string = "Next",
    ): Promise<{ items: DiscoverSectionItem[]; hasNextPage: boolean }> {
        const items: DiscoverSectionItem[] = [];
        $(".updates-element.border-box").each((_, el) => {
            const img = $(el).find(".thumb a img");
            const imageUrl = img.attr("src") || "";
            const titleAnchor = $(el).find(".updates-element-info h2 a");
            const title =
                titleAnchor.attr("title")?.trim() || titleAnchor.text().trim();
            // Top chapter (first .chap-date block)
            const firstChapDate = $(el).find(".chap-date").first();
            const topChapter = firstChapDate
                .find("div")
                .first()
                .find("a")
                .first()
                .text()
                .trim();
            const href = titleAnchor.attr("href") || "";
            const mangaId = decodeURIComponent(
                href.replace("/manga/", "").replace(/\/$/, ""),
            );
            items.push({
                type: "simpleCarouselItem",
                mangaId,
                title,
                subtitle: topChapter,
                imageUrl: imageUrl,
            });
        });
        // Only check for next page if there are items
        let hasNextPage = false;
        if (items.length > 0) {
            $(".pagination a").each((_, el) => {
                if ($(el).text().trim() === nextLabel) {
                    hasNextPage = true;
                }
            });
        }
        // If no items, force hasNextPage to false
        return { items, hasNextPage };
    }

    /**
     * Parses quick search results (when searching by title).
     */
    async parseQuickSearch($: CheerioAPI): Promise<SearchResultItem[]> {
        const items: SearchResultItem[] = [];
        // Each result is an <a href="/manga/..."> containing a <li>
        $('a[href^="/manga/"]').each((_, el) => {
            const anchor = $(el);
            const li = anchor.find("li");
            const img = li.find("img");
            const imageUrl = img.attr("src") || "";
            const rightDiv = li.find(".seach-right");
            const title = rightDiv.find("div").first().text().trim();
            // The second div inside .seach-right contains the views
            const viewsDiv = rightDiv.find("div").eq(1);
            const viewsText = viewsDiv.text().replace(/[^0-9]/g, "");
            const views = viewsText || "";
            // Use href as mangaId, sanitized
            const href = anchor.attr("href") || "";
            const mangaId = decodeURIComponent(
                href.replace("/manga/", "").replace(/\/$/, ""),
            );
            if (title && mangaId) {
                items.push({
                    mangaId,
                    title,
                    imageUrl,
                    views,
                });
            }
        });
        return items;
    }

    /**
     * Parses advanced search results (with filters/sorting).
     */
    async parseAdvancedSearchDefault(
        $: CheerioAPI,
    ): Promise<SearchResultItem[]> {
        const items: SearchResultItem[] = [];
        $(".advanced-element").each((_, el) => {
            const anchor = $(el).find('a[href^="/manga/"]');
            const title = anchor.attr("title")?.trim() || "";
            const img = anchor.find("img");
            const imageUrl = img.attr("src") || "";
            // The views are inside the <div> after the <svg> in the <h1>
            const viewsDiv = anchor.find("h1 > div");
            const viewsText = viewsDiv.text().replace(/[^0-9]/g, "");
            const views = viewsText || "";
            // Use href as mangaId, sanitized
            const href = anchor.attr("href") || "";
            const mangaId = decodeURIComponent(
                href.replace("/manga/", "").replace(/\/$/, ""),
            );
            if (title && mangaId) {
                items.push({
                    mangaId,
                    title,
                    imageUrl,
                    views,
                });
            }
        });
        return items;
    }

    /**
     * Parses manga details and chapter list from the manga details page HTML.
     * Returns an object with all manga info and a list of chapters.
     */
    async parseMangaDetails($: CheerioAPI, mangaId: string) {
        // Decode mangaId to prevent double encoding
        let decodedMangaId = mangaId;
        try {
            decodedMangaId = decodeURIComponent(mangaId);
        } catch {
            // Use as-is if decode fails
        }

        // Title
        const title =
            $("h1.big-fat-titles").first().text().trim() || "No title";
        // Cover image
        const cover = $("#manga-page img").first().attr("src") || "";
        // Genres
        const genres: string[] = [];
        $(".genres-list li").each((_, el) => {
            const genre = $(el).text().trim();
            if (genre) genres.push(genre);
        });
        // Description
        const description =
            $(".white-font").first().text().trim() ||
            "No description available";
        // Author
        let author = "";
        $("#manga-info-stats .flex-row").each((_, el) => {
            const label = $(el).find("li").first().text().trim();
            if (/author/i.test(label)) {
                author = $(el).find("li").eq(1).text().trim();
            }
        });
        if (!author || author.trim().toLowerCase().includes("updating"))
            author = ".";
        // Rating (divide by 100)
        let rating: number | undefined = undefined;
        $("#manga-info-stats .flex-row").each((_, el) => {
            const label = $(el).find("li").first().text().trim();
            if (/rating/i.test(label)) {
                const raw = $(el)
                    .find("li")
                    .last()
                    .text()
                    .replace(/[^0-9.]/g, "");
                if (raw) {
                    rating = parseFloat(raw) / 100;
                }
            }
        });
        // Status
        let status = "";
        $("#manga-info-stats .flex-row").each((_, el) => {
            const label = $(el).find("li").first().text().trim();
            if (/status/i.test(label)) {
                status = $(el).find("li").last().text().trim();
            }
        });
        // Chapters
        const chapters: { chapterId: string; title: string; date: string }[] =
            [];
        $("#chapters-list li a.chplinks")
            .filter((_, el) => {
                const text = $(el).text().trim();
                return text.startsWith("Chapter");
            })
            .each((_, el) => {
                const href = $(el).attr("href") || "";
                // Get the text content but exclude the span (date)
                const $el = $(el);
                const span = $el.find("span");
                const chapTitle = $el
                    .clone()
                    .children()
                    .remove()
                    .end()
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();
                const date = span.text().trim();
                // Only include if it's a valid chapter link
                if (
                    href &&
                    chapTitle &&
                    href.includes("/chaptered.php?manga=")
                ) {
                    // Convert URL to reading format
                    const chapterMatch = href.match(/chapter=(\d+)/);
                    if (chapterMatch) {
                        const chapterNumber = chapterMatch[1];
                        const readingUrl = `/title/${decodedMangaId}/chapter/${chapterNumber}/1`;
                        chapters.push({
                            chapterId: readingUrl,
                            title: chapTitle,
                            date,
                        });
                    } else {
                        chapters.push({
                            chapterId: href,
                            title: chapTitle,
                            date,
                        });
                    }
                }
            });
        // Defensive: If title or mangaId is missing, throw an error
        if (!title || !decodedMangaId) {
            throw new Error(
                `[MangaDemon][parseMangaDetails] Missing required field: title or mangaId. title="${title}", mangaId="${decodedMangaId}"`,
            );
        }

        return {
            mangaId: decodedMangaId,
            title,
            author,
            genres,
            description,
            status,
            rating,
            cover,
            chapters,
        };
    }

    /**
     * Parses the chapter list from the manga details page HTML.
     * Returns an array of Chapter objects for Paperback.
     */
    parseChapterList(
        $: CheerioAPI,
        sourceManga: import("@paperback/types").SourceManga,
    ): import("@paperback/types").Chapter[] {
        const chapters: import("@paperback/types").Chapter[] = [];

        // Based on the actual website structure, chapters are in #chapters-list with class chplinks
        // But we need to exclude date links and only get chapter links
        // The chapter links contain "Chapter" in their text, while date links contain dates
        const allChapterLinks = $("#chapters-list li a.chplinks");

        const chapterElements = allChapterLinks.filter((_, el) => {
            const text = $(el).text().trim();
            return text.startsWith("Chapter");
        });

        if (chapterElements.length > 0) {
            chapterElements.each((index, el) => {
                const href = $(el).attr("href") || "";
                // Get the text content but exclude the span (date)
                const $el = $(el);
                const span = $el.find("span");
                const title = $el
                    .clone()
                    .children()
                    .remove()
                    .end()
                    .text()
                    .replace(/\s+/g, " ")
                    .trim();
                const date = span.text().trim();

                // Extract chapter number
                const chapterMatch = href.match(/chapter=(\d+)/);
                if (chapterMatch) {
                    const chapterNumber = chapterMatch[1];
                    const chapNum = parseFloat(chapterNumber);

                    // Create proper Chapter object
                    chapters.push({
                        chapterId: href, // Use the full href as chapterId
                        sourceManga: sourceManga,
                        langCode: "en", // Default language
                        chapNum: chapNum,
                        title: title,
                        publishDate: this.parseDate(date),
                        sortingIndex: chapterElements.length - index, // Reverse order so latest chapters are first
                    });
                }
            });
        } else {
            // Fallback: try alternative selectors only if main selector found zero chapters
            const fallbackSelectors = [
                "#chapters-list a.chplinks",
                "#chapters-list li a",
                ".chapters-list li a.chplinks",
                ".chapters-list a.chplinks",
            ];
            for (const selector of fallbackSelectors) {
                const elements = $(selector).filter((_, el) => {
                    const text = $(el).text().trim();
                    return text.startsWith("Chapter");
                });
                if (elements.length > 0) {
                    elements.each((index, el) => {
                        const href = $(el).attr("href") || "";
                        // Get the text content but exclude the span (date)
                        const $el = $(el);
                        const span = $el.find("span");
                        const title = $el
                            .clone()
                            .children()
                            .remove()
                            .end()
                            .text()
                            .replace(/\s+/g, " ")
                            .trim();
                        const date = span.text().trim();
                        if (
                            href &&
                            title &&
                            href.includes("/chaptered.php?manga=")
                        ) {
                            // Try to extract chapter number from href
                            const chapterMatch = href.match(/chapter=(\d+)/);
                            const chapNum = chapterMatch
                                ? parseFloat(chapterMatch[1])
                                : 0;
                            chapters.push({
                                chapterId: href,
                                sourceManga: sourceManga,
                                langCode: "en",
                                chapNum: chapNum,
                                title: title,
                                publishDate: this.parseDate(date),
                                sortingIndex: elements.length - index,
                            });
                        }
                    });
                    break;
                }
            }
        }

        return chapters;
    }

    /**
     * Parses chapter pages from the chapter reading page HTML.
     * Uses JavaScript-inspired approach that mirrors the website's own fallback logic.
     * Handles multiple domains and file types discovered through analysis.
     */
    async parseChapterPages(
        $: CheerioAPI,
        chapterUrl?: string,
    ): Promise<string[]> {
        // If chapterUrl indicates a novel, extract text paragraphs
        if (chapterUrl && chapterUrl.includes("/reader/novel/")) {
            const paragraphs: string[] = [];
            $("#nov-chap-container p").each((_, el) => {
                const text = $(el).text().trim();
                if (text) paragraphs.push(text);
            });
            return paragraphs;
        }

        // JavaScript-inspired manga image extraction
        const pages: string[] = [];

        // Get all images with class 'imgholder' (mirrors website's selector)
        const images = $("img.imgholder");

        // Collect all images in order (Paperback will handle fallbacks automatically)
        images.each((_, el) => {
            const src = $(el).attr("src");
            if (src && src.trim()) {
                pages.push(src);
            }
        });

        // Filter and deduplicate images based on discovered patterns
        const validDomains = [
            "mangareadon.org",
            "cdn.demoniclibs.com",
            "demoniclibs.com",
            "librarydm.com",
        ];

        const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];

        const filteredPages = [...new Set(pages)].filter((src) => {
            // Check if it's a valid domain
            const hasValidDomain = validDomains.some((domain) =>
                src.includes(domain),
            );

            // Check if it has a valid image extension
            const hasValidExtension = validExtensions.some((ext) =>
                src.includes(ext),
            );

            // Exclude ads and non-content images
            const isNotAd =
                !src.includes("free_ads") &&
                !src.includes("logo") &&
                !src.includes("banner") &&
                !src.includes("advertisement");

            return hasValidDomain && hasValidExtension && isNotAd;
        });

        return filteredPages;
    }

    /**
     * Helper method to parse date strings into Date objects.
     * Returns undefined if parsing fails.
     */
    private parseDate(dateString: string): Date | undefined {
        if (!dateString || dateString.trim() === "") {
            return undefined;
        }

        try {
            // Try to parse common date formats
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date;
            }

            // If standard parsing fails, return undefined
            return undefined;
        } catch {
            return undefined;
        }
    }
}
