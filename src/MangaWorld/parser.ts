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
import {
    blacklistedTags,
    blacklistedType,
    getAdultFilter,
    getMatureFilter,
    Metadata,
} from "./helper";

export class Parser {
    /**
     * Ottieni Rating dati tags
     * @param {string[]} tags - tags
     * @return {ContentRating} - ContentRating
     */
    getRating(tags: string[]): ContentRating | undefined {
        let rating = ContentRating.EVERYONE;
        const storedAdultTags = Application.getState("adult_tags") as string[];
        const adult_pref = storedAdultTags
            ? storedAdultTags
            : getAdultFilter().map(({ id }) => id);

        const storedMatureTags = Application.getState(
            "mature_tags",
        ) as string[];
        const mature_pref = storedMatureTags
            ? storedMatureTags
            : getMatureFilter().map(({ id }) => id);
        console.log("AdultTags: " + adult_pref.join(","));
        console.log("MatureTags: " + mature_pref.join(","));
        for (const tag of tags) {
            if (
                adult_pref
                    .map((item) => item.toUpperCase())
                    .includes(tag.toUpperCase())
            ) {
                rating = ContentRating.ADULT;
                break;
            } else if (
                mature_pref
                    .map((item) => item.toUpperCase())
                    .includes(tag.toUpperCase())
            ) {
                rating = ContentRating.MATURE;
                break;
            }
        }
        return rating;
    }

    /**
     * Ottieni dettagli Manga
     * @param {cheerio.CheerioAPI} $ - Richiesta
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
                contentRating: rating,
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
     * Ottieni Lista Capitoli
     * @param {cheerio.CheerioAPI} $ - Richiesta
     * @param {SourceManga} sourceManga - Manga
     * @return {Chapter[]} - Capitoli
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
            const name = $("a", item).attr("title") ?? "";
            const volN = $(item)
                .closest(".volume-element")
                .find(".volume-name")
                .text()
                .split(" ")[1];
            const chapN = $(".d-inline-block", item).text().split(" ")[1];
            console.log("New Chapters");
            console.log(
                "Parsed: Manga " +
                    name +
                    " Chapter: " +
                    chapN +
                    " Volume: " +
                    volN,
            );
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
     * Parsing dettagli capitolo
     * @param {cheerio.CheerioAPI} $ - Richiesta
     * @param {string} mangaId - ID manga
     * @param {string} id - ID capitolo
     * @return {{
     *   id: string
     *   mangaId: string
     *   pages: string[]
     * }} - Dettagli
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
     * Parsing pagina
     * @param {cheerio.CheerioAPI} $ - Richiesta
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
     * Parsing ricerca
     * @param {cheerio.CheerioAPI} $ - Richiesta
     * @return {SearchResultItem[]} items
     */
    parseSearchResults($: cheerio.CheerioAPI): SearchResultItem[] {
        const results: SearchResultItem[] = [];
        const parse = this.parsePage($);
        for (const item of parse) {
            if (!blacklistedTags(item.tags) && !blacklistedType(item.type)) {
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
     * Parsing capitoli in tendenza
     * @param {Metadata} metadata - metadata
     * @param {cheerio.CheerioAPI} $ - Richiesta
     * @return { items: DiscoverSectionItem[] }
     */
    parseCapitoliInTendenza(
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
            console.log("Capitoli in tendenza");
            console.log("Parsed: Manga " + title + " Chap: " + chapNum);
            trending.push({
                metadata: metadata,
                type: "featuredCarouselItem",
                contentRating: undefined,
                supertitle: chapNum,
                imageUrl: image,
                mangaId: id,
                title: title,
            });
        }
        return { items: trending };
    }

    /**
     * Parsing in tendenza nel mese
     * @param {Metadata} metadata - metadata
     * @param {cheerio.CheerioAPI} $ - Richiesta
     * @return [ { items: DiscoverSectionItem[], metadata: Metadata }, { items: DiscoverSectionItem[], metadata: Metadata } ]
     */
    parseInTendenzaMese(
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
            console.log("In tendenza Mese");
            console.log("Parsed: Manga " + title);
            if (hot.length < 10) {
                hot.push({
                    metadata: metadata,
                    type: "prominentCarouselItem",
                    contentRating: undefined,
                    imageUrl: image,
                    mangaId: id,
                    title: title,
                });
            }
        }
        return { items: hot, metadata: metadata };
    }

    /**
     * Parsing ultimi manga aggiunti
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

        const data = (
            await Application.scheduleRequest({
                url: `${url}/archive?sort=newest&page=${page}`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
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
     * Parse nuovi capitoli
     * @param {cheerio.CheerioAPI} $ - pagina
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
            console.log("Ultime Aggiunte");
            console.log("Parsed: Manga " + title);
            console.log("Parsed: Ch " + chapterId);
            const regexDinamica = new RegExp(
                `"createdAtTWithYear":\\s*"([^"]+)"\\s*,\\s*"isNew":\\s*(true|false)\\s*,\\s*"id":\\s*"${chapterId}"`,
                "m",
            );
            const match = $.html().match(regexDinamica);
            let data = new Date();
            if (match) {
                console.log("Data trovata:" + match[1]);
                data = this.getDate(match[1]);
            }
            if (!blacklistedType(mangaType)) {
                latest.push({
                    chapterId: chapterId,
                    metadata: metadata,
                    type: "chapterUpdatesCarouselItem",
                    publishDate: data,
                    contentRating: undefined,
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
     * Trasforma una stringa in data
     * @param {string} dataString - data in formato stringa
     * @return {Date} - stringa in formato data
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
