/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
  CloudflareError,
} from "@paperback/types";

import { filter } from "./main";
import {
  type ApiResponse,
  type ApiRequestConfig,
  type ChapterPages,
  type Filters,
  type MangaItem,
  type ResultChapter,
  type ResultManga,
  API,
  DOMAIN,
  type Filter,
} from "./models";
import { ComixHash } from "./utils/comixHash";
import { getSectionTimesType } from "./utils/globalFilters";

export class MainInterceptor extends PaperbackInterceptor {
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

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: 5,
  bufferInterval: 1,
  ignoreImages: true,
});

export class ApiMaker {
  apiLink = "";

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
    const hiddenGenres = [...filter.getHiddenGenresSettings(), ...filter.getHiddenDemogSettings()];
    const types = filter.getShowOnlySettings();
    const days = filter.getLimitSettings()[0];
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
    const hiddenGenres = [...filter.getHiddenGenresSettings(), ...filter.getHiddenDemogSettings()];
    const types = filter.getShowOnlySettings();
    const days = filter.getLimitSettings()[0];
    const additionalInfo = ["author"];
    const year = filter.getYearSettings();
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
          ...(getSectionTimesType() && {
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
          ...(getSectionTimesType() && {
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

  async getJsonChapterApi(chapter: string, page: number) {
    const path = `/manga/${chapter}/chapters`;
    const timeVal = 1;
    const hashToken = ComixHash.generateHash(path);
    return this.APIJson<ResultChapter>({
      path: ["manga", chapter, "chapters"],
      query: {
        page: page.toString(),
        limit: "100",
        "order[number]": "desc",
        time: timeVal.toString(),
        _: hashToken,
      },
    });
  }

  async getJsonSearchApi(
    keyword: string,
    page: number,
    filters: Filters[],
    mode: string,
    sortBy: string,
    orderBy: string,
  ) {
    const query: Record<string, string | string[]> = {
      page: page.toString(),
      [`order[${sortBy}]`]: orderBy,
      genres_mode: mode,
    };
    if (keyword.length > 1) {
      query.keyword = keyword;
    }
    filters.forEach((f) => {
      query[f.type] = f.filters;
    });
    return this.APIJson<ResultManga>({ path: "manga", query: query });
  }

  async getJsonChapPagesApi(chapterId: string) {
    const path = `/chapters/${chapterId}`;
    const hashToken = ComixHash.generateHash(path);
    return this.APIJson<ChapterPages>({
      path: ["chapters", chapterId],
      query: {
        _: hashToken,
      },
    });
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
