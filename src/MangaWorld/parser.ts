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
import * as cheerio from "cheerio";
import { getPageCache } from "../MangaWorldAdult/helper";
import {
    blacklistedTags,
    blacklistedType,
    excludedTags,
    excludedTypes,
    Metadata,
} from "./helper";

export class Parser {
    /**
     * Get manga Rating
     * @param {string[]} tags - tags
     * @return {ContentRating} - ContentRating
     */
    getRating(tags: string[]): ContentRating {
        let rating = ContentRating.EVERYONE;
        for (const tag of tags) {
            if (tag.toUpperCase() === "ADULTI") {
                rating = ContentRating.ADULT;
                break;
            } else if (tag.toUpperCase() === "MATURO") {
                rating = ContentRating.MATURE;
                break;
            }
        }
        return rating;
    }

    /**
     * Get Manga Detail
     * @param {cheerio.CheerioAPI} $ - Request
     * @param {string} mangaId - MangaID
     * @param {string} shareURL - shareURL
     * @return {SourceManga} - SourceManga
     */
    parseMangaDetails(
        $: cheerio.CheerioAPI,
        mangaId: string,
        shareURL: string,
    ): SourceManga {
        const title: string = $(".name.bigger").text().trim() ?? "";
        const image: string =
            $(".thumb.mb-3.text-center img").attr("src") ?? "";
        const desc: string = $("#noidungm").text().trim() ?? "";
        let subs: string = "";
        const artists: string[] = [];
        const authors: string[] = [];
        const titles: string[] = [];
        const data = {
            genre: [] as string[],
            state: "",
        };
        for (const obj of $(".meta-data.row.px-1 .col-12").toArray()) {
            const text = $(obj).text().trim();
            if (text.includes("Fansub")) {
                subs = $(obj).find("a").first().text().trim();
            }
            if (text.includes("Stato")) {
                const stateLink = $(obj).find("a").first();
                if (stateLink.length) data.state = stateLink.text().trim();
            } else if (text.includes("Artist")) {
                $(obj)
                    .find("a")
                    .each(function (_, e) {
                        artists.push($(e).text().trim());
                    });
            } else if (text.includes("Autor")) {
                $(obj)
                    .find("a")
                    .each(function (_, e) {
                        authors.push($(e).text().trim());
                    });
            } else if (text.includes("Gener")) {
                $(obj)
                    .find("a")
                    .each(function (_, e) {
                        data.genre.push($(e).text().trim());
                    });
            } else if (text.includes("Titol")) {
                let t = $(obj).text().trim();
                t = t.slice(t.indexOf(":") + 1, t.length);
                t.split(",").forEach((element: string) => {
                    titles.push(element.trim());
                });
            }
        }
        const author = authors.join(", ");
        const artist = artists.join(", ");
        const status = data.state;
        const arrayTags: Tag[] = [];
        for (const tag of data.genre) {
            arrayTags.push({ title: tag, id: tag.replaceAll(" ", "-") });
        }
        const rating = this.getRating(arrayTags.map((tag) => tag.title));
        const tagSections: TagSection[] = [
            { id: "genres", title: "genres", tags: arrayTags },
        ];
        return {
            mangaId: mangaId,
            mangaInfo: {
                artist: artist,
                thumbnailUrl: image,
                synopsis: desc,
                primaryTitle: title,
                contentRating: rating ?? ContentRating.EVERYONE,
                status: status,
                author: author,
                tagGroups: tagSections,
                secondaryTitles: titles,
                additionalInfo: { subs: subs },
                shareUrl: shareURL,
            } as MangaInfo,
        } as SourceManga;
    }

    /**
     * Get Chapter List
     * @param {cheerio.CheerioAPI} $ - Request
     * @param {SourceManga} sourceManga - Manga
     * @return {Chapter[]} - Chapters
     */
    parseChapters($: cheerio.CheerioAPI, sourceManga: SourceManga): Chapter[] {
        const chapters: Chapter[] = [];
        const arrChapters = $(".chapter").toArray().reverse();
        for (const item of arrChapters) {
            const href = $("a", item).attr("href") ?? "";
            const chapterId = (href.match(/read\/([^/]+)+/i) ?? [
                "null",
                "",
            ])[1];
            //const name = $("a", item).attr("title") ?? "";
            const volN = $(item)
                .closest(".volume-element")
                .find(".volume-name")
                .text()
                .split(" ")[1];
            const chapN = $(".d-inline-block", item).text().split(" ")[1];
            const chapNum = isNaN(Number(chapN)) ? 1 : Number(chapN);
            const volumeNum = isNaN(Number(volN)) ? undefined : Number(volN);

            const date = $("i.text-right.text-muted.chap-date", item).text();
            chapters.push({
                chapterId: chapterId,
                sourceManga: sourceManga,
                volume: volumeNum,
                version: sourceManga.mangaInfo.additionalInfo?.subs ?? "",
                langCode: "🇮🇹",
                chapNum: chapNum,
                publishDate: this.getDate(date),
            });
        }
        return chapters;
    }

    /**
     * Parsing chapter details
     * @param {cheerio.CheerioAPI} $ - Request
     * @param {string} mangaId - ID manga
     * @param {string} id - ID chapter
     * @return {{
     *   id: string
     *   mangaId: string
     *   pages: string[]
     * }} - Details
     */
    parseChapterDetails(
        $: cheerio.CheerioAPI,
        mangaId: string,
        id: string,
    ): ChapterDetails {
        const pages: string[] = [];
        for (const item of $(
            ".col-12.text-center.position-relative img",
        ).toArray()) {
            const imageUrl = $(item).attr("src");
            if (!imageUrl) continue;
            pages.push(imageUrl.trim());
        }
        return {
            id: id,
            mangaId: mangaId,
            pages: pages,
        };
    }

    /**
     * Page Parsing
     * @param {cheerio.CheerioAPI} $ - Request
     * @return {[{id:string,title:string,image:string,tags:string[], authors: string, type: string}]}
     */
    parsePage($: cheerio.CheerioAPI): {
        id: string;
        title: string;
        image: string;
        tags: string[];
        authors: string;
        type: string;
    }[] {
        const items: {
            id: string;
            title: string;
            image: string;
            tags: string[];
            authors: string;
            type: string;
        }[] = [];
        for (const item of $(".comics-grid .entry").toArray()) {
            const id =
                (($("a", item).attr("href") ?? "").match(
                    /[0-9]+\/[a-zA-Z0-9-]+/i,
                ) ?? ["null"])[0] ?? "";
            const authors: string[] = [];
            const tags: string[] = [];
            $("div.author", item)
                .find("a")
                .each(function (_, e) {
                    authors.push($(e).text().trim());
                });
            const title = $("a", item).attr("title") ?? "";
            const image = $("a img", item).attr("src") ?? "";
            const mangaType = $("div.genre", item).find("a").text().trim();
            $("div.genres", item)
                .find("a")
                .each(function (_, e) {
                    tags.push($(e).text().trim());
                });
            const author: string = authors.join(", ");
            items.push({
                id: id,
                title: title,
                image: image,
                tags: tags,
                authors: author,
                type: mangaType,
            });
        }
        return items;
    }

    /**
     * Search Parsing
     * @param {cheerio.CheerioAPI} $ - Request
     * @param excluded
     * @return {SearchResultItem[]} items
     */
    async parseSearchResults(
        $: cheerio.CheerioAPI,
        excluded: { generi: string[]; tipi: string[] },
    ): Promise<SearchResultItem[]> {
        const results: SearchResultItem[] = [];
        const parse = this.parsePage($);
        for (const item of parse) {
            if (
                !excludedTypes(item.type, excluded.tipi) &&
                !excludedTags(item.tags, excluded.generi)
            ) {
                results.push({
                    imageUrl: item.image,
                    title: item.title,
                    subtitle: item.authors,
                    mangaId: item.id,
                    contentRating: this.getRating(item.tags),
                });
            }
        }
        return results;
    }

    /**
     * Parsing trending chapters
     * @param {Metadata} metadata - metadata
     * @param {cheerio.CheerioAPI} $ - Request
     * @return { items: DiscoverSectionItem[] }
     */
    parseTrendingChapters(
        $: cheerio.CheerioAPI,
        metadata: Metadata,
    ): { items: DiscoverSectionItem[] } {
        const trending: DiscoverSectionItem[] = [];
        const arrTrending = $(".entry.vertical").toArray();
        for (const obj of arrTrending) {
            const id =
                (($("a", obj).attr("href") ?? "").match(
                    /[0-9]+\/[a-zA-Z0-9-]+/i,
                ) ?? ["null"])[0] ?? "";
            const image = $("a img", obj).attr("src") ?? "";
            const chapNum = $("a div", obj).text() ?? "";
            const title = $(".manga-title", obj).text().trim();
            //console.log("Capitoli in tendenza");
            //console.log("Parsed: Manga " + title + " Chap: " + chapNum);
            trending.push({
                metadata: metadata,
                type: "featuredCarouselItem",
                contentRating: ContentRating.EVERYONE,
                supertitle: chapNum,
                imageUrl: image,
                mangaId: id,
                title: title,
            });
        }
        return { items: trending };
    }

    /**
     * Parsing month trending
     * @param {Metadata} metadata - metadata
     * @param {cheerio.CheerioAPI} $ - Request
     * @return [ { items: DiscoverSectionItem[], metadata: Metadata }, { items: DiscoverSectionItem[], metadata: Metadata } ]
     */
    parseMonthTrending(
        $: cheerio.CheerioAPI,
        metadata: Metadata,
    ): { items: DiscoverSectionItem[]; metadata: Metadata } {
        const arrHotTitle = $(".col-12 .top-wrapper .entry").toArray();
        const hot: DiscoverSectionItem[] = [];
        for (const obj of arrHotTitle) {
            const id =
                (($("a", obj).attr("href") ?? "").match(
                    /[0-9]+\/[a-zA-Z0-9-]+/i,
                ) ?? ["null"])[0] ?? "";
            const image = $(".img-fluid", obj).attr("src") ?? "";
            const title = $(".name", obj).first().text().trim() ?? "";
            //console.log("In tendenza Mese");
            //console.log("Parsed: Manga " + title);
            if (hot.length < 10) {
                hot.push({
                    metadata: metadata,
                    type: "prominentCarouselItem",
                    contentRating: ContentRating.EVERYONE,
                    imageUrl: image,
                    mangaId: id,
                    title: title,
                });
            }
        }
        return { items: hot, metadata: metadata };
    }

    /**
     * Parsing last added
     * @param {Metadata} metadata - metadata
     * @param {string} url - Url
     * @return {{ items: DiscoverSectionItem[], metadata: Metadata }}
     */
    async parseLastMangaAddedSection(
        metadata: Metadata,
        url: string,
    ): Promise<{ items: DiscoverSectionItem[]; metadata: Metadata }> {
        const latest: DiscoverSectionItem[] = [];
        let page = metadata?.page ?? 1;
        let $ = cheerio.load(``);
        if (page > 1) {
            const data = (
                await Application.scheduleRequest({
                    url: `${url}/archive?sort=newest&page=${page}`,
                    method: "GET",
                })
            )[1];
            $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        } else {
            $ = cheerio.load(
                Application.arrayBufferToUTF8String(
                    await getPageCache(
                        "LastMangaAddedSection",
                        `${url}/archive?sort=newest&page=${page}`,
                    ),
                ),
            );
        }
        page++;
        const parse = this.parsePage($);
        for (const item of parse) {
            if (!blacklistedTags(item.tags) && !blacklistedType(item.type)) {
                latest.push({
                    metadata: { page: page },
                    subtitle: item.authors,
                    type: "simpleCarouselItem",
                    contentRating: this.getRating(item.tags),
                    imageUrl: item.image,
                    mangaId: item.id,
                    title: item.title,
                });
            }
        }
        return { items: latest, metadata: { page: page } };
    }

    /**
     * Parse new chapters
     * @param {cheerio.CheerioAPI} $ - page
     * @param {Metadata} metadata - manga metadata
     * @param {string} url - url
     * @return {{
     * 		items: DiscoverSectionItem[],
     * 		metadata: Metadata | undefined
     * 	}}
     */
    async parseLastAddedSection(
        $: cheerio.CheerioAPI,
        metadata: Metadata,
        url: string,
    ): Promise<{
        items: DiscoverSectionItem[];
        metadata: Metadata | undefined;
    }> {
        let page = metadata?.page ?? 1;
        if (page > 1) {
            const data = (
                await Application.scheduleRequest({
                    url: `${url}?page=${page}`,
                    method: "GET",
                })
            )[1];
            $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        }
        page++;
        const arrLatest = $(
            ".col-sm-12.col-md-8.col-xl-9 .comics-grid .entry",
        ).toArray();
        const latest: DiscoverSectionItem[] = [];
        for (const obj of arrLatest) {
            const id: string =
                (($("a", obj).attr("href") ?? "").match(
                    /[0-9]+\/[a-zA-Z0-9-]+/i,
                ) ?? ["null"])[0] ?? "";
            const title: string = $("a", obj).attr("title") ?? "";
            const mangaType: string = $(".genre a", obj).text().trim() ?? "";
            const image: string = $("a img", obj).attr("src") ?? "";
            const sub: string =
                $(".d-flex.flex-wrap.flex-row a", obj).first().attr("title") ??
                "";
            const chapterId: string = ((
                $(".d-flex.flex-wrap.flex-row a", obj).attr("href") ?? ""
            ).match(/\/read\/([a-f0-9]+)(?:\?.*)?$/i) ?? ["null", ""])[1];
            //console.log("Ultime Aggiunte");
            //console.log("Parsed: Manga " + title);
            //console.log("Parsed: Ch " + chapterId);
            const regexDinamica = new RegExp(
                `"createdAtTWithYear":\\s*"([^"]+)"\\s*,\\s*"isNew":\\s*(true|false)\\s*,\\s*"id":\\s*"${chapterId}"`,
                "m",
            );
            const match = $.html().match(regexDinamica);
            let data = new Date();
            if (match) {
                //console.log("Data trovata:" + match[1]);
                data = this.getDate(match[1]);
            }
            if (!blacklistedType(mangaType)) {
                latest.push({
                    chapterId: chapterId,
                    metadata: metadata,
                    type: "chapterUpdatesCarouselItem",
                    publishDate: data,
                    contentRating: ContentRating.EVERYONE,
                    imageUrl: image,
                    mangaId: id,
                    title: title,
                    subtitle: sub,
                });
            }
        }
        return { items: latest, metadata: { page: page } };
    }

    /**
     * String to date
     * @param {string} dataString - date in string format
     * @return {Date} - Date
     */
    getDate(dataString: string): Date {
        const mesi: { [key: string]: number } = {
            gennaio: 0,
            febbraio: 1,
            marzo: 2,
            aprile: 3,
            maggio: 4,
            giugno: 5,
            luglio: 6,
            agosto: 7,
            settembre: 8,
            ottobre: 9,
            novembre: 10,
            dicembre: 11,
        };
        const oggi = new Date();
        const parts = dataString.trim().toLowerCase().split(" ");
        if (parts.length !== 3) return oggi;
        const [giornoStr, meseStr, annoStr] = parts;
        const giorno = parseInt(giornoStr, 10);
        const mese = mesi[meseStr];
        const anno = parseInt(annoStr, 10);
        if (isNaN(giorno) || mese === undefined || isNaN(anno)) return oggi;
        return new Date(anno, mese, giorno);
    }
}
