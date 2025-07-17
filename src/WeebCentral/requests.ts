import { Response } from "@paperback/types";
import { QueryValue, URLBuilder } from "../utils/url-builder/base";
import { WC_DOMAIN } from "./models";

export interface Query {
    key: string;
    value: QueryValue;
}

export async function fetchHomepage(): Promise<[Response, ArrayBuffer]> {
    return await Application.scheduleRequest({
        url: new URLBuilder(WC_DOMAIN).build(),
        method: "GET",
    });
}

export async function fetchMangaDetailsPage(
    mangaId: string,
): Promise<[Response, ArrayBuffer]> {
    const request = {
        url: new URLBuilder(WC_DOMAIN)
            .addPath("series")
            .addPath(mangaId)
            .build(),
        method: "GET",
    };

    return await Application.scheduleRequest(request);
}

export async function fetchChaptersPage(
    mangaId: string,
): Promise<[Response, ArrayBuffer]> {
    const request = {
        url: new URLBuilder(WC_DOMAIN)
            .addPath("series")
            .addPath(mangaId)
            .addPath("full-chapter-list")
            .build(),
        method: "GET",
    };
    return await Application.scheduleRequest(request);
}

export async function fetchChapterDetailsPage(
    chapterId: string,
): Promise<[Response, ArrayBuffer]> {
    const request = {
        url: new URLBuilder(WC_DOMAIN)
            .addPath("chapters")
            .addPath(chapterId)
            .addPath("images")
            .addQuery("reading_style", "long_strip")
            .build(),
        method: "GET",
    };

    return await Application.scheduleRequest(request);
}

export async function fetchSearchPage(
    paths: Array<string>,
    queries: Array<Query>,
): Promise<[Response, ArrayBuffer]> {
    const urlBuilder = new URLBuilder(WC_DOMAIN).addPath("search");
    for (const path of paths) {
        urlBuilder.addPath(path);
    }

    for (const query of queries) {
        urlBuilder.addQuery(query.key, query.value);
    }

    const request = {
        url: urlBuilder.build(),
        method: "GET",
    };

    return await Application.scheduleRequest(request);
}
