import {
    type Chapter,
    type ChapterDetails,
    type DiscoverSectionItem,
    type SearchResultItem,
    type SourceManga,
    type Tag,
    type TagSection,
} from "@paperback/types";
import { type CheerioAPI } from "cheerio";
import { type Element } from "domhandler";
import { decodeHTML } from "entities";
import { formatTagId, getRating, getShareUrl } from "./helpers";
import {
    DEFAULT_LANGUAGE_CODE,
    TagSectionId,
    TagSectionTitle,
    type ChapterWithMetadata,
} from "./models";

const officialTranslationSvgStroke = "#d8b4fe";
export const parseMangaDetails = async (
    $: CheerioAPI,
    mangaId: string,
): Promise<SourceManga> => {
    const title = $("h1").first().text().trim();
    const image = $("picture > img").attr("src") ?? "";
    const description = decodeHTML($(".whitespace-pre-wrap").text().trim());
    const authors: string[] = [];
    for (const authorObj of $('strong:contains("Author")')
        .siblings("span")
        .toArray()) {
        const author = $("a", authorObj).text().trim();
        if (!author) continue;
        authors.push(author);
    }
    const author = authors.join(", ");
    const parsedStatus = $('strong:contains("Status")').next().text().trim();
    let status: string;
    switch (parsedStatus) {
        case "Ongoing":
            status = "Ongoing";
            break;
        case "Complete":
            status = "Completed";
            break;
        case "Canceled":
            status = "Dropped";
            break;
        case "Hiatus":
            status = "Hiatus";
            break;
        default:
            status = "Unknown";
    }
    const genres: Tag[] = [];
    for (const genreObj of $(
        "a",
        $('strong:contains("Tags(s)")').siblings(),
    ).toArray()) {
        const genre = $(genreObj).text().trim();
        const id = formatTagId(genre);
        genres.push({ id, title: genre });
    }
    const isAdultContent = $('strong:contains("Adult Content")')
        .next()
        .text()
        .trim();
    const tagSections: TagSection[] = [
        {
            id: TagSectionId.Genres,
            title: TagSectionTitle.Genres,
            tags: genres,
        },
    ];
    return {
        mangaId: mangaId,
        mangaInfo: {
            primaryTitle: title,
            secondaryTitles: [title],
            status: status,
            author: author,
            tagGroups: tagSections,
            synopsis: description,
            thumbnailUrl: image,
            contentRating: getRating(isAdultContent),
            shareUrl: getShareUrl(mangaId),
        },
    };
};

export const parseChapters = (
    $: CheerioAPI,
    sourceManga: SourceManga,
): Chapter[] => {
    const floatRegex = /(\d+\.\d+|\d+)/g;
    const chapters: ChapterWithMetadata[] = [];
    const arrChapters = $("a.flex.items-center").toArray();
    const chapterTypeToIdMap: Record<string, number> = {};
    let currChapterTypeId = 0;
    let sortingIndex = 0;
    for (const chapterObj of arrChapters) {
        const chapterId: string =
            $(chapterObj).attr("href")?.replace(/\/$/, "")?.split("/").pop() ??
            "";
        if (!chapterId) continue;

        const publishDate = new Date(
            $("time.opacity-50", chapterObj).attr("datetime") ?? "",
        );
        const title = $("span.grow.flex.gap-2 span", chapterObj)
            .first()
            .text()
            .trim();

        let chapNum = 0;
        let chapterType = "";
        const matches = title.match(floatRegex);
        if (matches && matches[matches.length - 1]) {
            chapNum = parseFloat(matches[matches.length - 1] ?? "0");
            chapterType = title
                .slice(0, -matches[matches.length - 1].length)
                .trim();
        }
        sortingIndex--;
        if (!(chapterType in chapterTypeToIdMap)) {
            chapterTypeToIdMap[chapterType] = currChapterTypeId--;
        }
        const hasOfficialTranslation =
            $("svg", chapterObj).attr("stroke") ===
            officialTranslationSvgStroke;
        let version = undefined;
        if (hasOfficialTranslation) {
            version = "Official";
        }
        chapters.push({
            chapterId,
            title,
            chapNum,
            publishDate,
            sortingIndex,
            langCode: DEFAULT_LANGUAGE_CODE,
            version,
            volume: 0,
            sourceManga,
            chapterType,
        });
    }
    if (chapters.length == 0) {
        throw new Error(
            `Couldn't find any chapters for mangaId: ${sourceManga.mangaId}`,
        );
    }

    const totalTypes = Object.keys(chapterTypeToIdMap).length;

    // Handle volume if there are multiple types
    // i.e. Berserk has Prologue 1 etc. and then Chapter 1
    if (totalTypes > 1) {
        for (const chapter of chapters) {
            chapter.volume =
                totalTypes + chapterTypeToIdMap[chapter.chapterType];
        }
    }

    return chapters;
};

export const parseChapterDetails = async (
    $: CheerioAPI,
    mangaId: string,
    chapterId: string,
): Promise<ChapterDetails> => {
    const pages: string[] = [];
    for (const img of $("img", "section.cursor-pointer").toArray()) {
        let image = $(img).attr("src") ?? "";
        if (!image) image = $(img).attr("data-src") ?? "";
        if (!image) continue;
        pages.push(image);
    }

    const chapterDetails = {
        id: chapterId,
        mangaId: mangaId,
        pages: pages,
    };
    return chapterDetails;
};

export const parseRecommendedSection = async (
    $: CheerioAPI,
): Promise<DiscoverSectionItem[]> => {
    const recommendedSectionArray: DiscoverSectionItem[] = [];
    for (const recommendationObj of $(
        ".glide__slide:not(.glide__slide--clone)",
    ).toArray()) {
        const id =
            $("a", recommendationObj)
                .attr("href")
                ?.replace(/\/$/, "")
                ?.split("/")
                .slice(-2)[0] ?? "";
        const title = $(".text-white", recommendationObj).text().trim() ?? "";
        const imageUrl =
            $("source", recommendationObj).first().attr("srcset") ??
            $("img", recommendationObj).attr("src") ??
            "";
        recommendedSectionArray.push({
            imageUrl,
            title: decodeHTML(title),
            mangaId: id,
            type: "featuredCarouselItem",
        });
    }
    return recommendedSectionArray;
};

export const parseRecentSection = async (
    $: CheerioAPI,
): Promise<DiscoverSectionItem[]> => {
    const recentSectionArray: DiscoverSectionItem[] = [];
    for (const recentObj of $(
        "article",
        "section.bg-base-200.rounded-sm",
    ).toArray()) {
        recentSectionArray.push(parseRecentObject(recentObj, $));
    }
    return recentSectionArray;
};

export const parseRecentSectionViewMore = async (
    $: CheerioAPI,
): Promise<DiscoverSectionItem[]> => {
    const recentSectionArray: DiscoverSectionItem[] = [];
    for (const recentObj of $("article").toArray()) {
        recentSectionArray.push(parseRecentObject(recentObj, $));
    }
    return recentSectionArray;
};

const parseRecentObject = (
    recentObj: Element,
    $: CheerioAPI,
): DiscoverSectionItem => {
    const id =
        $("a.aspect-square", recentObj)
            .attr("href")
            ?.replace(/\/$/, "")
            ?.split("/")
            .slice(-2)[0] ?? "";
    const chapterId =
        $("a.min-w-0", recentObj)
            .attr("href")
            ?.replace(/\/$/, "")
            ?.split("/")
            .slice(-2)[0] ?? "";
    const title = $("div.font-semibold", recentObj).text().trim() ?? "";
    const imageUrl =
        $("a img", recentObj).attr("src") ??
        $("a img", recentObj).attr("data-src") ??
        "";
    const subtitle = $("span", recentObj).last().text().trim() ?? "";
    return {
        imageUrl,
        title: decodeHTML(title),
        mangaId: id,
        subtitle: decodeHTML(subtitle),
        chapterId: chapterId,
        type: "chapterUpdatesCarouselItem",
    };
};

export const parseHotSection = async (
    $: CheerioAPI,
): Promise<DiscoverSectionItem[]> => {
    const hotSectionArray: DiscoverSectionItem[] = [];
    for (const hotObj of $(
        "article.flex.gap-4",
        "section.bg-base-200.max-w-7xl",
    ).toArray()) {
        const id =
            $("a", hotObj)
                .first()
                .attr("href")
                ?.replace(/\/$/, "")
                ?.split("/")
                .slice(-2)[0] ?? "";
        const title =
            $("div.font-semibold", hotObj).first().text().trim() ?? "";
        const imageUrl = $("source", hotObj).first().attr("srcset") ?? "";
        const subtitle = $("span", hotObj).last().text().trim() ?? "";
        hotSectionArray.push({
            imageUrl,
            title: decodeHTML(title),
            subtitle: decodeHTML(subtitle),
            mangaId: id,
            type: "simpleCarouselItem",
        });
    }
    return hotSectionArray;
};

export const parseSearch = async (
    $: CheerioAPI,
): Promise<SearchResultItem[]> => {
    const itemArray: SearchResultItem[] = [];
    for (const item of $("article.flex.gap-4").toArray()) {
        const id =
            $("a", item).attr("href")?.split("/series/")[1]?.split("/")[0] ??
            "";
        if (id == "") throw new Error("Id is empty");

        const title = $("a.link.link-hover", item).first().text().trim() ?? "";
        const image =
            $("img", item).attr("src") ?? $("img", item).attr("data-src") ?? "";
        itemArray.push({
            imageUrl: image,
            title: decodeHTML(title),
            mangaId: id,
            subtitle: "",
        });
    }
    return itemArray;
};

export const parseTags = async ($: CheerioAPI): Promise<TagSection[]> => {
    const tagSections: TagSection[] = [];

    const genreTagSection = parseIntoTagSection(
        $,
        TagSectionId.Genres,
        TagSectionTitle.Genres,
        'div:contains("Tags").collapse-title',
    );
    tagSections.push(genreTagSection);

    const seriesStatusTagSection = parseIntoTagSection(
        $,
        TagSectionId.SeriesStatus,
        TagSectionTitle.SeriesStatus,
        'div:contains("Series Status").collapse-title',
    );
    tagSections.push(seriesStatusTagSection);

    const seriesTypeTagSection = parseIntoTagSection(
        $,
        TagSectionId.SeriesType,
        TagSectionTitle.SeriesType,
        'div:contains("Series Type").collapse-title',
    );
    tagSections.push(seriesTypeTagSection);

    const orderTagSection = parseIntoTagSection(
        $,
        TagSectionId.Order,
        TagSectionTitle.Order,
        'div:contains("Order").collapse-title',
    );
    tagSections.push(orderTagSection);

    return tagSections;
};

const parseIntoTagSection = (
    $: CheerioAPI,
    id: TagSectionId,
    title: TagSectionTitle,
    selector: string,
): TagSection => {
    const tagSection: TagSection = {
        id,
        title,
        tags: [],
    };
    const elements = $(selector).next().children().toArray();
    for (const element of elements) {
        const title = $("span", element).first().text().trim();
        let id = $("input", element).last().attr("value") ?? "";
        id = formatTagId(id);
        tagSection.tags.push({ id, title });
    }
    return tagSection;
};

export const isLastPage = ($: CheerioAPI, spanString: string): boolean => {
    return $(`span:contains("${spanString}")`).toArray().length == 0;
};
