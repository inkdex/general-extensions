import {
    Chapter,
    ChapterDetails,
    ContentRating,
    DiscoverSectionItem,
    MangaInfo,
    SearchResultItem,
    SourceManga,
    Tag,
    TagSection,
} from "@paperback/types";
import { CheerioAPI } from "cheerio";
import { URLBuilder } from "../utils/url-builder/base";

export const parseMangaDetails = (
    $: CheerioAPI,
    mangaId: string,
    sourceUrl: string,
): SourceManga => {
    const primaryTitle = Application.decodeHTMLEntities(
        $(".novel-title").text().trim(),
    );

    const secondaryTitles: string[] = [];
    secondaryTitles.push(
        Application.decodeHTMLEntities(
            $("img", "div.fixed-img").attr("alt")?.trim() ?? "",
        ),
    );
    const altTitles = $("h2.alternative-title.text1row", "div.main-head")
        .text()
        .trim()
        .split(",");
    for (const title of altTitles) {
        secondaryTitles.push(Application.decodeHTMLEntities(title));
    }

    const image = $("img", "div.fixed-img").attr("data-src") ?? "";
    const author = $("span", "div.author").next().text().trim();

    const description = Application.decodeHTMLEntities(
        $(".description").first().text().trim(),
    ).split("The Summary is");

    const arrayTags: Tag[] = [];
    for (const tag of $("li", "div.categories").toArray()) {
        const title = $(tag).text().trim();
        const id = title.replaceAll(" ", "_");

        if (!id || !title) continue;
        arrayTags.push({ id: id, title: title });
    }
    const tagSections: TagSection[] = [
        { id: "0", title: "genres", tags: arrayTags },
    ];

    const rawStatus = $("small:contains(Status)", "div.header-stats")
        .prev()
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

    return {
        mangaId: mangaId,
        mangaInfo: {
            thumbnailUrl: image,
            synopsis: description[1] ? description[1] : description.join(""),
            primaryTitle: primaryTitle,
            secondaryTitles: secondaryTitles,
            contentRating: ContentRating.EVERYONE,
            status: status,
            author: author,
            tagGroups: tagSections,
            shareUrl: new URLBuilder(sourceUrl)
                .addPath("manga")
                .addPath(mangaId)
                .build(),
        } as MangaInfo,
    } as SourceManga;
};

export const parseChapters = (
    $: CheerioAPI,
    sourceManga: SourceManga,
): Chapter[] => {
    const chapters: Chapter[] = [];
    let sortingIndex = chapters.length - 1;

    for (const chapter of $("li", "ul.chapter-list").toArray()) {
        const title = Application.decodeHTMLEntities(
            $("strong.chapter-title", chapter).text().trim(),
        );
        const chapterId: string =
            $("a", chapter).attr("href")?.replace(/\/$/, "").split("/").pop() ??
            "";
        if (!chapterId) continue;

        const datePieces =
            $("time.chapter-update", chapter).attr("datetime")?.split(",") ??
            [];
        const date = new Date(
            String(`${datePieces[0] ?? ""}, ${datePieces[1] ?? ""}`),
        );
        const chapNumRegex = /(\d+)(?:[-.]\d+)?/.exec(title);

        let chapNum = 0;
        if (chapNumRegex?.[1]) {
            let chapRegex = chapNumRegex[1];
            if (chapRegex.includes("-"))
                chapRegex = chapRegex.replace("-", ".");
            chapNum = Number(chapRegex);
        }

        chapters.push({
            chapterId: chapterId,
            sourceManga: sourceManga,
            langCode: "🇬🇧",
            chapNum: chapNum,
            title: isNaN(chapNum) ? title : "", // Display original title if chapNum parsing fails
            volume: 0,
            publishDate: date,
            sortingIndex,
        });
        sortingIndex--;
    }

    if (chapters.length == 0) {
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
    for (const img of $("img", "div#chapter-reader").toArray()) {
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

    for (const obj of $("li.novel-item", "ul.novel-list").toArray()) {
        const image: string = $("img", obj).first().attr("data-src") ?? "";
        const title: string = $("img", obj).first().attr("alt") ?? "";
        const id =
            $("a", obj).attr("href")?.replace(/\/$/, "").split("/").pop() ?? "";
        const getChapter = $("div.novel-stats > strong", obj).text().trim();

        const chapNumRegex = /(\d+\.?\d?)+/.exec(getChapter);
        let chapNum = 0;
        if (chapNumRegex?.[1]) chapNum = Number(chapNumRegex[1]);

        const subtitle = chapNum
            ? `Chapter ${chapNum.toString()}`
            : "Chapter N/A";

        if (!id || !title || collectedIds.includes(id)) continue;
        manga.push({
            type: "simpleCarouselItem",
            mangaId: id,
            title: Application.decodeHTMLEntities(title),
            imageUrl: image,
            subtitle: Application.decodeHTMLEntities(subtitle),
            contentRating: ContentRating.EVERYONE,
        });
        collectedIds.push(id);
    }

    return manga;
};

export const parseGenreTags = ($: CheerioAPI): TagSection[] => {
    const arrayTags: Tag[] = [];
    for (const tag of $(".genre-select-i label").toArray()) {
        const title = $(tag).attr("for") ?? "";

        if (!title) continue;
        arrayTags.push({ id: title.replaceAll(" ", "_"), title: title });
    }

    const tagSections: TagSection[] = [
        { id: "genres", title: "genres", tags: arrayTags },
    ];
    return tagSections;
};

export const parseSearch = (
    $: CheerioAPI,
    baseUrl: string,
): SearchResultItem[] => {
    const mangas: SearchResultItem[] = [];
    for (const obj of $("li.novel-item", "ul.novel-list").toArray()) {
        let image: string = $("img", obj).first().attr("data-src") ?? "";
        if (image.startsWith("/")) image = baseUrl + image;

        const title: string = $("img", obj).first().attr("alt") ?? "";
        const id =
            $("a", obj).attr("href")?.replace(/\/$/, "").split("/").pop() ?? "";
        const getChapter = $("div.novel-stats > strong", obj).text().trim();
        const chapNumRegex = /(\d+\.?\d?)+/.exec(getChapter);

        let chapNum = 0;
        if (chapNumRegex?.[1]) chapNum = Number(chapNumRegex[1]);

        const subtitle = chapNum
            ? `Chapter ' ${chapNum.toString()}`
            : "Chapter N/A";
        if (!id || !title) continue;

        mangas.push({
            mangaId: id,
            title: Application.decodeHTMLEntities(title),
            imageUrl: image,
            subtitle: Application.decodeHTMLEntities(subtitle),
            contentRating: ContentRating.EVERYONE,
        });
    }
    return mangas;
};

export const isLastPage = ($: CheerioAPI): boolean => {
    let isLast = false;

    const pages = $(".mg-pagination-table")
        .first()
        .remove()
        .text()
        .trim()
        .split(" / ");

    const currentPage = Number(pages[0]);
    const lastPage = Number(pages[1]);

    if (currentPage >= lastPage) isLast = true;
    return isLast;
};
