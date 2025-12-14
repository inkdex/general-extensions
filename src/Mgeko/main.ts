import {
  BasicRateLimiter,
  CloudflareError,
  CookieStorageInterceptor,
  DiscoverSectionType,
  EndOfPageResults,
  PaperbackInterceptor,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type Request,
  type Response,
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SortingOption,
  type SourceManga,
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { URLBuilder } from "../utils/url-builder/base";
import type { BrowseResult, Metadata } from "./models";
import {
  parseChapterDetails,
  parseChapters,
  parseGenreTags,
  parseMangaDetails,
  parseOldSearch,
  parseSearch,
  parseViewMore,
} from "./parsers";

const MGEKO_DOMAIN = "https://www.mgeko.cc";

type MgekoImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  DiscoverSectionProviding &
  CloudflareBypassRequestProviding;

class MgekoInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
    request.headers = {
      ...request.headers,
      referer: `${MGEKO_DOMAIN}/`,
      "user-agent": await Application.getDefaultUserAgent(),
    };
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return data;
  }
}

export class MgekoExtension implements MgekoImplementation {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 4,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainRequestInterceptor = new MgekoInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.mainRequestInterceptor.registerInterceptor();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "popular_all_time",
        title: "Popular All Time",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: "top_rated",
        title: "Top Rated",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "latest_updates",
        title: "Latest Updates",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "genres",
        title: "Genres",
        type: DiscoverSectionType.genres,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular_all_time":
        return this.getFilteredSectionItems("popular_all_time", metadata);
      case "top_rated":
        return this.getFilteredSectionItems("rating", metadata);
      case "latest_updates":
        return this.getFilteredSectionItems("latest", metadata);
      case "genres":
        return this.getGenreSectionItems();
      default:
        return {
          items: [],
          metadata: undefined,
        };
    }
  }

  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (
        cookie.name.startsWith("cf") ||
        cookie.name.startsWith("_cf") ||
        cookie.name.startsWith("__cf")
      ) {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  async getGenreTags(): Promise<TagSection[]> {
    const request: Request = {
      url: new URLBuilder(MGEKO_DOMAIN).addPath("browse-comics").build(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    return parseGenreTags($);
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const request: Request = {
      url: new URLBuilder(MGEKO_DOMAIN).addPath("manga").addPath(mangaId).build(),
      method: "GET",
    };
    const $ = await this.fetchCheerio(request);
    return parseMangaDetails($, mangaId, MGEKO_DOMAIN);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const request: Request = {
      url: new URLBuilder(MGEKO_DOMAIN)
        .addPath("manga")
        .addPath(sourceManga.mangaId)
        .addPath("all-chapters")
        .build(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    return parseChapters($, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const request: Request = {
      url: new URLBuilder(MGEKO_DOMAIN)
        .addPath("reader")
        .addPath("en")
        .addPath(chapter.chapterId)
        .build(),
      method: "GET",
    };
    const $ = await this.fetchCheerio(request);
    return parseChapterDetails($, chapter);
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    const filters: SearchFilter[] = [];

    const searchTags = await this.getGenreTags();
    for (const tags of searchTags) {
      filters.push({
        type: "multiselect",
        options: tags.tags.map((x) => ({ id: x.id, value: x.title })),
        id: tags.id,
        allowExclusion: true,
        title: tags.title,
        value: {},
        allowEmptySelection: true,
        maximum: undefined,
      });
    }

    return filters;
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "rating", label: "Top Rated" },
      { id: "latest", label: "Latest" },
      { id: "recently_added", label: "Recently Added" },
      { id: "popular_daily", label: "Popular Daily" },
      { id: "popular_weekly", label: "Popular Weekly" },
      { id: "popular_monthly", label: "Popular Monthly" },
      { id: "popular_all_time", label: "Popular All Time" },
      { id: "az", label: "Title (A-Z)" },
      { id: "za", label: "Title (Z-A)" },
    ];
  }

  async getSearchResults(
    query: SearchQuery,
    metadata: Metadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page: number = metadata?.page ?? 1;
    const isQuerySearch = query.title?.trim().length ?? 0 != 0;

    // Regular search
    if (isQuerySearch) {
      const request = {
        url: new URLBuilder(MGEKO_DOMAIN)
          .addPath("autocomplete")
          .addQuery("term", encodeURI(query.title.trim()))
          .build(),
        method: "GET",
      };

      const $ = await this.fetchCheerio(request);

      const manga = parseOldSearch($, MGEKO_DOMAIN);

      return {
        items: manga,
      };
    } else {
      const urlBuilder = new URLBuilder(MGEKO_DOMAIN).addPath("browse-comics").addPath("data");

      urlBuilder.addQuery("page", page);

      urlBuilder.addQuery("sort", sortingOption?.id ?? "rating");

      // Tag/Filter Search
      const getFilterValue = (id: string) =>
        query.filters?.find((filter) => filter.id === id)?.value;

      const genres = (getFilterValue("genres") as Record<string, "included" | "excluded">) ?? {};

      const genreIncluded = Object.entries(genres)
        .filter(([, value]) => value === "included")
        .map(([key]) => key)
        .join(",");

      urlBuilder.addQuery("genre_included", genreIncluded);

      const genreExcluded = Object.entries(genres)
        .filter(([, value]) => value === "excluded")
        .map(([key]) => key)
        .join(",");

      urlBuilder.addQuery("genre_excluded", genreExcluded);

      const request = {
        url: urlBuilder.build(),
        method: "GET",
      };

      const parsedData = await this.fetchApi<BrowseResult>(request);
      const $ = cheerio.load(parsedData.results_html, {
        xml: {
          xmlMode: false,
          decodeEntities: false,
        },
      });

      const manga = parseSearch($, MGEKO_DOMAIN);

      metadata = parsedData.page < parsedData.num_pages ? { page: page + 1 } : undefined;
      return {
        items: manga,
        metadata: metadata,
      };
    }
  }

  private async getFilteredSectionItems(
    sort: string,
    metadata: Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    if (metadata?.completed) return EndOfPageResults;

    const page: number = metadata?.page ?? 1;

    const request: Request = {
      url: new URLBuilder(MGEKO_DOMAIN)
        .addPath("browse-comics")
        .addPath("data")
        .addQuery("page", page)
        .addQuery("sort", sort)
        .build(),
      method: "GET",
    };
    const parsedData = await this.fetchApi<BrowseResult>(request);
    const $ = cheerio.load(parsedData.results_html, {
      xml: {
        xmlMode: false,
        decodeEntities: false,
      },
    });
    const manga = parseViewMore($);
    metadata = parsedData.page < parsedData.num_pages ? { page: page + 1 } : undefined;

    return {
      items: manga,
      metadata: metadata,
    };
  }

  async getGenreSectionItems(): Promise<PagedResults<DiscoverSectionItem>> {
    const genres = (await this.getGenreTags())[0];

    return {
      items: genres.tags.map((genre) => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          filters: [{ id: "genres", value: { [genre.id]: "included" } }],
        },
        name: genre.title,
        metadata: undefined,
      })),
      metadata: undefined,
    };
  }

  checkCloudflareStatus(status: number): void {
    if (status == 503 || status == 403) {
      throw new CloudflareError({ url: MGEKO_DOMAIN, method: "GET" });
    }
  }

  async fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
    const [response, data] = await Application.scheduleRequest(request);
    this.checkCloudflareStatus(response.status);
    return cheerio.load(Application.arrayBufferToUTF8String(data), {
      xml: {
        xmlMode: false,
        decodeEntities: false,
      },
    });
  }

  async fetchApi<T>(request: Request): Promise<T> {
    let response: Response;
    let data: ArrayBuffer;
    try {
      [response, data] = await Application.scheduleRequest(request);
      this.checkCloudflareStatus(response.status);
    } catch {
      throw new Error(`Failed to fetch data from ${request.url} (request error)`);
    }

    try {
      return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
    } catch {
      throw new Error(`Failed to fetch data from ${request.url} (Invalid response)`);
    }
  }
}

export const Mgeko = new MgekoExtension();
