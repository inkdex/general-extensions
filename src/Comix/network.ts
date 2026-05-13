/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Request,
  type Response,
  CloudflareError,
  CookieStorageInterceptor,
  PaperbackInterceptor,
  URL,
} from "@paperback/types";

import {
  type ApiResponse,
  type ApiRequestConfig,
  type ChapterPages,
  type Filters,
  type MangaItem,
  type ResultChapter,
  type ResultManga,
  type Filter,
  API,
  DOMAIN,
} from "./models";
import { ComixFilter } from "./utils/filter";
import { apiViaWebView } from "./utils/webViewSigner";

export class ComixInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent(),
      },
    };
  }

  override async interceptResponse(
    _: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: DOMAIN,
        method: "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }
    return data;
  }
}

export class ComixApi {
  apiLink = "";

  constructor(private filter: ComixFilter) {}

  private async APIJson<T>(api: ApiRequestConfig): Promise<ApiResponse<T>> {
    const url = new URL(API);
    const paths = Array.isArray(api.path) ? api.path : [api.path];
    paths.forEach((p) => url.addPathComponent(p));
    if (api.query) {
      for (const [key, value] of Object.entries(api.query)) {
        url.setQueryItem(key, value);
      }
    }
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest();
    return JSON.parse(html) as ApiResponse<T>;
  }

  private buildApiPath(api: ApiRequestConfig): string {
    const parts = (Array.isArray(api.path) ? api.path : [api.path]).join("/");
    const qs = api.query
      ? Object.entries(api.query)
          .flatMap(([k, v]) =>
            (Array.isArray(v) ? v : [v]).map(
              (x) => `${encodeURIComponent(k)}=${encodeURIComponent(x)}`,
            ),
          )
          .join("&")
      : "";
    return "/" + parts + (qs ? "?" + qs : "");
  }

  async getJsonMangaTopApi(section: string): Promise<ApiResponse<MangaItem[]>> {
    const hiddenGenres = [
      ...this.filter.getHiddenGenresSettings(),
      ...this.filter.getHiddenDemogSettings(),
    ];
    const types = this.filter.getShowOnlySettings();
    const days = this.filter.getLimitSettings()[0];
    const additionalInfo = ["author"];
    const sections: Record<string, ApiRequestConfig> = {
      popular: {
        path: "manga/top",
        query: {
          type: "trending",
          days: days,
          limit: "15",
          "includes[]": additionalInfo,
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        },
      },
      follow: {
        path: "manga/top",
        query: {
          type: "follows",
          days: days,
          limit: "50",
          "includes[]": additionalInfo,
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        },
      },
    };
    const config = sections[section];
    if (!config) throw new Error(`${section} not found on API`);
    return this.APIJson<MangaItem[]>({ path: config.path, query: config.query });
  }

  async getJsonMangaApi(section: string, page: number): Promise<ApiResponse<ResultManga>> {
    const hiddenGenres = [
      ...this.filter.getHiddenGenresSettings(),
      ...this.filter.getHiddenDemogSettings(),
    ];
    const types = this.filter.getShowOnlySettings();
    const days = this.filter.getLimitSettings()[0];
    const additionalInfo = ["author"];
    const year = this.filter.getYearSettings();
    const sections: Record<string, ApiRequestConfig> = {
      popular: {
        path: "manga/top",
        query: {
          type: "trending",
          days: days,
          limit: "15",
          "includes[]": additionalInfo,
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        },
      },
      trending_manga: {
        path: "manga",
        query: {
          "order[views_30d]": "desc",
          "types[]": "manga",
          limit: "28",
          "includes[]": additionalInfo,
          page: page.toString(),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
          ...(this.filter.getSectionTimesType() && {
            "release_year[from]": year.toString(),
          }),
        },
      },
      trending_wt: {
        path: "manga",
        query: {
          "order[views_30d]": "desc",
          "types[]": ["manhwa", "manhua"],
          limit: "28",
          "includes[]": additionalInfo,
          page: page.toString(),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
          ...(this.filter.getSectionTimesType() && {
            "release_year[from]": year.toString(),
          }),
        },
      },
      recent: {
        path: "manga",
        query: {
          "order[created_at]": "desc",
          page: page.toString(),
          limit: "20",
          "includes[]": additionalInfo,
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        },
      },
      completed: {
        path: "manga",
        query: {
          "statuses[]": "finished",
          "order[chapter_updated_at]": "desc",
          page: page.toString(),
          limit: "20",
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        },
      },
      updatesHot: {
        path: "manga",
        query: {
          "order[chapter_updated_at]": "desc",
          page: page.toString(),
          limit: "20",
          scope: "hot",
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        },
      },
      updatesNew: {
        path: "manga",
        query: {
          "order[chapter_updated_at]": "desc",
          page: page.toString(),
          limit: "20",
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        },
      },
    };
    const config = sections[section];
    if (!config) throw new Error(`${section} not found on API`);
    return this.APIJson<ResultManga>({ path: config.path, query: config.query });
  }

  private async getDataFromRequest(): Promise<string> {
    const request = {
      url: this.apiLink,
      method: "GET",
    };
    const data = await Application.scheduleRequest(request);
    return Application.arrayBufferToUTF8String(data[1]);
  }

  async getJsonMangaInfoApi(mangaId: string) {
    return this.APIJson<MangaItem>({
      path: ["manga", mangaId],
      query: {
        "includes[]": ["author", "artist", "genre", "demographic"],
      },
    });
  }

  async getJsonChapterApi(
    chapter: string,
    page: number,
    cookieStorageInterceptor: CookieStorageInterceptor,
  ) {
    const [result] = await apiViaWebView<ResultChapter>(
      [
        this.buildApiPath({
          path: ["manga", chapter, "chapters"],
          query: { page: page.toString(), limit: "100", "order[number]": "desc" },
        }),
      ],
      cookieStorageInterceptor,
    );
    return result;
  }

  async getJsonChapterApiBatch(
    chapter: string,
    fromPage: number,
    toPage: number,
    cookieStorageInterceptor: CookieStorageInterceptor,
  ): Promise<ApiResponse<ResultChapter>[]> {
    const paths: string[] = [];
    for (let page = fromPage; page <= toPage; page++) {
      paths.push(
        this.buildApiPath({
          path: ["manga", chapter, "chapters"],
          query: { page: page.toString(), limit: "100", "order[number]": "desc" },
        }),
      );
    }
    return apiViaWebView<ResultChapter>(paths, cookieStorageInterceptor);
  }

  async getJsonSearchApi(
    keyword: string,
    page: number,
    filters: Filters[],
    mode: string,
    min_chapter: number,
    sortBy: string,
    orderBy: string,
  ) {
    const query: Record<string, string | string[]> = {
      page: page.toString(),
      [`order[${sortBy}]`]: orderBy,
      genres_mode: mode,
      min_chap: min_chapter.toString(),
    };
    if (keyword.length > 1) {
      query.keyword = keyword;
    }
    filters.forEach((f) => {
      query[f.type] = f.filters;
    });
    return this.APIJson<ResultManga>({ path: "manga", query: query });
  }

  async getJsonChapPagesApi(chapterId: string, cookieStorageInterceptor: CookieStorageInterceptor) {
    const [result] = await apiViaWebView<ChapterPages>(
      [this.buildApiPath({ path: ["chapters", chapterId] })],
      cookieStorageInterceptor,
    );
    return result;
  }

  async getFiltersApi(filter: string) {
    return this.APIJson<Filter[]>({
      path: "tags/search",
      query: {
        limit: "50",
        type: filter,
      },
    });
  }
}
