/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
  Form,
  URL,
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { getLanguages, MangaFireAdvancedSearchForm, MangaFireSettingsForm } from "./forms";
import {
  DOMAIN,
  Genres,
  type PageMetadata,
  type PageResponse,
  type Result,
  type SearchDetails,
  type SearchMetadata,
} from "./models";
import { MangaFireInterceptor } from "./network";
import {
  hasNextPage,
  parseChapterDetails,
  parseChapters,
  parseMangaDetails,
  parseNewMangaSection,
  parsePopularSection,
  parseSearch,
  parseSearchDetails,
  parseUpdatedSection,
  popularHasNextPage,
} from "./parsers";
import type MangaFireConfig from "./pbconfig";
import { MFLanguages } from "./utils/language";
import { extractVrf, getChapterPagesVrfUrl, getSearchVrfUrl } from "./utils/webViewHelper";

export class MangaFireExtension implements ExtensionImpl<typeof MangaFireConfig> {
  requestManager = new MangaFireInterceptor("main");
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });

  async initialise(): Promise<void> {
    this.requestManager.registerInterceptor();
    this.globalRateLimiter.registerInterceptor();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "popular_section",
        title: "Popular",
        type: DiscoverSectionType.featured,
      },
      {
        id: "updated_section",
        title: "Recently Updated",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: "new_manga_section",
        title: "New Manga",
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "languages_section",
        title: "Languages",
        type: DiscoverSectionType.genres,
      },
      {
        id: "types_section",
        title: "Types",
        type: DiscoverSectionType.genres,
      },
      {
        id: "genres_section",
        title: "Genres",
        type: DiscoverSectionType.genres,
      },
    ];
  }

  async getSettingsForm(): Promise<Form> {
    return new MangaFireSettingsForm();
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular_section":
        return this.getPopularSectionItems(metadata);
      case "updated_section":
        return this.getUpdatedSectionItems(metadata);
      case "new_manga_section":
        return this.getNewMangaSectionItems(metadata);
      case "types_section":
        return this.getTypesSection();
      case "genres_section":
        return this.getFilterSection();
      case "languages_section":
        return this.getLanguagesSection();
      default:
        return { items: [] };
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

  private async getSearchDetails(): Promise<SearchDetails | undefined> {
    try {
      const request = {
        url: `${DOMAIN}/filter`,
        method: "GET",
      };

      const $ = await this.fetchCheerio(request);
      return parseSearchDetails($);
    } catch (error) {
      console.error("Error fetching search details:", error);
    }
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new MangaFireAdvancedSearchForm(query, await this.getSearchDetails());
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    const searchDetails = await this.getSearchDetails();
    return searchDetails?.sorts ?? [];
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: { page?: number } | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    // Example: https://mangafire.to/filter?keyword=one%20piece&page=1&genre_mode=and&type[]=manhwa&genre[]=action&status[]=releasing&sort=most_relevance
    // Multple Genres: https://mangafire.to/filter?keyword=one+piece&type%5B%5D=manga&genre%5B%5D=1&genre%5B%5D=31&genre_mode=and&status%5B%5D=releasing&sort=most_relevance
    // No Genre: https://mangafire.to/filter?keyword=one+piece&type%5B%5D=manga&genre_mode=and&status%5B%5D=releasing&sort=most_relevance
    // With pages: https://mangafire.to/filter?page=2&keyword=one%20piece
    // ALL: https://mangafire.to/filter?keyword=one+peice&sort=recently_updated
    // Exclude: https://mangafire.to/filter?keyword=&genre%5B%5D=-9&sort=recently_updated
    const searchUrl = new URL(DOMAIN)
      .addPathComponent("filter")
      .setQueryItem("keyword", query.title)
      .setQueryItem("page", page.toString())
      .setQueryItem("genre_mode", "and");

    if (query.title.trim()) {
      const vrf = extractVrf(await getSearchVrfUrl(query.title, this.cookieStorageInterceptor));
      searchUrl.setQueryItem("vrf", vrf);
    }

    const meta = query.metadata ?? {};
    const { type, genres, status, language, year, length } = meta;

    if (type) {
      searchUrl.setQueryItem("type[]", type);
    }

    if (genres) {
      const genreValues = Object.entries(genres).flatMap(([id, value]) => {
        if (value === "included") return [id];
        if (value === "excluded") return [`-${id}`];
        return [];
      });
      if (genreValues.length > 0) {
        searchUrl.setQueryItem("genre[]", genreValues);
      }
    }

    if (status) {
      searchUrl.setQueryItem("status[]", status);
    }

    if (language) {
      searchUrl.setQueryItem("language[]", language);
    }

    if (year) {
      searchUrl.setQueryItem("year[]", year);
    }

    if (length) {
      searchUrl.setQueryItem("length[]", length);
    }

    if (sortingOption) {
      searchUrl.setQueryItem("sort", sortingOption.id);
    }

    const request = { url: searchUrl.toString(), method: "GET" };

    const $ = await this.fetchCheerio(request);
    const searchResults = parseSearch($);

    return {
      items: searchResults,
      metadata: hasNextPage($) ? { page: page + 1 } : undefined,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const searchDetails = await this.getSearchDetails();
    const request = {
      url: new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    return parseMangaDetails($, mangaId, searchDetails);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId.split(".").pop();
    if (!mangaId) throw new Error(`Invalid manga ID format: ${sourceManga.mangaId}`);

    const languages = getLanguages();

    const chapters: Chapter[] = [];
    for (const language of languages) {
      const mangaRequest: Request = {
        url: new URL(DOMAIN)
          .addPathComponent("ajax")
          .addPathComponent("manga")
          .addPathComponent(mangaId)
          .addPathComponent("chapter")
          .addPathComponent(language)
          .toString(),
        method: "GET",
      };

      try {
        const [_, mangaBuffer] = await Application.scheduleRequest(mangaRequest);

        const mangaJson = JSON.parse(Application.arrayBufferToUTF8String(mangaBuffer)) as Result;

        const mangaHtml =
          typeof mangaJson.result === "string" ? mangaJson.result : mangaJson.result.html || "";

        if (!mangaHtml) continue;

        const $manga = cheerio.load(mangaHtml);
        chapters.push(...parseChapters($manga, sourceManga, language));
      } catch (error) {
        console.error(`Failed to parse buffer for language ${language}:`, error);
      }
    }

    return chapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    try {
      const url = await getChapterPagesVrfUrl(chapter.chapterId, this.cookieStorageInterceptor);

      const request: Request = { url, method: "GET" };

      const [_, buffer] = await Application.scheduleRequest(request);
      const json: PageResponse = JSON.parse(
        Application.arrayBufferToUTF8String(buffer),
      ) as PageResponse;

      return parseChapterDetails(json, chapter);
    } catch (error) {
      console.error("Error fetching chapter details:", error);
      throw error;
    }
  }

  async getUpdatedSectionItems(
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];
    const language = getLanguages();

    // Example: https://mangafire.to/filter?keyword=&language[]=en&sort=recently_updated&page=1
    const request = {
      url: new URL(DOMAIN)
        .addPathComponent("filter")
        .setQueryItem("keyword", "")
        .setQueryItem("language[]", language)
        .setQueryItem("sort", "recently_updated")
        .setQueryItem("page", page.toString())
        .toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    const items = parseUpdatedSection($, collectedIds);

    return {
      items: items,
      metadata: hasNextPage($) ? { page: page + 1, collectedIds } : undefined,
    };
  }

  async getPopularSectionItems(
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];
    const language = getLanguages();

    const request = {
      url: new URL(DOMAIN)
        .addPathComponent("filter")
        .setQueryItem("keyword", "")
        .setQueryItem("language[]", language)
        .setQueryItem("sort", "most_viewed")
        .setQueryItem("page", page.toString())
        .toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    const items = parsePopularSection($, collectedIds);

    return {
      items: items,
      metadata: popularHasNextPage($) ? { page: page + 1, collectedIds } : undefined,
    };
  }

  async getNewMangaSectionItems(
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];

    const request = {
      url: new URL(DOMAIN).addPathComponent("added").toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    const items = parseNewMangaSection($, collectedIds);

    return {
      items: items,
      metadata: hasNextPage($) ? { page: page + 1, collectedIds } : undefined,
    };
  }

  async getTypesSection(): Promise<PagedResults<DiscoverSectionItem>> {
    const searchDetails = await this.getSearchDetails();
    const types = searchDetails?.types || [];

    return {
      items: types.map((type) => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          metadata: { type: type.id } satisfies SearchMetadata,
        },
        name: type.label,
      })),
    };
  }

  async getFilterSection(): Promise<PagedResults<DiscoverSectionItem>> {
    return {
      items: Genres.map((item) => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          metadata: (item.type === "genres"
            ? { genres: { [item.id]: "included" } }
            : { type: item.id }) satisfies SearchMetadata,
        },
        name: item.name,
      })),
    };
  }

  async getLanguagesSection(): Promise<PagedResults<DiscoverSectionItem>> {
    const searchDetails = await this.getSearchDetails();
    const languages = searchDetails?.languages || [];

    return {
      items: languages.map((lang) => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          metadata: { language: lang.id } satisfies SearchMetadata,
        },
        name: `${MFLanguages.getFlagCode(lang.id)} ${lang.label}`,
      })),
    };
  }

  async fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
    const [_, data] = await Application.scheduleRequest(request);
    return cheerio.load(Application.arrayBufferToUTF8String(data), {
      xml: {
        xmlMode: false,
        // decodeEntities: false,
      },
    });
  }
}

export const MangaFire = new MangaFireExtension();
