/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  ContentRating,
  PaperbackInterceptor,
  URL,
  type DiscoverSectionItem,
  type PagedResults,
  type Request,
  type Response,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type Tag,
  type Cookie,
  CookieStorageInterceptor,
} from "@paperback/types";

import {
  DOMAIN,
  RANGE,
  type ApiRequestConfig,
  type ChapterListResponse,
  type ChapterPagesResponse,
  type MangaDataResponse,
  type MangaSection,
  type SearchMetadata,
  type SearchResponse,
  type SearchSuggestionsResponse,
  type Volumes,
  type Languages,
  type Profile,
  type ProfileSettings,
  type TagsRequest,
} from "./models";
import {
  defaultMetadata,
  deNormalizeId,
  getDemographicHidden,
  getEnglishOnly,
  getFilters,
  getGenresHidden,
  getMultipageStatus,
  getSectionContentTypes,
  getShowAdultStatus,
  getThemesHidden,
} from "./utils";

export class MangaDotInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      "user-agent": await Application.getDefaultUserAgent(),
      ...request.headers,
    };
    return request;
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
    const [_, data] = await Application.scheduleRequest(request);
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

  private buildTagSection(tags: Tag[], hiddenIds: string[]): PagedResults<DiscoverSectionItem> {
    return {
      items: tags
        .filter((tag) => !hiddenIds.includes(tag.id))
        .map((tag): DiscoverSectionItem => ({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: defaultMetadata(tag.id),
          },
          name: tag.title,
          contentRating: ContentRating.EVERYONE,
        })),
    };
  }

  async getRangeSection(section: string): Promise<PagedResults<DiscoverSectionItem>> {
    return {
      items: RANGE.map((tag): DiscoverSectionItem => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          metadata: { range: tag.id, sectionName: section },
        },
        name: tag.title,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }

  async getGenreSection(): Promise<PagedResults<DiscoverSectionItem>> {
    return this.buildTagSection(getFilters().genre, getGenresHidden());
  }

  async getDemographicSection(): Promise<PagedResults<DiscoverSectionItem>> {
    return this.buildTagSection(getFilters().demographic, getDemographicHidden());
  }

  async getThemesSection(): Promise<PagedResults<DiscoverSectionItem>> {
    return this.buildTagSection(getFilters().themeAndContent, getThemesHidden());
  }
  async getSection(section: string, page: number): Promise<SearchResponse | MangaSection> {
    if (section === "most_viewed") {
      return this.getMostViewed(page);
    }
    if (section === "for_you") {
      return this.getForYouSection(page);
    }
    if (section === "latest_updates") {
      return this.getLatestUpdateSection(page);
    }
    return this.getAllTimesSection(section, page);
  }

  async getForYouSection(page: number): Promise<MangaSection> {
    const params: ApiRequestConfig = {
      path: ["api", "manga", "for-you"],
      query: {
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        adult: getShowAdultStatus(),
        limit: "100",
        page: page.toString(),
      },
    };
    return this.buildApiRequest<MangaSection>(params);
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
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        sortBy: "views",
        sortOrder: "desc",
        adult: getShowAdultStatus(),
      },
    };
    return this.buildApiRequest<SearchResponse>(params);
  }

  async getLatestUpdateSection(page: number): Promise<MangaSection | SearchResponse> {
    if (getMultipageStatus()) {
      const params: ApiRequestConfig = {
        path: ["api", "manga", "section", "latest-updates"],
        query: {
          origin: getSectionContentTypes().join(",").replaceAll("&", ","),
          adult: getShowAdultStatus(),
          page: page.toString(),
        },
      };
      return this.buildApiRequest<SearchResponse>(params);
    } else {
      const params: ApiRequestConfig = {
        path: ["api", "manga", "section"],
        query: {
          id: "latest_updates",
          origin: getSectionContentTypes().join(",").replaceAll("&", ","),
          adult: getShowAdultStatus(),
          limit: "100",
        },
      };
      return this.buildApiRequest<MangaSection>(params);
    }
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
      query: getEnglishOnly() ? { lang: "en" } : {},
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
    const tags = {
      ...query.metadata?.tag,
    };
    const formattedGenres = Object.entries(genres).map(([genre, state]) => {
      const normalized = deNormalizeId(genre);
      return state === "excluded" ? `-${normalized}` : normalized;
    });
    const formattedTags = Object.entries(tags).map(([genre, state]) => {
      const normalized = deNormalizeId(genre);
      return state === "excluded" ? `-${normalized}` : normalized;
    });
    const [sort, order] = sorting.id.split("$");
    const params: ApiRequestConfig = {
      path: ["api", "search"],
      query: {
        ...(query.title && { search: query.title }),
        page: page.toString(),
        ...(formattedGenres.length && { genres: formattedGenres.join(",") }),
        ...(formattedTags.length && { tags: formattedTags.join(",") }),
        ...(query.metadata?.origin?.length && {
          origin: (query.metadata?.origin ?? []).join(",").replaceAll("&", ","),
        }),
        ...(query.metadata?.status?.length && {
          status: (query.metadata?.status ?? []).join(","),
        }),
        ...(query.metadata?.author?.length && {
          author: (query.metadata?.author ?? []).join(","),
        }),
        ...(query.metadata?.artist?.length && {
          artist: (query.metadata?.artist ?? []).join(","),
        }),
        ...(query.metadata?.min_chapters?.length && {
          min_chapters: query.metadata?.chapters ?? "",
        }),
        ...(query.metadata?.min_rating?.length && {
          min_rating: query.metadata?.rating ?? "",
        }),
        ...(query.metadata?.volumes?.length && {
          volumes: query.metadata?.volume ?? "",
        }),
        ...(query.metadata?.library?.length && {
          library: query.metadata?.library ?? "",
        }),
        sortBy: sort,
        sortOrder: order ? order : "",
        content_rating: query.metadata?.contentRating ?? "",
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

  async getLanguages() {
    const params: ApiRequestConfig = {
      path: ["api", "languages"],
    };
    return this.buildApiRequest<Languages>(params);
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

  async MangaSectionRequestToSearchResponse(
    section: string,
    range: string,
  ): Promise<PagedResults<SearchResultItem>> {
    const params: ApiRequestConfig = {
      path: ["api", "manga", "section"],
      query: {
        id: section,
        origin: getSectionContentTypes().join(",").replaceAll("&", ","),
        adult: getShowAdultStatus(),
        range: range,
        limit: "100",
      },
    };
    const mangas = await this.buildApiRequest<MangaSection>(params);
    return {
      items: mangas.items.map((manga) => ({
        mangaId: manga.id.toString(),
        title: manga.title,
        subtitle: `Ch. ${manga.chapter_count} | ★ ${manga.avg_rating}`,
        imageUrl: `${DOMAIN}${manga.photo}`,
        contentRating: manga.is_blurworthy ? ContentRating.ADULT : ContentRating.EVERYONE,
      })),
      metadata: undefined,
    };
  }

  async getTagsList() {
    const params: ApiRequestConfig = {
      path: ["api", "filters", "catalog"],
    };
    return this.buildApiRequest<TagsRequest>(params);
  }

  async getProfile() {
    const params: ApiRequestConfig = {
      path: ["api", "profile"],
    };
    return this.buildApiRequest<Profile>(params);
  }

  async getProfileSettings() {
    const params: ApiRequestConfig = {
      path: ["api", "filters", "me"],
    };
    return this.buildApiRequest<ProfileSettings>(params);
  }

  async putFilters(filters: string[]) {
    await Application.scheduleRequest({
      url: `${DOMAIN}/api/filters/me`,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Origin: `${DOMAIN}`,
        Referer: `${DOMAIN}`,
      },
      body: JSON.stringify({
        hidden_terms: filters.map((f) => deNormalizeId(f)),
      }),
    });
  }
}

export class LogInManager {
  api: MangaDotApi;
  constructor(api: MangaDotApi) {
    this.api = api;
  }

  loginCookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  private readonly AUTH_COOKIE_NAME = "ory_kratos_session";

  async getAccountID() {
    let username = "";
    try {
      username = (await this.api.getProfile()).profile.username;
      if (username && username.length > 0) {
        Application.setSecureState(username, "MangaDot_Username");
        return username;
      }
    } catch {
      this.logOut();
    }
    return username;
  }

  private isAuthCookie(cookie: Cookie): boolean {
    return cookie.name === this.AUTH_COOKIE_NAME;
  }

  checkLoginCookie(cookies: Cookie[]) {
    const cookieNames = new Set(cookies.map((c) => c.name));
    return cookieNames.has(this.AUTH_COOKIE_NAME);
  }

  isLoggedIn() {
    const username = Application.getSecureState("MangaDot_Username") as string | undefined;
    if (username != undefined) {
      if (username.length === 0) {
        this.logOut();
      }
      return true;
    }
    return false;
  }

  async isLoggedInForcedCheck() {
    const username = await this.getAccountID();
    if (!username || username.length === 0) {
      this.logOut();
    }
    return username.length > 0;
  }

  async logIn(cookies: Cookie[]): Promise<void> {
    if (this.checkLoginCookie(cookies)) {
      cookies
        .filter((cookie) => this.isAuthCookie(cookie))
        .forEach((cookie) => {
          if (cookie.name === this.AUTH_COOKIE_NAME) {
            this.loginCookieStorageInterceptor.setCookie(cookie);
          }
        });
      Application.invalidateDiscoverSections();
    }
  }

  logOut(): void {
    this.loginCookieStorageInterceptor.cookies.forEach((cookie) => {
      this.loginCookieStorageInterceptor.deleteCookie(cookie);
    });
    Application.setSecureState(undefined, "MangaDot_Username");
    Application.invalidateDiscoverSections();
  }
}
