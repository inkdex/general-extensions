import {
  BasicRateLimiter,
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";
import { filter } from "./main";
import type {
  ApiResponse,
  ResultManga,
  MangaItem,
  ResultChapter,
  ResultFilter,
  ChapterPages,
} from "./models";

const BASE_API = "https://comix.to/api/v2";
export class MainInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${BASE_API}/`,
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
        url: request.url,
        method: request.method ?? "GET",
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
  private checkResponseError(request: Request, response: Response): void {
    switch (response.status) {
      case 200:
        break;
      case 400:
        throw new Error("400 – Bad Request: The request was invalid.");
      case 401:
        throw new Error("401 – Unauthorized: Authentication is required.");
      case 404:
        throw new Error(`404 – Not Found: The resource ${response.url} was not found.`);
      case 408:
        throw new Error("408 – Request Timeout: The server took too long to respond.");
      case 429:
        throw new Error("429 – Too Many Requests: Rate limit exceeded.");
      case 500:
        throw new Error("500 – Internal Server Error: A server error occurred.");
      case 502:
        throw new Error("502 – Bad Gateway: Invalid response from upstream server.");
      case 504:
        throw new Error("504 – Gateway Timeout: Server response timed out.");
      case 403:
      case 503:
        throw new CloudflareError(request, "Error Code: " + response.status);
      default:
        throw new Error(`Unexpected HTTP error: ${response.status}`);
    }
  }
  private build(section: string, page: number): string {
    const hidden_gen = filter.getHiddenGenresSettings();
    const hidden_them = filter.getHiddenThemesSettings();
    const allGenres = [...hidden_gen, ...hidden_them];
    const show_only = filter.getShowOnlySettings();
    const limit = filter.getLimitSettings();
    const additionalInfo = ["author"];
    switch (section) {
      case "popular": {
        const url = new URL(BASE_API).addPathComponent("top");
        url.setQueryItem("type", "trending");
        url.setQueryItem("days", limit);
        url.setQueryItem("limit", "15");
        url.setQueryItem("includes[]", additionalInfo);
        if (show_only.length > 0) url.setQueryItem("types[]", show_only);
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      case "trending_manga": {
        const url = new URL(BASE_API).addPathComponent("manga");
        url.setQueryItem("order[views_30d]", "desc");
        url.setQueryItem("types[]", "manga");
        url.setQueryItem("limit", "28");
        url.setQueryItem("release_year[from]", (new Date().getFullYear() - 1).toString());
        url.setQueryItem("includes[]", additionalInfo);
        url.setQueryItem("page", page.toString());
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      case "trending_wt": {
        const url = new URL(BASE_API).addPathComponent("manga");
        url.setQueryItem("order[views_30d]", "desc");
        url.setQueryItem("types[]", ["manhwa", "manhua"]);
        url.setQueryItem("limit", "28");
        url.setQueryItem("release_year[from]", (new Date().getFullYear() - 1).toString());
        url.setQueryItem("includes[]", additionalInfo);
        url.setQueryItem("page", page.toString());
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      case "follow": {
        const url = new URL(BASE_API).addPathComponent("top");
        url.setQueryItem("type", "follows");
        url.setQueryItem("days", limit);
        url.setQueryItem("limit", "50");
        url.setQueryItem("includes[]", additionalInfo);
        if (show_only.length > 0) url.setQueryItem("types[]", show_only);
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      case "recent": {
        const url = new URL(BASE_API).addPathComponent("manga");
        url.setQueryItem("order[created_at]", "desc");
        url.setQueryItem("page", page.toString());
        url.setQueryItem("limit", "20");
        url.setQueryItem("includes[]", additionalInfo);
        if (show_only.length > 0) url.setQueryItem("types[]", show_only);
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      case "completed": {
        const url = new URL(BASE_API).addPathComponent("manga");
        url.setQueryItem("statuses[]", "finished");
        url.setQueryItem("order[chapter_updated_at]", "desc");
        url.setQueryItem("page", page.toString());
        url.setQueryItem("limit", "20");
        if (show_only.length > 0) url.setQueryItem("types[]", show_only);
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      case "updatesHot": {
        const url = new URL(BASE_API).addPathComponent("manga");
        url.setQueryItem("order[chapter_updated_at]", "desc");
        url.setQueryItem("page", page.toString());
        url.setQueryItem("limit", "20");
        url.setQueryItem("scope", "hot");
        if (show_only.length > 0) url.setQueryItem("types[]", show_only);
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      case "updatesNew": {
        const url = new URL(BASE_API).addPathComponent("manga");
        url.setQueryItem("order[chapter_updated_at]", "desc");
        url.setQueryItem("page", page.toString());
        url.setQueryItem("limit", "20");
        url.setQueryItem("scope", "new");
        if (show_only.length > 0) url.setQueryItem("types[]", show_only);
        if (allGenres.length > 0) url.setQueryItem("exclude_genres[]", allGenres);
        return url.toString();
      }
      default:
        throw new Error(`${section} not found on API`);
    }
  }

  private async getDataFromRequest(): Promise<string> {
    const request = {
      url: this.apiLink,
      method: "GET",
    };
    const [response, data] = await Application.scheduleRequest(request);
    this.checkResponseError(request, response);
    return Application.arrayBufferToUTF8String(data);
  }

  async getJsonMangaApi(section: string, page: number) {
    this.apiLink = this.build(section, page);
    const html = await this.getDataFromRequest();
    try {
      return JSON.parse(html) as ApiResponse<ResultManga>;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getJsonMangaInfoApi(mangaId: string) {
    const url = new URL(BASE_API).addPathComponent("manga");
    const additionalInfo = ["author", "artist", "genre", "theme", "demographic"];
    url.addPathComponent(mangaId);
    url.setQueryItem("includes[]", additionalInfo);
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest();
    try {
      return JSON.parse(html) as ApiResponse<MangaItem>;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getJsonChapterApi(chapter: string, page: number) {
    const url = new URL(BASE_API).addPathComponent("manga");
    url.addPathComponent(chapter);
    url.addPathComponent("chapters");
    url.setQueryItem("page", page.toString());
    url.setQueryItem("limit", "100");
    url.setQueryItem("order[number]", "desc");
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest();
    try {
      return JSON.parse(html) as ApiResponse<ResultChapter>;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getJsonSearchApi(
    keyword: string,
    page: number,
    genres: string[],
    themes: string[],
    types: string[],
    demographic: string[],
    status: string[],
    formats: string[],
    mode: string,
    sortBy: string,
    orderBy: string,
  ) {
    const url = new URL(BASE_API).addPathComponent("manga");
    if (keyword.length > 0) url.setQueryItem("keyword", keyword);
    const allGenres = [...genres, ...themes, ...formats];
    if (allGenres.length > 0) url.setQueryItem("genres[]", allGenres);
    if (types.length > 0) url.setQueryItem("types[]", types);
    if (demographic.length > 0) url.setQueryItem("demographics[]", demographic);
    if (status.length > 0) url.setQueryItem("statuses[]", status);
    url.setQueryItem("page", page.toString());
    url.setQueryItem(`order[${sortBy}]`, orderBy);
    url.setQueryItem("genres_mode", mode);
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest();
    try {
      return JSON.parse(html) as ApiResponse<ResultManga>;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getJsonChapPagesApi(chapterId: string) {
    const url = new URL(BASE_API).addPathComponent("chapters");
    url.addPathComponent(chapterId);
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest();
    try {
      return JSON.parse(html) as ApiResponse<ChapterPages>;
    } catch {
      throw new Error("Json parse failed");
    }
  }

  async getFiltersApi(filter: string) {
    const url = new URL(BASE_API).addPathComponent("terms");
    url.setQueryItem("limit", "100");
    url.setQueryItem("type", filter);
    this.apiLink = url.toString();
    const html = await this.getDataFromRequest();
    try {
      return JSON.parse(html) as ApiResponse<ResultFilter>;
    } catch {
      throw new Error("Json parse failed");
    }
  }
}
