import {
  type AdvancedSearchForm,
  BasicRateLimiter,
  CloudflareError,
  ContentRating,
  CookieStorageInterceptor,
  DiscoverSectionType,
  Form,
  URL,
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
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { getLanguages, MangaFireAdvancedSearchForm, MangaFireSettingsForm } from "./forms";
import { FireInterceptor } from "./interceptors";
import {
  Genres,
  type ImageData,
  type PageMetadata,
  type PageResponse,
  type Result,
  type SearchMetadata,
} from "./models";
import type MangaFireConfig from "./pbconfig";
import { captureChapterPagesVrf, captureSearchVrf, extractVrf } from "./utils/webViewHelper";

const baseUrl = "https://mangafire.to";

export class MangaFireExtension implements ExtensionImpl<typeof MangaFireConfig> {
  requestManager = new FireInterceptor("main");
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

  private async getSearchDetails() {
    try {
      const request = {
        url: `${baseUrl}/filter`,
        method: "GET",
      };

      const $ = await this.fetchCheerio(request);
      const types: { id: string; label: string }[] = [];
      const genres: { id: string; label: string }[] = [];
      const status: { id: string; label: string }[] = [];
      const languages: { id: string; label: string }[] = [];
      const years: { id: string; label: string }[] = [];
      const lengths: { id: string; label: string }[] = [];
      const sorts: { id: string; label: string }[] = [];

      $(".dropdown:has(button .value[data-placeholder='Type']) .dropdown-menu.noclose.c1 li").each(
        (_, element) => {
          const id = $(element).find("input").attr("value") ?? "";
          const label = $(element).find("label").text().trim();
          if (label) {
            types.push({ id, label });
          }
        },
      );

      $(".genres li").each((_, element) => {
        const id = $(element).find("input").attr("value") ?? "";
        const label = $(element).find("label").text().trim();
        if (label && id) {
          genres.push({ id, label });
        }
      });

      $(
        ".dropdown:has(button .value[data-placeholder='Status']) .dropdown-menu.noclose.c1 li",
      ).each((_, element) => {
        const id = $(element).find("input").attr("value") ?? "";
        const label = $(element).find("label").text().trim();
        if (label && id) {
          status.push({ id, label });
        }
      });

      $(
        ".dropdown:has(button .value[data-placeholder='Language']) .dropdown-menu.noclose.c1 li",
      ).each((_, element) => {
        const id = $(element).find("input").attr("value") ?? "";
        const label = $(element).find("label").text().trim();
        if (label && id) {
          languages.push({ id, label });
        }
      });

      $(
        ".dropdown:has(button .value[data-placeholder='Year']) .dropdown-menu.noclose.md.c3 li",
      ).each((_, element) => {
        const id = $(element).find("input").attr("value") ?? "";
        const label = $(element).find("label").text().trim();
        if (label && id) {
          years.push({ id, label });
        }
      });

      $(
        ".dropdown:has(button .value[data-placeholder='Length']) .dropdown-menu.noclose.c1 li",
      ).each((_, element) => {
        const id = $(element).find("input").attr("value") ?? "";
        const label = $(element).find("label").text().trim();
        if (label && id) {
          lengths.push({ id, label });
        }
      });

      $(".dropdown:has(button .value[data-placeholder='Sort']) .dropdown-menu.noclose.c1 li").each(
        (_, element) => {
          const id = $(element).find("input").attr("value") ?? "";
          const label = $(element).find("label").text().trim();
          if (label && id) {
            sorts.push({ id, label });
          }
        },
      );

      return {
        types: types,
        genres: genres,
        status: status,
        languages: languages,
        years: years,
        lengths: lengths,
        sorts: sorts,
      };
    } catch (error) {
      console.error("Error fetching search details:", error);
    }
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new MangaFireAdvancedSearchForm(query, await this.getSearchDetails());
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    const searchDetails = await this.getSearchDetails();
    const sortingOptions: SortingOption[] =
      searchDetails?.sorts?.map((sort) => ({
        id: sort.id,
        label: sort.label,
      })) || [];

    return sortingOptions;
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
    const searchUrl = new URL(baseUrl)
      .addPathComponent("filter")
      .setQueryItem("keyword", query.title)
      .setQueryItem("page", page.toString())
      .setQueryItem("genre_mode", "and");

    if (query.title.trim()) {
      const captured = await captureSearchVrf(query.title, this.cookieStorageInterceptor);
      searchUrl.setQueryItem("vrf", extractVrf(captured));
    }

    const meta = query.metadata ?? {};
    const { type, genres, status, language, year, length } = meta;

    if (type) {
      searchUrl.setQueryItem("type[]", type);
    }

    let url = searchUrl.toString();

    if (genres) {
      Object.entries(genres).forEach(([id, value]) => {
        if (value === "included") {
          url += `&genre[]=${id}`;
        } else if (value === "excluded") {
          url += `&genre[]=-${id}`;
        }
      });
    }

    if (status) {
      url += `&status[]=${status}`;
    }

    if (language) {
      url += `&language[]=${language}`;
    }

    if (year) {
      url += `&year[]=${year}`;
    }

    if (length) {
      url += `&length[]=${length}`;
    }

    if (sortingOption) {
      url += `&sort=${sortingOption.id}`;
    }

    const request = { url, method: "GET" };

    const $ = await this.fetchCheerio(request);
    const searchResults: SearchResultItem[] = [];

    $(".original.card-lg .unit .inner").each((_, element) => {
      const unit = $(element);
      const infoLink = unit.find(".info > a");
      const title = infoLink.text().trim();
      const image = unit.find("img").attr("src") || "";
      const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";
      const latestChapter = unit
        .find(".content[data-name='chap'] a")
        .first()
        .find("span")
        .first()
        .text()
        .trim();
      const latestChapterMatch = latestChapter.match(/Chap (\d+)/);
      const subtitle = latestChapterMatch ? `Ch. ${latestChapterMatch[1]}` : undefined;

      if (!title || !mangaId) {
        return;
      }

      searchResults.push({
        mangaId: mangaId,
        imageUrl: image,
        title: title,
        subtitle: subtitle,
        contentRating: ContentRating.EVERYONE,
      });
    });

    const hasNextPage = !!$(".page-item.active + .page-item .page-link").length;

    return {
      items: searchResults,
      metadata: hasNextPage ? { page: page + 1 } : undefined,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const request = {
      url: new URL(baseUrl).addPathComponent("manga").addPathComponent(mangaId).toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);

    const title = $(".manga-detail .info h1").text().trim();
    const altTitles = [$(".manga-detail .info h6").text().trim()];
    const image = $(".manga-detail .poster img").attr("src") || "";
    const description =
      $("#synopsis .modal-content").text().trim() ||
      $(".manga-detail .info .description").text().trim();
    const authors: string[] = [];
    $("#info-rating .meta div").each((_, element) => {
      const label = $(element).find("span").first().text().trim();
      if (label === "Author:") {
        $(element)
          .find("a")
          .each((_, authorElement) => {
            authors.push($(authorElement).text().trim());
          });
      }
    });
    let status = "UNKNOWN";
    let statusText = "Unknown";
    $(".manga-detail .info p").each((_, element) => {
      statusText = $(element).text().trim();
    });

    if (statusText.includes("Releasing")) {
      status = "ONGOING";
    } else if (statusText.includes("Completed")) {
      status = "COMPLETED";
    } else if (
      statusText.includes("hiatus") ||
      statusText.includes("discontinued") ||
      statusText.includes("not yet published") ||
      statusText.includes("completed")
    ) {
      status = statusText.toLocaleUpperCase().replace(/\s+/g, "_");
    }

    const tags: TagSection[] = [];
    const genres: string[] = [];
    let rating = 1;

    $("#info-rating .meta div").each((_, element) => {
      const label = $(element).find("span").first().text().trim();
      if (label === "Genres:") {
        $(element)
          .find("a")
          .each((_, genreElement) => {
            genres.push($(genreElement).text().trim());
          });
      }
    });

    const ratingValue = $("#info-rating .score .live-score").text().trim();
    if (ratingValue) {
      rating = parseFloat(ratingValue);
    }

    if (genres.length > 0) {
      tags.push({
        id: "genres",
        title: "Genres",
        tags: genres.map((genre) => ({
          id: genre
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
          title: genre,
        })),
      });
    }

    return {
      mangaId: mangaId,
      mangaInfo: {
        primaryTitle: title,
        secondaryTitles: altTitles,
        thumbnailUrl: image,
        synopsis: description,
        rating: rating,
        contentRating: ContentRating.EVERYONE,
        status: status as "ONGOING" | "COMPLETED" | "UNKNOWN",
        tagGroups: tags,
        shareUrl: `${baseUrl}/manga/${mangaId}`,
      },
    };
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId.split(".")[1];

    const languages = getLanguages();

    const chapters: Chapter[] = [];
    for (const language of languages) {
      const mangaRequest: Request = {
        url: new URL(baseUrl)
          .addPathComponent("ajax")
          .addPathComponent("manga")
          .addPathComponent(mangaId)
          .addPathComponent("chapter")
          .addPathComponent(language)
          .toString(),
        method: "GET",
      };

      try {
        const [mangaResponse, mangaBuffer] = await Application.scheduleRequest(mangaRequest);
        await this.checkCloudflareStatus(mangaResponse.status);

        const mangaJson = JSON.parse(Application.arrayBufferToUTF8String(mangaBuffer)) as Result;

        const mangaHtml =
          typeof mangaJson?.result === "string" ? mangaJson.result : mangaJson?.result?.html || "";

        if (!mangaHtml) continue;

        const $manga = cheerio.load(mangaHtml);
        $manga("li").each((_, el) => {
          const li = $manga(el);
          const chapterNumber = li.attr("data-number");
          if (!chapterNumber) return;

          const link = li.find("a");
          const href = link.attr("href");
          if (!href) return;

          const chapterUrlPath = href.startsWith("http")
            ? href.replace(/^https?:\/\/[^/]+/, "")
            : href;

          const dateText = li.find("span").last().text().trim();
          const title =
            link.find("span").first().text().trim().split(`${chapterNumber}:`)[1]?.trim() ||
            undefined;

          chapters.push({
            chapterId: chapterUrlPath,
            title: title,
            sourceManga,
            chapNum: parseFloat(String(chapterNumber)),
            publishDate: new Date(convertToISO8601(dateText)),
            volume: 0,
            langCode: getLanguageFlag(language),
            version: getLanguageVersion(language),
          });
        });
      } catch (error) {
        console.error(`Failed to parse buffer for language ${language}:`, error);
      }
    }

    return chapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    try {
      const url = await captureChapterPagesVrf(chapter.chapterId, this.cookieStorageInterceptor);

      const request: Request = { url, method: "GET" };

      const [response, buffer] = await Application.scheduleRequest(request);
      await this.checkCloudflareStatus(response.status);
      const json: PageResponse = JSON.parse(
        Application.arrayBufferToUTF8String(buffer),
      ) as PageResponse;

      const pages: string[] = [];
      json.result.images.forEach((value: ImageData) => {
        pages.push(value[0]);
      });
      return {
        mangaId: chapter.sourceManga.mangaId,
        id: chapter.chapterId,
        pages: pages,
      };
    } catch (error) {
      console.error("Error fetching chapter details:", error);
      throw error;
    }
  }

  async getUpdatedSectionItems(
    metadata: { page?: number; collectedIds?: string[] } | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];

    // Example: https://mangafire.to/filter?keyword=&language[]=en&sort=recently_updated&page=1
    const request = {
      url: new URL(baseUrl)
        .addPathComponent("filter")
        .setQueryItem("keyword", "")
        .setQueryItem("language[]", "en")
        .setQueryItem("sort", "recently_updated")
        .setQueryItem("page", page.toString())
        .toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    const items: DiscoverSectionItem[] = [];

    $(".unit .inner").each((_, element) => {
      const unit = $(element);
      const infoLink = unit.find(".info > a").last();
      const title = infoLink.text().trim();
      const image = unit.find(".poster img").attr("src") || "";
      const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";
      const latest_chapter = unit.find(".content[data-name='chap']").find("a").eq(0).text().trim();
      const latestChapterMatch = latest_chapter.match(/Chap (\d+)/);
      const subtitle = latestChapterMatch ? `Ch. ${latestChapterMatch[1]}` : undefined;

      const chapterLink = unit.find(".content[data-name='chap'] a").first();
      const chapterHref = chapterLink.attr("href") || "";
      const chapterId = chapterHref.startsWith("http")
        ? chapterHref.replace(/^https?:\/\/[^/]+/, "")
        : chapterHref;

      if (title && mangaId && !collectedIds.includes(mangaId)) {
        collectedIds.push(mangaId);
        items.push({
          type: "chapterUpdatesCarouselItem",
          mangaId: mangaId,
          chapterId: chapterId,
          imageUrl: image,
          title: title,
          subtitle: subtitle,
          contentRating: ContentRating.EVERYONE,
        });
      }
    });

    const hasNextPage = !!$(".page-item.active + .page-item .page-link").length;

    return {
      items: items,
      metadata: hasNextPage ? { page: page + 1, collectedIds } : undefined,
    };
  }

  async getPopularSectionItems(
    metadata: { page?: number; collectedIds?: string[] } | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];

    const request = {
      url: new URL(baseUrl)
        .addPathComponent("filter")
        .setQueryItem("keyword", "")
        .setQueryItem("language[]", "en")
        .setQueryItem("sort", "most_viewed")
        .setQueryItem("page", page.toString())
        .toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    const items: DiscoverSectionItem[] = [];

    $(".unit .inner").each((_, element) => {
      const unit = $(element);
      const infoLink = unit.find(".info > a").last();
      const title = infoLink.text().trim();
      const image = unit.find(".poster img").attr("src") || "";
      const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";

      const latestChapter = unit
        .find(".content[data-name='chap'] a")
        .filter((_, el) => $(el).find("b").text() === "EN")
        .first()
        .find("span")
        .first()
        .text()
        .trim();

      const chapterMatch = latestChapter.match(/Chap (\d+)/);
      const supertitle = chapterMatch ? `Ch. ${chapterMatch[1]}` : "";

      if (title && mangaId && !collectedIds.includes(mangaId)) {
        collectedIds.push(mangaId);
        items.push({
          type: "featuredCarouselItem",
          mangaId: mangaId,
          imageUrl: image,
          title: title,
          supertitle: supertitle,
          contentRating: ContentRating.EVERYONE,
        });
      }
    });

    const hasNextPage = !!$(".hpage .r").length;

    return {
      items: items,
      metadata: hasNextPage ? { page: page + 1, collectedIds } : undefined,
    };
  }

  async getNewMangaSectionItems(
    metadata: { page?: number; collectedIds?: string[] } | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];

    const request = {
      url: new URL(baseUrl).addPathComponent("added").toString(),
      method: "GET",
    };

    const $ = await this.fetchCheerio(request);
    const items: DiscoverSectionItem[] = [];

    $(".unit .inner").each((_, element) => {
      const unit = $(element);
      const infoLink = unit.find(".info > a").last();
      const title = infoLink.text().trim();
      const image = unit.find(".poster img").attr("src") || "";
      const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";

      const latestChapter = unit
        .find(".content[data-name='chap'] a")
        .first()
        .find("span")
        .first()
        .text()
        .trim();
      const latestChapterMatch = latestChapter.match(/Chap (\d+)/);
      const subtitle = latestChapterMatch ? `Ch. ${latestChapterMatch[1]}` : undefined;

      if (title && mangaId && !collectedIds.includes(mangaId)) {
        collectedIds.push(mangaId);
        items.push({
          mangaId,
          imageUrl: image,
          title: title,
          subtitle: subtitle,
          contentRating: ContentRating.EVERYONE,
          type: "simpleCarouselItem",
        });
      }
    });

    const hasNextPage = !!$(".page-item.active + .page-item .page-link").length;

    return {
      items: items,
      metadata: hasNextPage ? { page: page + 1, collectedIds } : undefined,
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
        name: `${getLanguageFlag(lang.id)} ${lang.label}`,
      })),
    };
  }

  async checkCloudflareStatus(status: number): Promise<void> {
    if (status == 503 || status == 403) {
      throw new CloudflareError({
        url: baseUrl,
        method: "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }
  }

  async fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
    const [response, data] = await Application.scheduleRequest(request);
    await this.checkCloudflareStatus(response.status);
    return cheerio.load(Application.arrayBufferToUTF8String(data), {
      xml: {
        xmlMode: false,
        // decodeEntities: false,
      },
    });
  }
}

function convertToISO8601(dateText: string): string {
  const now = new Date();

  if (!dateText?.trim()) return now.toISOString();

  if (/^yesterday$/i.test(dateText)) {
    now.setDate(now.getDate() - 1);
    return now.toISOString();
  }

  const relativeMatch = dateText.match(/(\d+)\s+(second|minute|hour|day)s?\s+ago/i);
  if (relativeMatch) {
    const [_, value, unit] = relativeMatch;
    switch (unit.toLowerCase()) {
      case "second":
        now.setSeconds(now.getSeconds() - +value);
        break;
      case "minute":
        now.setMinutes(now.getMinutes() - +value);
        break;
      case "hour":
        now.setHours(now.getHours() - +value);
        break;
      case "day":
        now.setDate(now.getDate() - +value);
        break;
    }
    return now.toISOString();
  }

  const parsedDate = new Date(dateText);
  return isNaN(parsedDate.getTime()) ? now.toISOString() : parsedDate.toISOString();
}

function getLanguageFlag(language: string): string {
  switch (language) {
    case "en":
      return "🇬🇧";
    case "fr":
      return "🇫🇷";
    case "es":
      return "🇪🇸";
    case "es-la":
      return "🇲🇽";
    case "pt":
      return "🇵🇹";
    case "pt-br":
      return "🇧🇷";
    case "ja":
      return "🇯🇵";
    default:
      return "🇬🇧";
  }
}

function getLanguageVersion(language: string): string {
  switch (language) {
    case "en":
      return "EN";
    case "fr":
      return "FR";
    case "es":
      return "ES";
    case "es-la":
      return "ESLA";
    case "pt":
      return "PT";
    case "pt-br":
      return "PTBR";
    case "ja":
      return "JP";
    default:
      return "EN";
  }
}

export const MangaFire = new MangaFireExtension();
