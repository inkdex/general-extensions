import {
    Chapter,
    ChapterDetails,
    ContentRating,
    DiscoverSectionItem,
    DiscoverSectionType,
    MangaInfo,
    SearchResultItem,
    SourceManga,
    TagSection,
} from "@paperback/types";
import { URLBuilder } from "../utils/url-builder/array-query-variant";
import type {
    ChapterData,
    ChapterFilter,
    ChapterImages,
    ChapterList,
    Comic,
    Item,
    MangaDetails,
    SearchData,
} from "./models";
import { COMIC_TYPE_FILTER } from "./utils/filters";
import { getLanguageName } from "./utils/language";

export function parseCover(
    thumbnailUrl?: string,
    mdCovers: Comic["md_covers"] = [],
): string {
    const b2key = mdCovers[0]?.b2key;
    if (!b2key) return thumbnailUrl ?? "";

    const vol = mdCovers[0]?.vol ?? "";
    const lastSlashIndex = thumbnailUrl?.lastIndexOf("/");
    return lastSlashIndex !== undefined && lastSlashIndex !== -1
        ? thumbnailUrl!.substring(0, lastSlashIndex + 1) + `${b2key}#${vol}`
        : (thumbnailUrl ?? "");
}

export const parseMangaDetails = (
    data: MangaDetails,
    mangaId: string,
    baseUrl: string,
): SourceManga => {
    const { comic, authors, artists } = data;

    const titles: string[] = [
        comic.title,
        ...comic.md_titles.map((titleObj) => titleObj.title),
    ];

    const synopsis = Application.decodeHTMLEntities(comic.desc ?? "")
        .split("---")[0]
        .trim();

    const tagSections: TagSection[] = [];

    // Add type tag section
    const countryTitle = parseComicType(comic.country);
    if (countryTitle) {
        tagSections.push(
            ...parseTags(
                [{ slug: comic.country, name: countryTitle }],
                "type",
                "Type",
            ),
        );
    }

    // Add genre tag section
    tagSections.push(
        ...parseTags(
            comic.md_comic_md_genres.map((item) => item.md_genres),
            "genres",
            "Genres",
        ),
    );

    const bayesianRating = parseFloat(comic.bayesian_rating);
    const rating = isNaN(bayesianRating) ? undefined : bayesianRating / 10;

    const mangaInfo: MangaInfo = {
        thumbnailUrl: parseCover(comic.cover_url, comic.md_covers),
        synopsis,
        primaryTitle: titles[0],
        secondaryTitles: titles,
        contentRating: parseContentRating(comic.content_rating),
        status: parseComicStatus(comic.status),
        artist: artists.map((artists: Item) => artists.name).join(","),
        author: authors.map((author: Item) => author.name).join(","),
        rating,
        tagGroups: tagSections,
        shareUrl: new URLBuilder(baseUrl)
            .addPath("comic")
            .addPath(comic.slug)
            .build(),
    };

    return {
        mangaId,
        mangaInfo,
    };
};

export function parseChapters(
    data: ChapterList,
    sourceManga: SourceManga,
    filter: ChapterFilter,
): Chapter[] {
    const chaptersData = filterChapters(data.chapters, filter);
    let sortingIndex = chaptersData.length;

    return chaptersData.map((chapter) => {
        const chapNum = Number(chapter.chap);
        const volumeValue = Number(chapter.vol);
        const groups = chapter.group_name ?? [];

        // App handles 0 as no volume, and undefined as "Volume TBA"
        let volume: number | undefined = 0;
        if (chapter.vol !== null && filter.showVol && !isNaN(volumeValue)) {
            volume = volumeValue;
        } else if (chapter.vol === null && filter.showVol) {
            volume = undefined;
        }

        return {
            chapterId: chapter.hid,
            sourceManga,
            title: filter.showTitle && chapter.title ? `${chapter.title}` : "",
            chapNum: !isNaN(chapNum) ? chapNum : 0,
            sortingIndex: sortingIndex--,
            volume,
            publishDate: new Date(chapter.created_at),
            version: groups.join(","),
            langCode: getLanguageName(chapter.lang),
        };
    });
}

export function parseChapterSinceDate(
    chapters: Chapter[],
    sinceDate?: Date,
): { hasNewChapters: boolean; parsedChapters: Chapter[] } {
    if (sinceDate && chapters.length > 0) {
        // Check the first chapter in the page since they're sorted newest first
        const firstChapter = chapters[0];
        if (
            firstChapter?.publishDate &&
            firstChapter.publishDate <= sinceDate
        ) {
            // If first chapter is older than sinceDate, filter and signal we're done
            return {
                hasNewChapters: false,
                parsedChapters: chapters.filter(
                    (c) => c.publishDate && c.publishDate > sinceDate,
                ),
            };
        }
    }

    // Either no sinceDate, or all chapters are newer
    return { hasNewChapters: true, parsedChapters: chapters };
}

export const parseChapterDetails = (
    data: ChapterImages,
    chapter: Chapter,
): ChapterDetails => ({
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    pages: data.chapter.images
        .filter((image) => image.url)
        .map((image) => image.url),
});

export function parseTags(
    data: Item[],
    sectionId: string,
    sectionTitle: string,
): TagSection[] {
    const tags = data
        .filter((tag) => tag.slug && tag.name)
        .map((tag) => ({
            id: tag.slug,
            title: tag.name,
        }));

    return [
        {
            id: sectionId,
            title: sectionTitle,
            tags,
        },
    ];
}

export function parseSearch(data: SearchData[]): SearchResultItem[] {
    return data
        .filter((comic) => comic.hid)
        .map((comic) => ({
            imageUrl: comic.cover_url,
            title: Application.decodeHTMLEntities(comic.title),
            mangaId: comic.hid,
            subtitle: Application.decodeHTMLEntities(
                comic.last_chapter
                    ? `Chapter ${comic.last_chapter}`
                    : comic.title,
            ),
            contentRating: parseContentRating(comic.content_rating),
        }));
}

export function parseDiscoverSection(
    data: SearchData[],
    type: DiscoverSectionType,
): DiscoverSectionItem[] {
    return data
        .filter((comic) => comic.hid)
        .map((comic) => {
            const baseItem = {
                imageUrl: comic.cover_url,
                title: Application.decodeHTMLEntities(comic.title),
                mangaId: comic.hid,
                contentRating: parseContentRating(comic.content_rating),
            };

            switch (type) {
                case DiscoverSectionType.featured:
                    return { ...baseItem, type: "featuredCarouselItem" };
                case DiscoverSectionType.prominentCarousel:
                    return { ...baseItem, type: "prominentCarouselItem" };
                case DiscoverSectionType.simpleCarousel:
                    return {
                        ...baseItem,
                        subtitle: Application.decodeHTMLEntities(
                            comic.last_chapter
                                ? `Chapter ${comic.last_chapter}`
                                : comic.title,
                        ),
                        type: "simpleCarouselItem",
                    };
                default:
                    throw new Error(`Unknown discover section type: ${type}`);
            }
        });
}

function parseContentRating(contentRating: string): ContentRating {
    if (contentRating === "erotica") {
        return ContentRating.ADULT;
    }

    if (contentRating === "suggestive") {
        return ContentRating.MATURE;
    }

    return ContentRating.EVERYONE;
}

function parseComicType(country: string): string | undefined {
    return COMIC_TYPE_FILTER.find((filter) => filter.id === country)?.value;
}

function parseComicStatus(status: number): string {
    const comicStatusMap: Record<number, string> = {
        1: "ONGOING",
        2: "COMPLETED",
        3: "CANCELLED",
        4: "ON HIATUS",
    };

    return comicStatusMap[status] || "UNKNOWN";
}

function filterChapters(
    chapters: ChapterData[],
    filter: ChapterFilter,
): ChapterData[] {
    let filteredChapters = chapters;

    if (filter.hideUnreleasedChapters) {
        const currentDate = new Date();
        filteredChapters = filteredChapters.filter(
            (chapter) => new Date(chapter.publish_at) <= currentDate,
        );
    }

    if (filter.chapterScoreFiltering) {
        filteredChapters = filterByScore(filteredChapters);
    }

    return filteredChapters;
}

function filterByScore(chapters: ChapterData[]): ChapterData[] {
    const chapterMap = new Map<
        number,
        { score: number; chapter: ChapterData }
    >();

    chapters.forEach((chapter) => {
        const chapNum = Number(chapter.chap);
        const score = chapter.up_count - chapter.down_count;
        const existing = chapterMap.get(chapNum);

        if (!existing || score > existing.score) {
            chapterMap.set(chapNum, { score, chapter });
        }
    });

    return Array.from(chapterMap.values()).map((v) => v.chapter);
}
