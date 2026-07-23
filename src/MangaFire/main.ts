/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  DiscoverSectionType,
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
  type Tag,
} from "@paperback/types";

import { MangaFireAdvancedSearchForm } from "./forms/search";
import { getLanguages, MangaFireSettingsForm } from "./forms/settings";
import {
  CHAPTER_PAGE_LIMIT,
  DOMAIN,
  GENRES,
  SORTS,
  THEMES,
  TYPES,
  type ApiList,
  type ChapterItem,
  type ChapterPages,
  type PageMetadata,
  type SearchMetadata,
  type TitleDetails,
  type TitleItem,
} from "./models";
import { fetchApi, MangaFireInterceptor } from "./network";
import { parseChapters, parseHid, parseMangaDetails, parseMangaList } from "./parsers";
import type MangaFireConfig from "./pbconfig";
import { getVrfUrl } from "./utils/webView";

class MangaFireExtension implements ExtensionImpl<typeof MangaFireConfig> {
  private requestManager = new MangaFireInterceptor("requestManager");
  private cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  private globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 15,
    bufferInterval: 5,
    ignoreImages: true,
  });

  async initialise(): Promise<void> {
    this.cookieStorageInterceptor.registerInterceptor();
    this.requestManager.registerInterceptor();
    this.globalRateLimiter.registerInterceptor();
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (/^_{0,2}cf/.test(cookie.name)) this.cookieStorageInterceptor.setCookie(cookie);
    }
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
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: "new_manga_section",
        title: "New Manga",
        type: DiscoverSectionType.simpleCarousel,
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
      {
        id: "themes_section",
        title: "Themes",
        type: DiscoverSectionType.genres,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case "popular_section":
        return this.getMangaListSection(metadata, "views_30d", "featuredCarouselItem");
      case "updated_section":
        return this.getMangaListSection(metadata, "chapter_updated_at", "simpleCarouselItem");
      case "new_manga_section":
        return this.getMangaListSection(metadata, "created_at", "simpleCarouselItem");
      case "types_section":
        return this.getGenresSection(TYPES, (id) => ({ types: [id] }));
      case "genres_section":
        return this.getGenresSection(GENRES, (id) => ({ genres: { [id]: "included" } }));
      case "themes_section":
        return this.getGenresSection(THEMES, (id) => ({ themes: [id] }));
      default:
        return { items: [] };
    }
  }

  private async getMangaListSection(
    metadata: PageMetadata | undefined,
    orderKey: string,
    itemType: "featuredCarouselItem" | "simpleCarouselItem",
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;

    const triggerUrl = new URL(DOMAIN)
      .addPathComponent("browse")
      .setQueryItem("sort", `${orderKey}:desc`)
      .setQueryItem("page", page.toString())
      .toString();

    const apiUrl = await getVrfUrl({
      triggerUrl,
      matcher: "/api/titles\\?",
      cookieInterceptor: this.cookieStorageInterceptor,
    });
    const data = await fetchApi<ApiList<TitleItem>>(apiUrl);

    const items = parseMangaList(data.items).map(
      ({ subtitle, updatedAt, rank, metadata: _, ...item }): DiscoverSectionItem =>
        itemType === "featuredCarouselItem"
          ? {
              type: itemType,
              ...item,
              supertitle: rank ? `Rank #${rank}` : undefined,
              infoItems:
                subtitle && updatedAt
                  ? [
                      { symbol: "book.fill", text: subtitle },
                      { symbol: "clock.fill", text: updatedAt },
                    ]
                  : subtitle
                    ? [{ symbol: "book.fill", text: subtitle }]
                    : undefined,
            }
          : {
              type: itemType,
              ...item,
              subtitle: [subtitle, updatedAt].filter(Boolean).join(" • ") || undefined,
            },
    );

    return {
      items,
      metadata: data.meta?.hasNext ? { page: page + 1 } : undefined,
    };
  }

  private async getGenresSection(
    options: Tag[],
    toMetadata: (id: string) => SearchMetadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    return {
      items: options.map((option) => ({
        type: "genresCarouselItem",
        searchQuery: {
          title: "",
          metadata: toMetadata(option.id),
        },
        name: option.title,
      })),
    };
  }

  async getSettingsForm(): Promise<Form> {
    return new MangaFireSettingsForm();
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new MangaFireAdvancedSearchForm(query);
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return SORTS;
  }

  // e.g. /api/titles?keyword=one+piece&types[]=manga&genres_in[]=1&genres_ex[]=9&genres_mode=and&statuses[]=releasing&order[relevance]=desc&page=2
  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const url = new URL(DOMAIN).addPathComponent("browse").setQueryItem("page", page.toString());

    if (query.title.trim()) url.setQueryItem("keyword", query.title.trim());

    const meta = query.metadata ?? {};

    const genresIn: string[] = [];
    const genresEx: string[] = [];
    for (const [id, value] of Object.entries(meta.genres ?? {})) {
      (value === "excluded" ? genresEx : genresIn).push(id);
    }
    if (genresIn.length > 0) url.setQueryItem("genres_in[]", genresIn);
    if (genresEx.length > 0) url.setQueryItem("genres_ex[]", genresEx);
    if (genresIn.length > 0 && !(meta.genreMode ?? true)) url.setQueryItem("genres_mode", "or");

    const arrayFilters = {
      "types[]": meta.types,
      "theme_ids[]": meta.themes,
      "demographics[]": meta.demographics,
      "statuses[]": meta.statuses,
    };
    for (const [key, value] of Object.entries(arrayFilters)) {
      if (value?.length) url.setQueryItem(key, value);
    }

    const valueFilters = {
      year_from: meta.yearFrom,
      year_to: meta.yearTo,
      min_chap: meta.minChapters,
    };
    for (const [key, value] of Object.entries(valueFilters)) {
      if (value?.trim()) url.setQueryItem(key, value.trim());
    }

    const [orderKey, direction] = (sortingOption?.id ?? "relevance:desc").split(":");
    url.setQueryItem("sort", `${orderKey}:${direction}`);

    const apiUrl = await getVrfUrl({
      triggerUrl: url.toString(),
      matcher: "/api/titles\\?",
      cookieInterceptor: this.cookieStorageInterceptor,
    });
    const data = await fetchApi<ApiList<TitleItem>>(apiUrl);

    return {
      items: parseMangaList(data.items),
      metadata: data.meta?.hasNext ? { page: page + 1 } : undefined,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const hid = parseHid(mangaId);
    const triggerUrl = new URL(DOMAIN)
      .addPathComponent("manga")
      .addPathComponent(mangaId)
      .setQueryItem("type", "details")
      .toString();

    const apiUrl = await getVrfUrl({
      triggerUrl,
      matcher: `/api/titles/${hid}`,
      cookieInterceptor: this.cookieStorageInterceptor,
      apiPath: `/titles/${hid}`,
    });

    const data = await fetchApi<{ data: TitleDetails }>(apiUrl);

    return parseMangaDetails(data.data, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const chapters: Chapter[] = [];
    const hid = parseHid(sourceManga.mangaId);

    for (const langCode of getLanguages()) {
      let page = 1;
      let lastPage = 1;

      do {
        const triggerUrl = new URL(DOMAIN)
          .addPathComponent("manga")
          .addPathComponent(sourceManga.mangaId)
          .setQueryItem("lang", langCode)
          .setQueryItem("page", page.toString())
          .toString();

        const apiUrl = await getVrfUrl({
          triggerUrl,
          matcher: `/api/titles/${hid}/chapters`,
          cookieInterceptor: this.cookieStorageInterceptor,
          apiPath: `/titles/${hid}/chapters`,
          apiParams: {
            language: langCode,
            sort: "number",
            order: "desc",
            page,
            limit: CHAPTER_PAGE_LIMIT,
          },
        });

        const data = await fetchApi<ApiList<ChapterItem>>(apiUrl);
        chapters.push(...parseChapters(data.items, sourceManga, langCode));

        lastPage = data.meta?.lastPage ?? 1;
        page++;
      } while (page <= lastPage);
    }

    return chapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const triggerUrl = new URL(DOMAIN)
      .addPathComponent("read")
      .addPathComponent(chapter.sourceManga.mangaId)
      .addPathComponent(chapter.langCode)
      .addPathComponent(`chapter-${chapter.chapNum}`)
      .toString();

    const apiUrl = await getVrfUrl({
      triggerUrl,
      matcher: `/api/chapters/${chapter.chapterId}`,
      cookieInterceptor: this.cookieStorageInterceptor,
      apiPath: `/chapters/${chapter.chapterId}`,
    });

    const data = await fetchApi<{ data: ChapterPages }>(apiUrl);

    return {
      mangaId: chapter.sourceManga.mangaId,
      id: chapter.chapterId,
      pages: data.data.pages.map((page) => page.url),
    };
  }
}

export const MangaFire = new MangaFireExtension();
