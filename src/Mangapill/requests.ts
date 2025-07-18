import { Response, URL } from "@paperback/types";
import { MANGA_PILL_DOMAIN } from "./models";

interface Query {
    key: string;
    value: string | string[];
}

export async function fetchHomepage(): Promise<[Response, ArrayBuffer]> {
    const request = {
        url: new URL(MANGA_PILL_DOMAIN).toString(),
        method: "GET",
    };
    return await Application.scheduleRequest(request);
}

export async function fetchMangaDetailsPage(
    mangaId: string,
): Promise<[Response, ArrayBuffer]> {
    const request = {
        url: new URL(MANGA_PILL_DOMAIN)
            .addPathComponent("manga")
            .addPathComponent(mangaId)
            .toString(),
        method: "GET",
    };
    return await Application.scheduleRequest(request);
}

export async function fetchChapterDetailsPage(
    chapterId: string,
): Promise<[Response, ArrayBuffer]> {
    const request = {
        url: new URL(MANGA_PILL_DOMAIN)
            .addPathComponent("chapters")
            .addPathComponent(chapterId)
            .toString(),
        method: "GET",
    };
    return await Application.scheduleRequest(request);
}

export async function fetchSearchPage(
    paths: Array<string>,
    queries: Array<Query>,
): Promise<[Response, ArrayBuffer]> {
    const urlBuilder = new URL(MANGA_PILL_DOMAIN).addPathComponent("search");
    for (const path of paths) {
        urlBuilder.addPathComponent(path);
    }

    for (const query of queries) {
        urlBuilder.setQueryItem(query.key, query.value);
    }

    const request = {
        url: urlBuilder.toString(),
        method: "GET",
    };

    return await Application.scheduleRequest(request);
}
