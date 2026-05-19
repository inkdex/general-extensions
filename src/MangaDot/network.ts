/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
  type SearchQuery,
  type SortingOption,
} from "@paperback/types";

import {
  DOMAIN,
  type ChapterPagesResponse,
  type ChapterListResponse,
  type MangaDataResponse,
  type SearchMetadata,
  type SearchResponse,
  type SearchSuggestionsResponse,
  type Volumes,
} from "./models";
import { deNormalizeId, getShowAdultStatus, getSectionContentTypes } from "./utils";

export class MangaDotInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        "user-agent": await Application.getDefaultUserAgent(),
        ...request.headers,
      },
    };
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: `${DOMAIN}/`,
        method: request.method ?? "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }

    return data;
  }
}

export class MangaDotApi {
  private async fetchApi<T>(request: Request): Promise<T> {
    const [, data] = await Application.scheduleRequest(request);

    try {
      return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
    } catch {
      throw new Error(`Failed to fetch data from ${request.url} (Invalid response)`);
    }
  }

  async getSection(section: string, page: number): Promise<SearchResponse> {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent("section")
      .addPathComponent(section.replaceAll("_", "-"))
      .setQueryItems({
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        adult: getShowAdultStatus() ? "both" : "0",
        page: page.toString(),
      });
    return this.fetchApi<SearchResponse>({ url: url.toString(), method: "GET" });
  }

  async getMangaData(mangaId: string) {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent(mangaId);
    return this.fetchApi<MangaDataResponse>({ url: url.toString(), method: "GET" });
  }

  async getChapterList(mangaId: string) {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent(mangaId)
      .addPathComponent("chapters")
      .addPathComponent("list");
    return this.fetchApi<ChapterListResponse[]>({ url: url.toString(), method: "GET" });
  }

  async getVolumes(mangaId: string) {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent(mangaId)
      .addPathComponent("volumes");
    return this.fetchApi<Volumes[]>({ url: url.toString(), method: "GET" });
  }

  async getSearch(query: SearchQuery<SearchMetadata>, page: number, sorting: SortingOption) {
    const formattedGenres = Object.entries(query.metadata?.genres ?? []).map(([genre, state]) => {
      const normalized = deNormalizeId(genre);
      return state === "excluded" ? `-${normalized}` : normalized;
    });
    const [sort, order] = sorting.id.split("$");
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("search")
      .setQueryItems({
        search: query.title,
        page: page.toString(),
        genres: formattedGenres.join(","),
        origin: (query.metadata?.origin ?? []).join(",").replaceAll("&", ","),
        status: (query.metadata?.status ?? []).join(","),
        author: (query.metadata?.author ?? []).join(","),
        artist: (query.metadata?.artist ?? []).join(","),
        sortBy: sort,
        sortOrder: order ? order : "",
        adult: query.metadata?.adult === true ? "both" : "0",
      });
    return this.fetchApi<SearchResponse>({ url: url.toString(), method: "GET" });
  }

  async getChapterPages(chapterId: string, mangaId: string, upload: string | undefined) {
    const chapPath = upload === "trusted" ? "uploads" : "chapters";
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent(chapPath)
      .addPathComponent(chapterId)
      .addPathComponent("images");
    return this.fetchApi<ChapterPagesResponse>({
      url: url.toString(),
      method: "GET",
      headers: { referer: `${DOMAIN}/manga/${mangaId}` },
    });
  }

  async getFilters() {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent("genres");
    return this.fetchApi<string[]>({ url: url.toString(), method: "GET" });
  }

  async getAuthor(value: string) {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent("people-suggest")
      .setQueryItems({ kind: "author", q: value });
    return this.fetchApi<SearchSuggestionsResponse>({ url: url.toString(), method: "GET" });
  }

  async getArtist(value: string) {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent("people-suggest")
      .setQueryItems({ kind: "artist", q: value });
    return this.fetchApi<SearchSuggestionsResponse>({ url: url.toString(), method: "GET" });
  }
}
