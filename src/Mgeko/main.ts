/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  EndOfPageResults,
  URL,
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
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SortingOption,
  type SourceManga,
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { DOMAIN, type BrowseResult, type Metadata } from "./models";
import {
  parseChapterDetails,
  parseChapters,
  parseGenreTags,
  parseMangaDetails,
  parseOldSearch,
  parseSearch,
  parseViewMore,
} from "./parsers";
import { MgekoInterceptor } from "./network";

type MgekoImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  DiscoverSectionProviding &
  CloudflareBypassRequestProviding;

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
      url: new URL(DOMAIN).addPathComponent("browse-comics").toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    return parseGenreTags($);
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const request: Request = {
      url: new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString(),
      method: "GET",
    };
    const $ = await this.fetchCheerio(request);
    return parseMangaDetails($, mangaId, DOMAIN);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const request: Request = {
      url: new URL(DOMAIN)
        .addPathComponent("manga")
        .addPathComponent(sourceManga.mangaId)
        .addPathComponent("all-chapters")
        .toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    return parseChapters($, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const request: Request = {
      url: new URL(DOMAIN)
        .addPathComponent("reader")
        .addPathComponent("en")
        .addPathComponent(chapter.chapterId)
        .toString(),
      method: "GET",
    };
    const $ = await this.fetchCheerio(request);
    return parseChapterDetails($, chapter);
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    const filters: SearchFilter[] = [];

    const searchTags = await this.getGenreTags();
    for (const tags of searchTags) {
      if (tags.id === "genres") {
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
      } else {
        filters.push({
          type: "dropdown",
          options: [
            { id: "", value: "Any" },
            ...tags.tags.map((x) => ({ id: x.id, value: x.title })),
          ],
          id: tags.id,
          title: tags.title,
          value: "",
        });
      }
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
        url: new URL(DOMAIN)
          .addPathComponent("autocomplete")
          .setQueryItem("term", query.title.trim())
          .toString(),
        method: "GET",
      };

      const $ = await this.fetchCheerio(request);

      const manga = parseOldSearch($, DOMAIN);

      return {
        items: manga,
      };
    } else {
      const urlBuilder = new URL(DOMAIN).addPathComponent("browse-comics").addPathComponent("data");

      urlBuilder.setQueryItem("page", page.toString());

      urlBuilder.setQueryItem("sort", sortingOption?.id ?? "rating");

      // Tag/Filter Search
      const getFilterValue = (id: string) =>
        query.filters?.find((filter) => filter.id === id)?.value;

      const genres = (getFilterValue("genres") as Record<string, "included" | "excluded">) ?? {};

      const genreIncluded = Object.entries(genres)
        .filter(([, value]) => value === "included")
        .map(([key]) => key)
        .join(",");

      urlBuilder.setQueryItem("genre_included", genreIncluded);

      const genreExcluded = Object.entries(genres)
        .filter(([, value]) => value === "excluded")
        .map(([key]) => key)
        .join(",");

      urlBuilder.setQueryItem("genre_excluded", genreExcluded);

      const status = (getFilterValue("status") as string) ?? "";
      if (status) urlBuilder.setQueryItem("status", status);

      const type = (getFilterValue("type") as string) ?? "";
      if (type) urlBuilder.setQueryItem("type", type);

      const request = {
        url: urlBuilder.toString(),
        method: "GET",
      };

      const parsedData = await this.fetchApi<BrowseResult>(request);
      const $ = cheerio.load(parsedData.results_html, {
        xml: {
          xmlMode: false,
          decodeEntities: false,
        },
      });

      const manga = parseSearch($, DOMAIN);

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
      url: new URL(DOMAIN)
        .addPathComponent("browse-comics")
        .addPathComponent("data")
        .setQueryItem("page", page.toString())
        .setQueryItem("sort", sort)
        .toString(),
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

  async fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
    const [, data] = await Application.scheduleRequest(request);
    return cheerio.load(Application.arrayBufferToUTF8String(data), {
      xml: {
        xmlMode: false,
        decodeEntities: false,
      },
    });
  }

  async fetchApi<T>(request: Request): Promise<T> {
    const [, data] = await Application.scheduleRequest(request);

    try {
      return JSON.parse(Application.arrayBufferToUTF8String(data)) as T;
    } catch {
      throw new Error(`Failed to fetch data from ${request.url} (Invalid response)`);
    }
  }
}

export const Mgeko = new MgekoExtension();
