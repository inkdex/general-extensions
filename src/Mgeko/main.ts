/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  EndOfPageResults,
  URL,
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type Form,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { getSafeMode, MgekoAdvancedSearchForm, MgekoSettingsForm } from "./forms";
import { DOMAIN, type BrowseResult, type PageMetadata, type SearchMetadata } from "./models";
import { MgekoInterceptor } from "./network";
import {
  parseChapterDetails,
  parseChapters,
  parseGenreTags,
  parseMangaDetails,
  parseOldSearch,
  parseSearch,
  parseViewMore,
} from "./parsers";
import type MgekoConfig from "./pbconfig";

export class MgekoExtension implements ExtensionImpl<typeof MgekoConfig> {
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

  async getSettingsForm(): Promise<Form> {
    return new MgekoSettingsForm();
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
    metadata: PageMetadata | undefined,
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

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new MgekoAdvancedSearchForm(query, await this.getGenreTags());
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
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

      const searchMeta = query.metadata ?? {};
      const genres = searchMeta.genres ?? {};

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

      const status = searchMeta.status ?? "";
      if (status) urlBuilder.setQueryItem("status", status);

      const type = searchMeta.type ?? "";
      if (type) urlBuilder.setQueryItem("type", type);

      const setChapterCount = searchMeta.setChapterCount ?? false;
      if (setChapterCount) {
        const minChapters = searchMeta.minChapters ?? 0;
        const maxChapters = searchMeta.maxChapters ?? 9995;
        urlBuilder.setQueryItem("min_chapters", minChapters.toString());
        urlBuilder.setQueryItem("max_chapters", maxChapters.toString());
      }

      const safeMode = getSafeMode();
      urlBuilder.setQueryItem("safe_mode", Number(safeMode).toString());

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
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    if (metadata?.completed) return EndOfPageResults;

    const page: number = metadata?.page ?? 1;
    const safeMode = getSafeMode();

    const request: Request = {
      url: new URL(DOMAIN)
        .addPathComponent("browse-comics")
        .addPathComponent("data")
        .setQueryItem("page", page.toString())
        .setQueryItem("sort", sort)
        .setQueryItem("safe_mode", Number(safeMode).toString())
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
          metadata: { genres: { [genre.id]: "included" } } satisfies SearchMetadata,
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
