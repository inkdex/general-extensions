import {
  BasicRateLimiter,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";
import { filter } from "./main";
import {
  type ApiResponse,
  type ApiRequestConfig,
  type ChapterPages,
  type Filters,
  type MangaItem,
  type ResultChapter,
  type ResultFilter,
  type ResultManga,
  API,
  DOMAIN,
} from "./models";
import { throwCloudflareError } from "./utils";

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
      await throwCloudflareError();
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
  private async checkResponseError(_: Request, response: Response): Promise<void> {
    switch (response.status) {
      case 200:
        break;
      case 400:
        throw new Error("400 – Bad Request: The request was invalid", { cause: "Client" });
      case 401:
        throw new Error("401 – Unauthorized: Authentication is required", { cause: "Client" });
      case 404:
        throw new Error(`404 – Not Found: The resource "${response.url}" was not found`, {
          cause: "Client",
        });
      case 408:
        throw new Error("408 – Request Timeout: The server took too long to respond", {
          cause: "Client",
        });
      case 429:
        throw new Error("429 – Too Many Requests: Rate limit exceeded", { cause: "Client" });
      case 500:
        throw new Error("500 – Internal Server Error: A server error occurred", {
          cause: "Server",
        });
      case 502:
        throw new Error("502 – Bad Gateway: Invalid response from upstream server", {
          cause: "Server",
        });
      case 503:
        throw new Error("503 – Service Unavailable: The server is temporarily unavailable", {
          cause: "Server",
        });
      case 504:
        throw new Error("504 – Gateway Timeout: Server response timed out", { cause: "Server" });
      case 403:
        await throwCloudflareError();
        break;
      default:
        throw new Error(`Unexpected HTTP error: ${response.status}`, { cause: "Unknown" });
    }
  }

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
    return this.JSONParser<T>(html);
  }

  private build<T>(section: string, page: number): Promise<ApiResponse<T>> {
    const hiddenGenres = [...filter.getHiddenGenresSettings(), ...filter.getHiddenThemesSettings()];
    const types = filter.getShowOnlySettings();
    const days = filter.getLimitSettings()[0];
    const additionalInfo = ["author"];
    const year = filter.getYearSettings();
    const sections: Record<string, ApiRequestConfig> = {
      popular: {
        path: "top",
        query: {
          type: "trending",
          days: days,
          limit: "15",
          "includes[]": additionalInfo,
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
        },
      },
      trending_manga: {
        path: "manga",
        query: {
          "order[views_30d]": "desc",
          "types[]": "manga",
          limit: "28",
          "release_year[from]": year.toString(),
          "includes[]": additionalInfo,
          page: page.toString(),
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
        },
      },
      trending_wt: {
        path: "manga",
        query: {
          "order[views_30d]": "desc",
          "types[]": ["manhwa", "manhua"],
          limit: "28",
          "release_year[from]": year.toString(),
          "includes[]": additionalInfo,
          page: page.toString(),
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
        },
      },
      follow: {
        path: "top",
        query: {
          type: "follows",
          days: days,
          limit: "50",
          "includes[]": additionalInfo,
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
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
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
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
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
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
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
        },
      },
      updatesNew: {
        path: "manga",
        query: {
          "order[chapter_updated_at]": "desc",
          page: page.toString(),
          limit: "20",
          scope: "new",
          ...(types.length > 0 && { "types[]": types }),
          ...(hiddenGenres.length > 0 && { "exclude_genres[]": hiddenGenres }),
        },
      },
    };
    const config = sections[section];
    if (!config) throw new Error(`${section} not found on API`);
    return this.APIJson<T>({ path: config.path, query: config.query });
  }

  private JSONParser<T>(html: string) {
    try {
      return JSON.parse(html) as ApiResponse<T>;
    } catch {
      throw new Error("Json parse failed");
    }
  }
  private async getDataFromRequest(): Promise<string> {
    const request = {
      url: this.apiLink,
      method: "GET",
    };
    const [response, data] = await Application.scheduleRequest(request);
    await this.checkResponseError(request, response);
    return Application.arrayBufferToUTF8String(data);
  }

  async getJsonMangaApi(section: string, page: number) {
    return this.build<ResultManga>(section, page);
  }

  async getJsonMangaInfoApi(mangaId: string) {
    return this.APIJson<MangaItem>({
      path: ["manga", mangaId],
      query: {
        "includes[]": ["author", "artist", "genre", "theme", "demographic"],
      },
    });
  }

  async getJsonChapterApi(chapter: string, page: number) {
    return this.APIJson<ResultChapter>({
      path: ["manga", chapter, "chapters"],
      query: {
        page: page.toString(),
        limit: "100",
        "order[number]": "desc",
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
    if (keyword.length > 0) {
      query.keyword = keyword;
    }
    filters.forEach((f) => {
      query[f.type] = f.filters;
    });
    return this.APIJson<ResultManga>({ path: "manga", query: query });
  }

  async getJsonChapPagesApi(chapterId: string) {
    return this.APIJson<ChapterPages>({ path: ["chapters", chapterId] });
  }

  async getFiltersApi(filter: string) {
    return this.APIJson<ResultFilter>({
      path: "terms",
      query: {
        limit: "100",
        type: filter,
      },
    });
  }
}
