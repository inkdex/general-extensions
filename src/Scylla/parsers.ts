import {
    Chapter,
    ChapterDetails,
    ContentRating,
    DiscoverSectionItem,
    MangaInfo,
    URL as PBURL,
    SearchResultItem,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
import { CheerioAPI } from "cheerio";
import { TIME_MULTIPLIERS } from "./models";

export const parseMangaDetails = (
    $: CheerioAPI,
    mangaId: string,
    sourceUrl: string,
): SourceManga => {
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
            shareUrl: new PBURL(sourceUrl)
                .addPathComponent("manga")
                .addPathComponent(mangaId)
                .toString(),
        } as MangaInfo,
    } as SourceManga;
};

export const parseChapters = (
    $: CheerioAPI,
    sourceManga: SourceManga,
): Chapter[] => {
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
};

export const parseChapterDetails = (
    $: CheerioAPI,
    chapter: Chapter,
): ChapterDetails => {
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
};

export const parseViewMore = ($: CheerioAPI): DiscoverSectionItem[] => {
    const manga: DiscoverSectionItem[] = [];
    const collectedIds: string[] = [];

    $("div#card-real").each((_, obj) => {
        let image: string =
            $("img.lazyload", obj).attr("data-src") ??
            $("img", obj).attr("src") ??
            "";
        if (image.startsWith("/")) image = "https://scyllacomics.xyz" + image;

        const title: string =
            $("img.lazyload", obj).attr("alt") ??
            $("h2.text-sm.font-semibold", obj).text().trim() ??
            "";

        const id =
            $("a", obj).attr("href")?.replace(/\/$/, "").split("/").pop() ?? "";

        if (!id || !title || collectedIds.includes(id)) return;

        manga.push({
            type: "simpleCarouselItem",
            mangaId: id,
            title: Application.decodeHTMLEntities(title),
            imageUrl: image,
            subtitle: "",
            contentRating: ContentRating.ADULT,
        });

        collectedIds.push(id);
    });

    return manga;
};

export const parseGenreTags = ($: CheerioAPI): TagSection[] => {
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
};

export const parseSearch = (
    $: CheerioAPI,
    baseUrl: string,
): SearchResultItem[] => {
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
};

export const isLastPage = ($: CheerioAPI): boolean => {
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
};

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
