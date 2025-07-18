import {
    Chapter,
    ChapterDetails,
    DiscoverSectionItem,
    SearchResultItem,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
import { CheerioAPI } from "cheerio";
import { decodeHTML } from "entities";
import { formatTagId, getShareUrl } from "./helpers";
import pbconfig from "./pbconfig";

export const parseMangaDetails = async (
    $: CheerioAPI,
    mangaId: string,
): Promise<SourceManga> => {
    const title = decodeHTML($("h1").first().text().trim());
    const image = $(".lazy").attr("data-src") ?? "";
    const description = decodeHTML($(".text-sm.text--secondary").text().trim());
    const parsedStatus = $('label:contains("Status")')
        .siblings()
        .first()
        .text()
        .trim();
    let status: string;
    switch (parsedStatus) {
        case "publishing":
            status = "Ongoing";
            break;
        case "finished":
            status = "Completed";
            break;
        case "discontinued":
            status = "Dropped";
            break;
        case "on hiatus":
            status = "Hiatus";
            break;
        default:
            status = "Unknown";
    }
    const genres: Tag[] = [];
    for (const genreObj of $('label:contains("Genres")').siblings().toArray()) {
        const genre = $(genreObj).text().trim();
        const id = formatTagId(genre);
        genres.push({ id, title: genre });
    }
    const tagSections: TagSection[] = [
        {
            id: "genres",
            title: "Genres",
            tags: genres,
        },
    ];
    return {
        mangaId: mangaId,
        mangaInfo: {
            primaryTitle: title,
            secondaryTitles: [title],
            status: status,
            tagGroups: tagSections,
            synopsis: description,
            thumbnailUrl: image,
            contentRating: pbconfig.contentRating,
            shareUrl: getShareUrl(mangaId),
        },
    };
};

export const parseChapters = (
    $: CheerioAPI,
    sourceManga: SourceManga,
): Chapter[] => {
    const chapters: Chapter[] = [];
    const arrChapters = $("#chapters a").toArray();
    let sortingIndex = 0;
    let hasVolume = false;
    for (const chapterObj of arrChapters) {
        const chapterId: string =
            $(chapterObj).attr("href")?.split("/")[2] ?? "";

        const title = $(chapterObj).text().trim();

        let chapNum = 0;
        let match = $(chapterObj)
            .text()
            .trim()
            .match(/Chapter (\d+)/);
        if (match && match[1]) {
            chapNum = parseFloat(match[1]);
        }
        let volume = 1;
        match = $(chapterObj)
            .text()
            .trim()
            .match(/Group (\d+)/);
        if (match && match[1]) {
            hasVolume = true;
            volume = parseInt(match[1]);
        }
        chapters.push({
            chapterId,
            title,
            chapNum,
            sortingIndex,
            langCode: "🇬🇧",
            volume: hasVolume ? volume : 0,
            sourceManga,
        });
        sortingIndex--;
    }
    if (chapters.length == 0) {
        throw new Error(
            `Couldn't find any chapters for mangaId: ${sourceManga.mangaId}`,
        );
    }
    return chapters;
};

export const parseChapterDetails = async (
    $: CheerioAPI,
    mangaId: string,
    chapterId: string,
): Promise<ChapterDetails> => {
    const pages: string[] = [];
    for (const pageObj of $("picture > img").get()) {
        const page =
            $(pageObj).attr("data-src") ?? $(pageObj).attr("src") ?? "";
        pages.push(encodeURI(page));
    }

    const chapterDetails = {
        id: chapterId,
        mangaId: mangaId,
        pages: pages,
    };
    return chapterDetails;
};

export const parseRecentSection = async (
    $: CheerioAPI,
): Promise<DiscoverSectionItem[]> => {
    const recentSectionArray: DiscoverSectionItem[] = [];
    for (const recentObj of $("> div", $(".grid-cols-2").first()).toArray()) {
        const id =
            $("a.text-secondary", recentObj).attr("href")?.split("/")[2] ?? "";
        const title = $("div a > div", recentObj).first().text().trim() ?? "";
        const imageUrl =
            $("a img", recentObj).attr("src") ??
            $("a img", recentObj).attr("data-src") ??
            "";
        const subtitle = $(".text-secondary", recentObj).text().trim() ?? "";
        const chapterId =
            $("a.relative.block").attr("href")?.split("/")[2] ?? "";

        recentSectionArray.push({
            imageUrl,
            title: decodeHTML(title),
            mangaId: id,
            subtitle: decodeHTML(subtitle),
            chapterId,
            type: "chapterUpdatesCarouselItem",
            contentRating: pbconfig.contentRating,
        });
    }
    return recentSectionArray;
};

export const parseTrendingSection = async (
    $: CheerioAPI,
): Promise<DiscoverSectionItem[]> => {
    const hotSectionArray: DiscoverSectionItem[] = [];
    for (const trendingObj of $("> div", $(".grid-cols-2").last()).toArray()) {
        const id =
            $("a.relative", trendingObj).attr("href")?.split("/")[2] ?? "";
        const title = $("div a > div", trendingObj).first().text().trim() ?? "";
        const imageUrl =
            $("a img", trendingObj).attr("src") ??
            $("a img", trendingObj).attr("data-src") ??
            "";
        const subtitle = $(".font-black", trendingObj).text().trim() ?? "";
        hotSectionArray.push({
            imageUrl,
            title: decodeHTML(title),
            subtitle: decodeHTML(subtitle),
            mangaId: id,
            type: "simpleCarouselItem",
            contentRating: pbconfig.contentRating,
        });
    }
    return hotSectionArray;
};

export const parseSearch = async (
    $: CheerioAPI,
): Promise<SearchResultItem[]> => {
    const itemArray: SearchResultItem[] = [];
    for (const item of $(".my-3.grid > div").toArray()) {
        const id = $("a", item).attr("href")?.split("/")[2] ?? "";
        if (id == "" || typeof id != "string") throw new Error("Id is empty");
        const title = $("div a", item).text().trim() ?? "";
        const image =
            $("a img", item).attr("src") ??
            $("a img", item).attr("data-src") ??
            "";
        const subtitle = $(".text-secondary", item).text().trim() ?? "";
        itemArray.push({
            imageUrl: image,
            title: decodeHTML(title),
            mangaId: id,
            subtitle: decodeHTML(subtitle),
            contentRating: pbconfig.contentRating,
        });
    }
    return itemArray;
};

export const parseTags = async ($: CheerioAPI): Promise<TagSection[]> => {
    const genres: Tag[] = [];
    for (const genreObj of $(".grid.gap-1 div").toArray()) {
        const title = $(genreObj).text().trim();
        let id = $("input", genreObj).attr("value") ?? title;
        id = formatTagId(id);
        genres.push({ id, title });
    }
    return [
        {
            id: "genre",
            title: "Genres",
            tags: genres,
        },
    ];
};
