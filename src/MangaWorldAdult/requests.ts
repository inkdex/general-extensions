import { SearchQuery, SortingOption } from "@paperback/types";
import * as cheerio from "cheerio";
import { baseUrl, getGenreFilter, getPageCache, URLBuilder } from "./helpers";

export class Requests {
    constructSearchRequestURL(
        page: number,
        query: SearchQuery = { title: "", filters: [] },
        sorting: SortingOption | undefined,
    ): {
        url: string;
        excluded: { generi: string[]; tipi: string[] };
    } {
        const generi: string[] = [];
        const generi_esclusi: string[] = [];
        const tipi_esclusi: string[] = [];
        const tipologia: string[] = [];
        const stato: string[] = [];
        const anno: string[] = [];

        const getFilterValue = (id: string) =>
            query.filters.find((filter) => filter.id == id)?.value;
        const genres: string | Record<string, "included" | "excluded"> =
            getFilterValue("genres") ?? "";
        const types: string | Record<string, "included" | "excluded"> =
            getFilterValue("types") ?? "";
        const status: string | Record<string, "included" | "excluded"> =
            getFilterValue("status") ?? "";
        const year: string | Record<string, "included" | "excluded"> =
            getFilterValue("year") ?? "";
        if (genres && typeof genres === "object") {
            for (const tag of Object.entries(genres)) {
                if (tag[1] == "included") generi.push(tag[0]);
                if (tag[1] == "excluded")
                    generi_esclusi.push(
                        getGenreFilter().find((item) => item.id === tag[0])
                            ?.value ?? "",
                    );
            }
        }

        if (types && typeof types === "object") {
            for (const tag of Object.entries(types)) {
                if (tag[1] == "included") tipologia.push(tag[0]);
                if (tag[1] == "excluded") tipi_esclusi.push(tag[0]);
            }
        }

        if (status && typeof status === "object") {
            for (const tag of Object.entries(status)) {
                if (tag[0].length > 0) stato.push(tag[0]);
            }
        } else if (status.length > 0) stato.push(status);

        if (year && typeof year === "object") {
            for (const tag of Object.entries(year)) {
                if (tag[0].length > 0) anno.push(tag[0]);
            }
        } else if (year.length > 0) anno.push(year);

        const urlBuilder = new URLBuilder(baseUrl).addPathComponent("archive");
        if (query.title.toString().length > 0)
            urlBuilder.addQueryParameter(
                "keyword",
                query.title.toString() ?? "",
            );
        urlBuilder.addQueryParameter("page", page.toString());
        if (sorting?.id) urlBuilder.addQueryParameter("sort", sorting?.id);
        if (generi.length > 0) urlBuilder.addQueryParameter("genre", generi);
        if (tipologia.length > 0)
            urlBuilder.addQueryParameter("type", tipologia);
        if (stato.length > 0) urlBuilder.addQueryParameter("status", stato[0]);
        if (anno.length > 0) urlBuilder.addQueryParameter("year", anno[0]);
        return {
            url: urlBuilder.buildUrl(),
            excluded: { generi: generi_esclusi, tipi: tipi_esclusi },
        };
    }

    async parseFilters() {
        const data = (
            await Application.scheduleRequest({
                url: `${baseUrl}/archive`,
                method: "GET",
            })
        )[1];
        return cheerio.load(Application.arrayBufferToUTF8String(data));
    }

    async parseLastMangaAddedSectionRequests(page: number) {
        let $ = cheerio.load(``);
        if (page > 1) {
            const data = (
                await Application.scheduleRequest({
                    url: `${baseUrl}/archive?sort=newest&page=${page}`,
                    method: "GET",
                })
            )[1];
            $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        } else {
            $ = cheerio.load(
                Application.arrayBufferToUTF8String(
                    await getPageCache(
                        "LastMangaAddedSection",
                        `${baseUrl}/archive?sort=newest&page=${page}`,
                    ),
                ),
            );
        }
        return $;
    }

    async parseLastAddedSectionRequests(page: number) {
        const data = (
            await Application.scheduleRequest({
                url: `${baseUrl}?page=${page}`,
                method: "GET",
            })
        )[1];
        return cheerio.load(Application.arrayBufferToUTF8String(data));
    }

    async parsePopularSectionRequests(page: number) {
        let $ = cheerio.load(``);
        if (page > 1) {
            const data = (
                await Application.scheduleRequest({
                    url: `${baseUrl}/archive?sort=most_read&page=${page}`,
                    method: "GET",
                })
            )[1];
            $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        } else {
            $ = cheerio.load(
                Application.arrayBufferToUTF8String(
                    await getPageCache(
                        "PopularSection",
                        `${baseUrl}/archive?sort=most_read&page=${page}`,
                    ),
                ),
            );
        }
        return $;
    }

    async getSearchResultsRequests(url: string) {
        const data = (
            await Application.scheduleRequest({
                url: url,
                method: "GET",
            })
        )[1];
        return cheerio.load(Application.arrayBufferToUTF8String(data));
    }

    async fetchPage(url: string): Promise<ArrayBuffer> {
        const [, responseData] = await Application.scheduleRequest({
            url,
            method: "GET",
        });
        return responseData;
    }
}
