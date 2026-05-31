/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Chapter,
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
  type ChapterItem,
  type ChapterPages,
  type Filters,
  type MangaItem,
  type ResultManga,
  type Filter,
  API,
  DOMAIN,
} from "./models";
import { descrambleImage, readScrambleHeaders } from "./utils/descramble";
import { ComixFilter } from "./utils/filter";
import { chapterListViaWebView, pageListViaWebView } from "./utils/webView";

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
    request: Request,
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

    if (!/\/si?i\//i.test(request.url)) return data;

    const scrambleParams = readScrambleHeaders(response.headers);
    if (!scrambleParams) return data;

    try {
      return await descrambleImage(data, scrambleParams, response.mimeType ?? "image/webp");
    } catch (error) {
      console.log(
        `[Comix] descramble failed for ${request.url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return data;
    }
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
    mangaId: string,
    cookieStorageInterceptor: CookieStorageInterceptor,
  ): Promise<ChapterItem[]> {
    return chapterListViaWebView(mangaId, cookieStorageInterceptor);
  }

  async getJsonSearchApi(
    keyword: string,
    page: number,
    filters: Filters[],
    mode: string,
    min_chapter: number,
    sortBy: string,
    orderBy: string,
    content: string,
  ) {
    const query: Record<string, string | string[]> = {
      page: page.toString(),
      [`order[${sortBy}]`]: orderBy,
      genres_mode: mode,
      min_chap: min_chapter > 0 ? min_chapter.toString() : "",
      content_rating: content,
    };
    if (keyword.length > 1) {
      query.keyword = keyword;
    }
    filters.forEach((f) => {
      query[f.type] = f.filters;
    });
    return this.APIJson<ResultManga>({ path: "manga", query: query });
  }

  async getJsonChapPagesApi(chapter: Chapter, cookieStorageInterceptor: CookieStorageInterceptor) {
    const url = chapter.additionalInfo?.url;
    if (typeof url !== "string" || !url) {
      throw new Error(`Comix getJsonChapPagesApi: missing url for chapter ${chapter.chapterId}`);
    }
    const payload = await pageListViaWebView(url, cookieStorageInterceptor);
    return JSON.parse(payload) as ApiResponse<ChapterPages>;
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
