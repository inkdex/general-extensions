import {
    Chapter,
    ChapterDetails,
    ContentRating,
    PagedResults,
    SearchResultItem,
    SourceManga,
} from "@paperback/types";
import { Cheerio, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";
import { WebtoonChaptersElemDto, WebtoonChaptersListDto } from "./WebtoonDtos";
import { getLanguagesTitle, Language } from "./WebtoonI18NHelper";
import { BASE_URL, WebtoonSettings } from "./WebtoonSettings";

type CheerioElement = Cheerio<Element>;

export type WebtoonsSearchingMetadata = {
    page: number;
    maxPages?: number | undefined;
};
export type WebtoonsItemMetadata = { link: string };
export type Tag = { id: string; value: string };

export abstract class WebtoonParser extends WebtoonSettings {
    parseDetails($: CheerioAPI, mangaId: string): SourceManga {
        const detailElement = $(
            "#wrap > #container > #content > div.cont_box > div.detail_header > div.info",
        );
        const infoElement = $("#_asideDetail") as CheerioElement;
        const isCanvas = mangaId.startsWith(
            this.languageFromId(mangaId) + "/canvas",
        );

        const [image, title] = isCanvas
            ? [
                  this.parseCanvasDetailsThumbnail($),
                  detailElement.find("h3").text().trim(),
              ]
            : [
                  this.parseDetailsThumbnail($),
                  detailElement.find("h1").text().trim(),
              ];

        return {
            mangaId: mangaId,
            mangaInfo: {
                thumbnailUrl: image,
                synopsis: infoElement.find("p.summary").text(),
                primaryTitle: title,
                secondaryTitles: [],
                contentRating: isCanvas
                    ? ContentRating.MATURE
                    : ContentRating.EVERYONE,

                status: this.parseStatus(infoElement),
                artist: "",
                author: detailElement.find(".author_area").text().trim(),
                tagGroups: [
                    {
                        id: "0",
                        title: "genres",
                        tags: detailElement
                            .find(".genre")
                            .toArray()
                            .map((genre) => ({
                                id: $(genre)
                                    .text()
                                    .replaceAll(/\s+|\//gm, "_"),
                                title: $(genre).text(),
                            })),
                    },
                ],
                shareUrl: BASE_URL + "/" + mangaId,
            },
        };
    }

    parseStatus(infoElement: CheerioElement): string {
        const statusElement = infoElement.find("p.day_info");
        const bubbleTest = statusElement.find("span").text() ?? "";
        return statusElement.text()?.replace(bubbleTest, "");
    }

    parseDetailsThumbnail($: CheerioAPI): string {
        const thumb =
            $("#wrap > #container > #content > div.detail_bg")
                .attr("style")
                ?.match(/url\('(.*?)'\)/)?.[1] ?? "";
        const meta = $("meta[property='og:image']").attr("content") ?? "";
        return meta ?? thumb;
    }

    parseCanvasDetailsThumbnail($: CheerioAPI): string {
        return $("#content > div.cont_box span.thmb > img").attr("src") ?? "";
    }

    parseChaptersList(
        dto: WebtoonChaptersListDto,
        sourceManga: SourceManga,
    ): Chapter[] {
        return dto.episodeList.map((elem) =>
            this.parseChapter(elem, sourceManga),
        );
    }

    parseChapter(
        elem: WebtoonChaptersElemDto,
        sourceManga: SourceManga,
    ): Chapter {
        return {
            chapterId: elem.viewerLink.replace("/", ""),
            sourceManga: sourceManga,
            langCode: this.languageFromId(sourceManga.mangaId),
            title: elem.episodeTitle,
            volume: 0,
            chapNum: Number(elem.episodeNo),
            publishDate: new Date(elem.exposureDateMillis),
        };
    }

    parseChapterDetails($: CheerioAPI, chapter: Chapter): ChapterDetails {
        return {
            id: chapter.chapterId,
            mangaId: chapter.sourceManga.mangaId,
            pages: $("div#_imageList img")
                .toArray()
                .map((elem) => $(elem).attr("data-url") ?? ""),
        };
    }

    parsePopularTitles($: CheerioAPI): PagedResults<SearchResultItem> {
        return {
            items: $("div#content div.webtoon_list_wrap ul.webtoon_list li a")
                .toArray()
                .filter((elem) => $(elem).find("strong.title"))
                .map((elem) => this.parseMangaFromElement($(elem))),
        };
    }

    parseTodayTitles(
        $: CheerioAPI,
        allTitles: boolean,
    ): PagedResults<SearchResultItem> {
        const mangas: SearchResultItem[] = [];

        const list = $(
            `div#content div.webtoon_list_wrap ul.webtoon_list li a`,
        );
        for (
            let i = 0;
            i <= list.length - 1 && (allTitles || mangas.length < 10);
            i++
        ) {
            if ($(list[i]).find("strong.title"))
                mangas.push(this.parseMangaFromElement($(list[i])));
        }

        return { items: mangas };
    }

    // parseTrendingTitles(
    //     $: CheerioAPI,
    //     allTitles: boolean,
    // ): PagedResults<SearchResultItem> {
    //     const mangas: SearchResultItem[] = [];
    //     let maxChild = 0;

    //     $("div#content div.webtoon_list_wrap ul.webtoon_list").each((_: number, elem: Element) => {
    //         if ($(elem).find("li").length > maxChild)
    //             maxChild = $(elem).find("li").length;
    //     });

    //     for (let i = 1; i <= maxChild; i++) {
    //         if (!allTitles && mangas.length >= 14) return { items: mangas };
    //         $(
    //             "div#content div.webtoon_list_wrap ul.webtoon_list li a",
    //         ).each((_: number, elem: AnyNode) => {
    //             if ($(elem).find("strong.title"))
    //                 mangas.push(this.parseMangaFromElement($(elem as Element)));
    //         });
    //     }

    //     return { items: mangas };
    // }

    // parseCompletedTitles(
    //     $: CheerioAPI,
    //     allTitles: boolean,
    // ): PagedResults<SearchResultItem> {
    //     const mangas: SearchResultItem[] = [];

    //     const list = $("div#content div.webtoon_list_wrap ul.webtoon_list li a");
    //     for (
    //         let i = 0;
    //         i <= list.length-1 && (allTitles || mangas.length < 10);
    //         i++
    //     ) {
    //         if ($(list[i]).find("strong.title"))
    //             mangas.push(this.parseMangaFromElement($(list[i])));
    //     }

    //     return { items: mangas };
    // }

    parseCanvasRecommendedTitles(
        $: CheerioAPI,
    ): PagedResults<SearchResultItem> {
        return {
            items: $("#recommendArea li.rolling-item")
                .toArray()
                .map((elem) => this.parseCanvasFromRecommendedElement($(elem))),
        };
    }

    parseCanvasFromRecommendedElement(elem: CheerioElement): SearchResultItem {
        const mangaId =
            elem
                .find("a")
                .attr("href")
                ?.replace(BASE_URL + "/", "") ?? "";
        const subtitle =
            "Canvas" +
            (this.languages.length > 1
                ? " - " + this.languageTitleFromId(mangaId)
                : "");
        return {
            mangaId: mangaId,
            title: elem.find("p.subj").text(),
            imageUrl: elem.find("img").attr("src") ?? "",
            subtitle: subtitle,
        };
    }

    parseCanvasPopularTitles($: CheerioAPI): PagedResults<SearchResultItem> {
        return {
            items: $("div.challenge_lst li a")
                .toArray()
                .map((elem) => this.parseCanvasFromElement($(elem))),
        };
    }

    parseMangaFromElement(elem: CheerioElement): SearchResultItem {
        const mangaId = elem.attr("href")?.replace(BASE_URL + "/", "") ?? "";
        const isCanvas = mangaId.startsWith(
            this.languageFromId(mangaId) + "/canvas",
        );
        const subtitle = isCanvas
            ? "Canvas" +
              (this.languages.length > 1
                  ? " - " + this.languageTitleFromId(mangaId)
                  : "")
            : this.languages.length > 1
              ? this.languageTitleFromId(mangaId)
              : "";
        const contentRating =
            elem.children().attr("data-title-unsuitable-for-children") == "true"
                ? ContentRating.MATURE
                : ContentRating.EVERYONE;
        return {
            mangaId: mangaId,
            title: elem.find("strong.title").text(),
            imageUrl: elem.find("img").attr("src") ?? "",
            subtitle: subtitle,
            contentRating: contentRating,
        };
    }

    parseCanvasFromElement(elem: CheerioElement): SearchResultItem {
        const mangaId = elem.attr("href")?.replace(BASE_URL + "/", "") ?? "";
        const subtitle =
            "Canvas" +
            (this.languages.length > 1
                ? " - " + this.languageTitleFromId(mangaId)
                : "");
        return {
            mangaId: mangaId,
            title: elem.find("p.subj").text(),
            imageUrl: elem.find("img").attr("src") ?? "",
            subtitle: subtitle,
            contentRating: ContentRating.MATURE,
        };
    }

    parseSearchResults($: CheerioAPI): PagedResults<SearchResultItem> {
        return {
            items: [
                ...$("#content > div.webtoon_list_wrap ul li a._card_item")
                    .toArray()
                    .map((elem) => this.parseMangaFromElement($(elem))),
                // ...(this.canvasWanted
                //     ? $("#content > div.webtoon_list_wrap ul li a.challenge_item")
                //           .toArray()
                //           .map((elem) => this.parseCanvasFromElement($(elem)))
                //     : []),
            ],
        };
    }

    parseGenres($: CheerioAPI): Tag[] {
        return $("#content > div#genre_wrap > div.snb_inner > ul li")
            .toArray()
            .map((elem) => this.parseTagFromElement($(elem)));
    }

    parseCanvasGenres($: CheerioAPI): Tag[] {
        return (
            $("#content > div#genre_wrap > div.snb_inner > ul li")
                .toArray()
                // .filter(
                //     (elem) =>
                //         $(elem).find("a").text().trim() !== "ALL",
                // )
                .map((elem) => this.parseCanvasTagFromElement($(elem)))
        );
    }

    parseTagFromElement(elem: CheerioElement): Tag {
        return {
            id: elem.find("a").attr("data-genre") ?? "",
            value: elem.find("a").text().trim(),
        };
    }

    parseCanvasTagFromElement(elem: CheerioElement): Tag {
        return {
            id:
                "CANVAS%%" +
                elem
                    .find("a")
                    .text()
                    .trim()
                    .replaceAll(/\s+|\//gm, "_"),
            value: "Canvas - " + elem.find("a").text().trim(),
        };
    }

    parseTagResults($: CheerioAPI): PagedResults<SearchResultItem> {
        return {
            items: $("#content > div.webtoon_list_wrap ul li a")
                .toArray()
                .map((elem) => this.parseMangaFromElement($(elem))),
        };
    }

    languageFromId(id: string): Language {
        return id.split("/")[0] as Language;
    }

    languageTitleFromId(id: string): string | undefined {
        return getLanguagesTitle(this.languageFromId(id));
    }
}
