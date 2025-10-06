import {
    Chapter,
    ChapterDetails,
    ContentRating,
    DiscoverSectionItem,
    MangaInfo,
    PagedResults,
    Request,
    SearchResultItem,
    SourceManga,
    Tag,
    TagSection,
    URL,
} from "@paperback/types";
import type { CheerioAPI } from "cheerio";
import { SCYLLA_COMICS_DOMAIN } from "./main";
import { Metadata, TIME_MULTIPLIERS } from "./models";
import { fetchCheerio } from "./network";

export function parseMangaDetails(
    $: CheerioAPI,
    mangaId: string,
    sourceUrl: string,
): SourceManga {
    // title
    const primaryTitle = Application.decodeHTMLEntities(
        $("h2.text-2xl.font-bold")
            .clone()
            .children("span")
            .remove()
            .end()
            .text()
            .trim() || $("h1.post-title, h1").first().text().trim(),
    );

    // secondary/alt title i dont see where paperback displays this information
    const secondaryTitles: string[] = [];
    const altFromImg = $("img.lazyload").attr("alt")?.trim();
    if (altFromImg)
        secondaryTitles.push(Application.decodeHTMLEntities(altFromImg));

    const altTitle = $(
        "div.flex.gap-1:has(span:contains('Alternative Titles')) span",
    )
        .last()
        .text()
        .trim();
    if (altTitle)
        secondaryTitles.push(Application.decodeHTMLEntities(altTitle));

    // thumbnail
    let image =
        $("div.fixed-img img.lazyload").attr("data-src") ??
        $("section img").first().attr("src") ??
        "";
    if (image.startsWith("/")) image = sourceUrl + image;
    image = encodeURI(image);

    // author
    const author =
        $("p:has(span:contains('Author')) span.capitalize")
            .first()
            .text()
            .trim() ||
        $("div:has(span:contains('Author')) a").first().text().trim();

    // description
    const description = Application.decodeHTMLEntities(
        $("div.flex.flex-col.gap-1 > p")
            .map((_, el) => $(el).text().trim())
            .get()
            .join("\n\n"),
    );

    // tags/genres
    const arrayTags: Tag[] = [];
    const seen = new Set<string>();
    for (const tag of $("div.flex.flex-wrap.gap-1 a").toArray()) {
        const title = $(tag).text().trim();
        if (!title || seen.has(title)) continue;
        seen.add(title);
        arrayTags.push({ id: title.replaceAll(" ", "_"), title });
    }
    const tagSections: TagSection[] = [
        { id: "0", title: "genres", tags: arrayTags },
    ];

    // ongoing/completed status
    const rawStatus = $("p:has(span:contains('Status')) span.capitalize")
        .last()
        .text()
        .trim();
    let status = "Ongoing";
    if (rawStatus.toUpperCase().includes("COMPLETE")) status = "Completed";

    return {
        mangaId,
        mangaInfo: {
            thumbnailUrl: image,
            synopsis: description,
            primaryTitle,
            secondaryTitles,
            contentRating: ContentRating.ADULT,
            status,
            author,
            tagGroups: tagSections,
            shareUrl: new URL(sourceUrl)
                .addPathComponent("manga")
                .addPathComponent(mangaId)
                .toString(),
        } as MangaInfo,
    } as SourceManga;
}

export function parseChapters(
    $: CheerioAPI,
    sourceManga: SourceManga,
): Chapter[] {
    const chapters: Chapter[] = [];
    // chapter list
    const nodeArray = $("#chapters-list a").toArray();
    let nodesProcessed = 0;

    for (const obj of nodeArray) {
        const sortingIndex = nodeArray.length - nodesProcessed++;

        // chapter id from url
        const parentLink = $(obj).attr("href") ?? "";
        const chapterId = parentLink.replace(/\/$/, "").split("/").pop() ?? "";
        if (!chapterId || chapterId === "#") {
            throw new Error(
                `Could not parse out ID when getting chapters for mangaId: ${sourceManga.mangaId}, parsedId: ${chapterId}`,
            );
        }

        // chapter name/title
        const chapName = $("div.flex > span", obj).first().text().trim() ?? "";

        // chapter number from title or sort index
        const chapNumRegex = parentLink.match(
            /(?:chapter|ch.*?)(\d+\.?\d?(?:[-_]\d+)?)|(\d+\.?\d?(?:[-_]\d+)?)$/,
        );
        let chapNum: number = 0;
        if (chapNumRegex) {
            const rawNum =
                chapNumRegex[1]?.replace(/[-_]/g, ".") ??
                chapNumRegex[2] ??
                "0";
            chapNum = parseFloat(rawNum) || 0;
        }

        // chapter release date
        const dateText = $(
            "div.flex.justify-between.gap-3 > span.text-gray-500",
            obj,
        )
            .last()
            .text()
            .trim();
        const date = parseRelativeDate(dateText);

        chapters.push({
            chapterId,
            sourceManga,
            langCode: "🇬🇧",
            chapNum,
            title: chapName ? Application.decodeHTMLEntities(chapName) : "",
            volume: 0,
            publishDate: date,
            sortingIndex,
        });
    }

    if (chapters.length === 0) {
        throw new Error(
            `Couldn't find any chapters for mangaId: ${sourceManga.mangaId}!`,
        );
    }

    return chapters;
}

export function parseChapterDetails(
    $: CheerioAPI,
    chapter: Chapter,
): ChapterDetails {
    const pages: string[] = [];
    for (const img of $("img", "div#chapter-container").toArray()) {
        let image = $(img).attr("src") ?? "";
        if (!image) image = $(img).attr("data-src") ?? "";
        if (!image) continue;
        pages.push(image);
    }

    return {
        id: chapter.chapterId,
        mangaId: chapter.sourceManga.mangaId,
        pages: pages,
    };
}

export function parseViewMore(
    $: CheerioAPI,
    selector = "div#card-real",
    sectionId?: string,
): DiscoverSectionItem[] {
    const out: DiscoverSectionItem[] = [];
    const seen = new Set<string>();
    const container = $(selector);

    const anchors = container.find("a[href*='/manga/']").toArray();
    for (const a of anchors) {
        const href = $(a).attr("href") ?? "";
        const id = href.replace(/\/$/, "").split("/").pop() ?? "";
        if (!id || seen.has(id)) continue;

        let image =
            $(a).find("img[data-src]").attr("data-src") ??
            $(a).find("img").attr("src") ??
            "";
        if (!image) {
            const slide = $(a).closest("swiper-slide");
            if (slide.length) {
                image =
                    slide.find("img[data-src]").attr("data-src") ??
                    slide.find("img").attr("src") ??
                    "";
            }
        }
        if (image.startsWith("/")) image = SCYLLA_COMICS_DOMAIN + image;

        let title =
            $(a).find("img").attr("alt") ??
            $(a).find("h2").first().text().trim() ??
            "";
        if (!title) {
            const slide = $(a).closest("swiper-slide");
            if (slide.length) {
                title =
                    slide.find("h2").first().text().trim() ||
                    slide.find("img").attr("alt") ||
                    "";
            }
        }
        if (!title) continue;

        let subtitle = "";
        if (sectionId === "recent_chapters") {
            const cardParent = $(a).closest("div.flex.flex-col.gap-2");
            const chapterBlock = cardParent
                .children("div.flex.flex-col")
                .last();
            const chapterText = chapterBlock.find("a b").first().text().trim();
            const timeAgo = chapterBlock
                .find("span.text-xs")
                .first()
                .text()
                .trim();

            if (chapterText) {
                subtitle = `Chp ${chapterText}${timeAgo ? ` • ${timeAgo}` : ""}`;
            }
        }

        out.push({
            type: "simpleCarouselItem",
            mangaId: id,
            title: Application.decodeHTMLEntities(title),
            imageUrl: image,
            subtitle,
            contentRating: ContentRating.ADULT,
        });

        seen.add(id);
    }

    // fallback for featured section which uses a swiper slider instead of cards
    if (out.length === 0) {
        container.find("swiper-slide").each((_, slide) => {
            const $slide = $(slide);
            const href = $slide.find("a[href*='/manga/']").attr("href") ?? "";
            const id = href.replace(/\/$/, "").split("/").pop() ?? "";
            if (!id || seen.has(id)) return;

            let image =
                $slide.find("img[data-src]").attr("data-src") ??
                $slide.find("img").attr("src") ??
                "";
            if (image.startsWith("/")) image = SCYLLA_COMICS_DOMAIN + image;

            const title =
                $slide.find("h2").first().text().trim() ||
                $slide.find("img").attr("alt") ||
                "";
            if (!title) return;

            out.push({
                type: "simpleCarouselItem",
                mangaId: id,
                title: Application.decodeHTMLEntities(title),
                imageUrl: image,
                subtitle: "",
                contentRating: ContentRating.ADULT,
            });

            seen.add(id);
        });
    }

    return out;
}

// TODO: move pagination logic to a helper?
export async function getFeaturedSectionItems(): Promise<
    PagedResults<DiscoverSectionItem>
> {
    const request: Request = { url: SCYLLA_COMICS_DOMAIN, method: "GET" };
    const $ = await fetchCheerio(request);
    const items = parseViewMore($, "#home-slider", "featured");
    return { items, metadata: undefined };
}

export async function getMostPopularSectionItems(
    metadata?: Metadata,
): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;

    // page 1 = homepage carousel
    if (page === 1) {
        const request: Request = { url: SCYLLA_COMICS_DOMAIN, method: "GET" };
        const $ = await fetchCheerio(request);
        const items = parseViewMore($, "#popular-cards", "most_popular");
        return { items, metadata: { page: 2 } };
    }

    // page >= 2 (offset because page 1 was carousel)
    const request: Request = {
        url: `${SCYLLA_COMICS_DOMAIN}/manga?page=${page - 1}`,
        method: "GET",
    };
    const $ = await fetchCheerio(request);

    const items = parseViewMore($, "div#card-real", "most_popular");

    const currentPage =
        parseInt(
            $("li.pagination-link.pagination-active span").text().trim(),
        ) || page - 1;
    const nextPageExists =
        $("li.pagination-link").filter((_, el) => {
            const txt = $(el).text().trim();
            return /^\d+$/.test(txt) && parseInt(txt) === currentPage + 1;
        }).length > 0;

    return {
        items,
        metadata: nextPageExists ? { page: page + 1 } : undefined,
    };
}

export async function getRecentlyAddedSectionItems(
    metadata?: Metadata,
): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const request: Request = {
        url: `${SCYLLA_COMICS_DOMAIN}/manga?page=${page}`,
        method: "GET",
    };
    const $ = await fetchCheerio(request);

    const items = parseViewMore($, "div#card-real", "recently_added");

    const currentPage =
        parseInt(
            $("li.pagination-link.pagination-active span").text().trim(),
        ) || page;
    const nextPageExists =
        $("li.pagination-link").filter((_, el) => {
            const txt = $(el).text().trim();
            return /^\d+$/.test(txt) && parseInt(txt) === currentPage + 1;
        }).length > 0;

    return {
        items,
        metadata: nextPageExists ? { page: currentPage + 1 } : undefined,
    };
}

export async function getRecentChaptersSectionItems(
    metadata?: Metadata,
): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const request: Request = {
        url:
            page > 1
                ? `${SCYLLA_COMICS_DOMAIN}/?page=${page}`
                : SCYLLA_COMICS_DOMAIN,
        method: "GET",
    };
    const $ = await fetchCheerio(request);

    const items = parseViewMore($, "section:last-of-type", "recent_chapters");

    const currentPage =
        parseInt(
            $("li.pagination-link.pagination-active span").text().trim(),
        ) || page;
    const nextPageExists =
        $("li.pagination-link").filter((_, el) => {
            const txt = $(el).text().trim();
            return /^\d+$/.test(txt) && parseInt(txt) === currentPage + 1;
        }).length > 0;

    return {
        items,
        metadata: nextPageExists ? { page: currentPage + 1 } : undefined,
    };
}

export function parseGenreTags($: CheerioAPI): TagSection[] {
    const arrayTags: Tag[] = [];

    $("div.flex.items-center.gap-2").each((_, el) => {
        const title = Application.decodeHTMLEntities(
            $("label", el).text().trim(),
        );
        const rawId = $("input", el).attr("id") ?? title;

        if (!title || !rawId) return;

        const id = Application.decodeHTMLEntities(rawId).replace(
            /[^a-zA-Z0-9_-]/g,
            "_",
        ); // sanitize for Paperback

        arrayTags.push({ id, title });
    });

    return [{ id: "genres", title: "Genres", tags: arrayTags }];
}

export function parseSearch(
    $: CheerioAPI,
    baseUrl: string,
): SearchResultItem[] {
    const mangas: SearchResultItem[] = [];

    $("div#card-real").each((_, obj) => {
        let image: string = $("img.lazyload", obj).attr("data-src") ?? "";
        if (image.startsWith("/")) image = baseUrl + image;

        const title: string =
            $("img.lazyload", obj).attr("alt") ??
            $("h2.text-sm.font-semibold", obj).text().trim() ??
            "";

        const id =
            $("a", obj).attr("href")?.replace(/\/$/, "").split("/").pop() ?? "";

        if (!id || !title) return;

        mangas.push({
            mangaId: id,
            title: Application.decodeHTMLEntities(title),
            imageUrl: image,
            subtitle: "", // scylla doesnt provide chapter details for titles in search
            contentRating: ContentRating.ADULT,
        });
    });

    return mangas;
}

export function isLastPage($: CheerioAPI): boolean {
    let isLast = false;

    const pageText = $("nav h3").text().trim();
    const match = /Page\s+(\d+)\s+of\s+(\d+)/i.exec(pageText);

    if (!match) {
        isLast = true;
    } else {
        const currentPage = Number(match[1]);
        const lastPage = Number(match[2]);
        if (currentPage >= lastPage) isLast = true;
    }

    return isLast;
}

function parseRelativeDate(dateStr: string): Date {
    const now = Date.now();
    const upper = dateStr.toUpperCase();

    if (upper.includes("JUST NOW") || upper.includes("LESS THAN AN HOUR")) {
        return new Date(now);
    }
    if (upper.includes("YESTERDAY")) {
        return new Date(now - 86400000);
    }

    const match =
        /(\d+)\s*(Y|YR|YEAR|YEARS|MO|MOS|MONTH|MONTHS|W|WEEK|WEEKS|D|DAY|DAYS|H|HR|HOUR|HOURS|M|MIN|MINUTE|MINUTES|S|SEC|SECOND|SECONDS)/i.exec(
            upper,
        );

    if (match) {
        const num = parseInt(match[1], 10);
        const unit = match[2];
        const ms = TIME_MULTIPLIERS[unit] ?? 0;
        return new Date(now - num * ms);
    }

    // fallback try to parse as absolute date string
    return new Date(dateStr);
}
