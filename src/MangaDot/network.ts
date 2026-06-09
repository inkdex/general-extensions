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
  type ApiRequestConfig,
  type ChapterListResponse,
  type ChapterPagesResponse,
  DOMAIN,
  type MangaDataResponse,
  type MangaSection,
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
  getTimeRangeStatus,
} from "./utils";

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

  private async buildApiRequest<T>(api: ApiRequestConfig): Promise<T> {
    const url = new URL(DOMAIN);
    const paths = Array.isArray(api.path) ? api.path : [api.path];
    paths.forEach((p) => url.addPathComponent(p));
    if (api.query) {
      for (const [key, value] of Object.entries(api.query)) {
        url.setQueryItem(key, value);
      }
    }
    const request: Request = { url: url.toString(), method: "GET" };
    if (api.headers !== undefined) {
      request.headers = api.headers;
    }
    return this.fetchApi<T>(request);
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
  async getSection(section: string, page: number): Promise<SearchResponse | MangaSection> {
    if (section === "most_viewed") {
      return this.getMostViewed(page);
    } else if (getTimeRangeStatus()[0] === "") {
      return this.getAllTimesSection(section, page);
    } else {
      return this.getTimeRangeSection(section);
    }
  }
  async getAllTimesSection(section: string, page: number): Promise<SearchResponse> {
    const params: ApiRequestConfig = {
      path: ["api", "manga", "section", section.replaceAll("_", "-")],
      query: {
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        adult: getShowAdultStatus(),
        page: page.toString(),
      },
    };
    return this.buildApiRequest<SearchResponse>(params);
  }

  getMostViewed(page: number): Promise<SearchResponse> {
    const params: ApiRequestConfig = {
      path: ["api", "search"],
      query: {
        page: page.toString(),
        sortBy: "views",
        sortOrder: "desc",
        adult: getShowAdultStatus(),
      },
    };
    return this.buildApiRequest<SearchResponse>(params);
  }

  async getTimeRangeSection(section: string): Promise<MangaSection> {
    const params: ApiRequestConfig = {
      path: ["api", "manga", "section"],
      query: {
        id: section,
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        adult: getShowAdultStatus(),
        range: getTimeRangeStatus(),
        limit: "100",
      },
    };
    return this.buildApiRequest<MangaSection>(params);
  }

  async getMangaData(mangaId: string) {
    const params: ApiRequestConfig = {
      path: ["api", "manga", mangaId],
    };
    return this.buildApiRequest<MangaDataResponse>(params);
  }

  async getChapterList(mangaId: string) {
    const params: ApiRequestConfig = {
      path: ["api", "manga", mangaId, "chapters", "list"],
    };
    return this.buildApiRequest<ChapterListResponse[]>(params);
  }

  async getVolumes(mangaId: string) {
    const params: ApiRequestConfig = {
      path: ["api", "manga", mangaId, "volumes"],
    };
    return this.buildApiRequest<Volumes[]>(params);
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
    const params: ApiRequestConfig = {
      path: ["api", "search"],
      query: {
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
      },
    };
    return this.buildApiRequest<SearchResponse>(params);
  }

  async getChapterPages(chapterId: string, mangaId: string, upload: string | undefined) {
    const chapPath = upload === "trusted" ? "uploads" : "chapters";
    const params: ApiRequestConfig = {
      path: ["api", chapPath, chapterId, "images"],
      headers: { referer: `${DOMAIN}/manga/${mangaId}` },
    };
    return this.buildApiRequest<ChapterPagesResponse>(params);
  }

  async getFilters() {
    const params: ApiRequestConfig = {
      path: ["api", "manga", "genres"],
    };
    return this.buildApiRequest<string[]>(params);
  }

  async getAuthor(value: string) {
    const params: ApiRequestConfig = {
      path: ["api", "manga", "people-suggest"],
      query: {
        kind: "author",
        q: value,
      },
    };
    return this.buildApiRequest<SearchSuggestionsResponse>(params);
  }

  async getArtist(value: string) {
    const params: ApiRequestConfig = {
      path: ["api", "manga", "people-suggest"],
      query: {
        kind: "artist",
        q: value,
      },
    };
    return this.buildApiRequest<SearchSuggestionsResponse>(params);
  }
}
