/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  ContentRating,
  type DiscoverSectionItem,
  PaperbackInterceptor,
  type Request,
  type Response,
  type SearchQuery,
  type SortingOption,
  URL,
} from "@paperback/types";

import {
  type ChapterListResponse,
  type ChapterPagesResponse,
  DOMAIN,
  type MangaDataResponse,
  type PageMetadata,
  type SearchMetadata,
  type SearchResponse,
  type SearchSuggestionsResponse,
  type Volumes,
} from "./models";
import {
  defaultMetadata,
  deNormalizeId,
  getDemographicHidden,
  getFilters,
  getGenresHidden,
  getSectionContentTypes,
  getShowAdultStatus,
  getThemesHidden,
} from "./utils";

export class MangaDotNetInterceptor extends PaperbackInterceptor {
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

export class MangaDotNetApi {
  private async fetchApi<T>(request: Request): Promise<T> {
    const [, data] = await Application.scheduleRequest(request);

    try {
      return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
    } catch {
      throw new Error(`Failed to fetch data from ${request.url} (Invalid response)`);
    }
  }

  async getGenreSection(metadata: PageMetadata | undefined): Promise<{
    items: DiscoverSectionItem[];
    metadata: PageMetadata | undefined;
  }> {
    const allGenres: DiscoverSectionItem[] = [];
    const page = metadata?.page ?? 1;
    getFilters()
      .genre.filter((filterName) => !getGenresHidden().includes(filterName.id))
      .forEach((filterItem) => {
        allGenres.push({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: defaultMetadata(filterItem.id),
          },
          name: filterItem.title,
          contentRating: ContentRating.EVERYONE,
        });
      });
    return {
      items: allGenres,
      metadata: { page: page + 1 },
    };
  }

  async getDemographicSection(metadata: PageMetadata | undefined): Promise<{
    items: DiscoverSectionItem[];
    metadata: PageMetadata | undefined;
  }> {
    const allGenres: DiscoverSectionItem[] = [];
    const page = metadata?.page ?? 1;
    getFilters()
      .demographic.filter((filterName) => !getDemographicHidden().includes(filterName.id))
      .forEach((filterItem) => {
        allGenres.push({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: defaultMetadata(filterItem.id),
          },
          name: filterItem.title,
          contentRating: ContentRating.EVERYONE,
        });
      });
    return {
      items: allGenres,
      metadata: { page: page + 1 },
    };
  }

  async getThemesSection(metadata: PageMetadata | undefined): Promise<{
    items: DiscoverSectionItem[];
    metadata: PageMetadata | undefined;
  }> {
    const allGenres: DiscoverSectionItem[] = [];
    const page = metadata?.page ?? 1;
    getFilters()
      .themeAndContent.filter((filterName) => !getThemesHidden().includes(filterName.id))
      .forEach((filterItem) => {
        allGenres.push({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: defaultMetadata(filterItem.id),
          },
          name: filterItem.title,
          contentRating: ContentRating.EVERYONE,
        });
      });
    return {
      items: allGenres,
      metadata: { page: page + 1 },
    };
  }

  async getSection(section: string, page: number): Promise<SearchResponse> {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent("section")
      .addPathComponent(section.replaceAll("_", "-"))
      .setQueryItems({
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        adult: getShowAdultStatus(),
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
    const genres = {
      ...query.metadata?.genres,
      ...query.metadata?.demographic,
      ...query.metadata?.more,
      ...query.metadata?.themes,
    };
    const formattedGenres = Object.entries(genres).map(([genre, state]) => {
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
        adult: query.metadata?.adult ?? getShowAdultStatus(),
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
