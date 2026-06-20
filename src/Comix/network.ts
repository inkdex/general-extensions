/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Chapter,
  type CookieStorageInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

import {
  DOMAIN,
  type ApiResponse,
  type ApiRequestConfig,
  type ChapterItem,
  type ChapterPages,
  type Filters,
  type ResultManga,
  type Filter,
} from "./models";
import { decryptImage, readEncHeaders } from "./utils/decryptImage";
import { descrambleImage, readScrambleHeaders } from "./utils/descramble";
import type { ComixFilter } from "./utils/filter";
import { browseViaWebView, chapterListViaWebView, pageListViaWebView } from "./utils/webView";

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

    // Page images are tile-shuffled (X-Scramble-*) or byte-XOR'd (X-Enc-*) — the
    // site mixes both. Key off headers (a scrambled prefix defeats mime-sniffing).
    const scrambleParams = readScrambleHeaders(response.headers);
    if (scrambleParams) {
      try {
        return await descrambleImage(data, scrambleParams, response.mimeType ?? "image/webp");
      } catch (error) {
        console.log(
          `[Comix] descramble failed for ${request.url} (algo=${scrambleParams.algo} seed=${scrambleParams.seed}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return data;
      }
    }

    const encParams = readEncHeaders(response.headers);
    if (encParams) {
      try {
        return decryptImage(data, encParams);
      } catch (error) {
        console.log(
          `[Comix] image decrypt failed for ${request.url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return data;
      }
    }

    return data;
  }
}

export class ComixApi {
  constructor(private filter: ComixFilter) {}

  private async APIJson<T>(api: ApiRequestConfig): Promise<ApiResponse<T>> {
    const url = new URL(DOMAIN).addPathComponent("api").addPathComponent("v1");
    const paths = Array.isArray(api.path) ? api.path : [api.path];
    paths.forEach((p) => url.addPathComponent(p));
    if (api.query) {
      for (const [key, value] of Object.entries(api.query)) {
        url.setQueryItem(key, value);
      }
    }
    const html = await this.fetchText(url.toString());
    return JSON.parse(html) as ApiResponse<T>;
  }

  private browseUrl(query: Record<string, string | string[]>): string {
    const url = new URL(DOMAIN).addPathComponent("browse");
    for (const [key, value] of Object.entries(query)) {
      url.setQueryItem(key, value);
    }
    return url.toString();
  }

  async getJsonMangaTopApi(
    section: string,
    cookieStorageInterceptor: CookieStorageInterceptor,
  ): Promise<ApiResponse<ResultManga>> {
    const hiddenGenres = [
      ...this.filter.getHiddenGenresSettings(),
      ...this.filter.getHiddenDemogSettings(),
    ];
    const types = this.filter.getShowOnlySettings();
    // `/api/v1/manga/top` (trending/follows + days window) is now 403 and has no
    // `/browse` HTML equivalent, so map to the closest browse orderings.
    const sections: Record<string, Record<string, string | string[]>> = {
      popular: {
        "order[score]": "desc",
        ...(types.length > 0 && { "types[]": types }),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
      },
      follow: {
        "order[follows_total]": "desc",
        ...(types.length > 0 && { "types[]": types }),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
      },
    };
    const query = sections[section];
    if (!query) throw new Error(`${section} not found on API`);
    const result = await browseViaWebView(this.browseUrl(query), cookieStorageInterceptor);
    return { status: "ok", result };
  }

  async getJsonMangaApi(
    section: string,
    page: number,
    cookieStorageInterceptor: CookieStorageInterceptor,
  ): Promise<ApiResponse<ResultManga>> {
    const hiddenGenres = [
      ...this.filter.getHiddenGenresSettings(),
      ...this.filter.getHiddenDemogSettings(),
    ];
    const types = this.filter.getShowOnlySettings();
    const year = this.filter.getYearSettings();
    const sections: Record<string, Record<string, string | string[]>> = {
      trending_manga: {
        "order[views_30d]": "desc",
        "types[]": "manga",
        page: page.toString(),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        ...(this.filter.getSectionTimesType() && {
          "release_year[from]": year.toString(),
        }),
      },
      trending_wt: {
        "order[views_30d]": "desc",
        "types[]": ["manhwa", "manhua"],
        page: page.toString(),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
        ...(this.filter.getSectionTimesType() && {
          "release_year[from]": year.toString(),
        }),
      },
      recent: {
        "order[created_at]": "desc",
        page: page.toString(),
        ...(types.length > 0 && { "types[]": types }),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
      },
      completed: {
        "statuses[]": "finished",
        "order[chapter_updated_at]": "desc",
        page: page.toString(),
        ...(types.length > 0 && { "types[]": types }),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
      },
      updatesHot: {
        "order[chapter_updated_at]": "desc",
        page: page.toString(),
        scope: "hot",
        ...(types.length > 0 && { "types[]": types }),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
      },
      updatesNew: {
        "order[chapter_updated_at]": "desc",
        page: page.toString(),
        ...(types.length > 0 && { "types[]": types }),
        ...(hiddenGenres.length > 0 && { "genres_ex[]": hiddenGenres }),
      },
    };
    const query = sections[section];
    if (!query) throw new Error(`${section} not found on API`);
    const result = await browseViaWebView(this.browseUrl(query), cookieStorageInterceptor);
    return { status: "ok", result };
  }

  private async fetchText(url: string): Promise<string> {
    const data = await Application.scheduleRequest({ url, method: "GET" });
    return Application.arrayBufferToUTF8String(data[1]);
  }

  // Details still server-render their data into `<script id="initial-data">`, so
  // fetch the HTML and let the parser extract it (the JSON API is now 403).
  async getMangaDetailsHtml(mangaId: string): Promise<string> {
    return this.fetchText(`${DOMAIN}/title/${mangaId}`);
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
    mode: string[],
    minChapters: number,
    sortBy: string,
    orderBy: string,
    content: string[],
    cookieStorageInterceptor: CookieStorageInterceptor,
  ): Promise<ApiResponse<ResultManga>> {
    const query: Record<string, string | string[]> = {
      page: page.toString(),
      [`order[${sortBy}]`]: orderBy,
      genres_mode: mode,
      min_chap: minChapters > 0 ? minChapters.toString() : "",
      content_rating: content.join(","),
    };
    if (keyword.length > 1) {
      query.keyword = keyword;
    }
    filters.forEach((f) => {
      query[f.type] = f.filters;
    });
    const result = await browseViaWebView(this.browseUrl(query), cookieStorageInterceptor);
    return { status: "ok", result };
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
