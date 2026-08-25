/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CloudflareError,
  CookieStorageInterceptor,
  DiscoverSectionType,
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

import { NovelArchiveAdvancedSearchForm } from "./forms/search";
import { NovelArchiveSettingsForm, getHideAdultContent } from "./forms/settings";
import {
  PAGE_SIZE,
  SECTIONS,
  SORT_OPTIONS,
  STATE_KEYS,
  type ChapterDetailResponse,
  type NovelDetailResponse,
  type NovelListItem,
  type NovelListResponse,
  type PageMetadata,
  type SearchMetadata,
  type SourceChapterDetailResponse,
} from "./models";
import {
  buildNovelsUrl,
  fetchApi,
  fetchGenres,
  fetchSourceChapters,
  fetchSources,
  novelsFeedUrl,
  novelsUrl,
  NovelArchiveInterceptor,
} from "./network";
import {
  decodeId,
  encodeId,
  filterAdultItems,
  mergeChapterVersions,
  parseChapterDetails,
  parseChapters,
  parseGenreOptions,
  parseMangaDetails,
  parseNovelList,
  parseSourceChapterDetails,
  parseSourceChapters,
  pickGenreValues,
  toCardItem,
  toChapterUpdateItem,
  toFeaturedItem,
  toGenreCarouselItems,
  toSearchResultItem,
} from "./parsers";
import type NovelArchiveConfig from "./pbconfig";

class NovelArchiveExtension implements ExtensionImpl<typeof NovelArchiveConfig> {
  private rateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 20,
    bufferInterval: 8,
    ignoreImages: true,
  });
  private cookieStorageInterceptor = new CookieStorageInterceptor({ storage: "stateManager" });
  private interceptor = new NovelArchiveInterceptor("main");
  private genresPromise?: Promise<Tag[]>;

  async initialise(): Promise<void> {
    this.rateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.interceptor.registerInterceptor();
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.expires && cookie.expires.getTime() <= Date.now()) continue;
      if (
        cookie.name.startsWith("cf") ||
        cookie.name.startsWith("_cf") ||
        cookie.name.startsWith("__cf")
      ) {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
    this.genresPromise = undefined;
  }

  async getSettingsForm(): Promise<Form> {
    return new NovelArchiveSettingsForm(await this.getGenres());
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      { id: SECTIONS.POPULAR, title: "Popular", type: DiscoverSectionType.featured },
      { id: SECTIONS.TOP_RATED, title: "Top Rated", type: DiscoverSectionType.simpleCarousel },
      { id: SECTIONS.LATEST, title: "Latest Updates", type: DiscoverSectionType.chapterUpdates },
      { id: SECTIONS.EDITORS, title: "Editor's Choice", type: DiscoverSectionType.featured },
      {
        id: SECTIONS.MOST_CHAPTERS,
        title: "Most Chapters",
        type: DiscoverSectionType.simpleCarousel,
      },
      { id: SECTIONS.GENRES, title: "Genres", type: DiscoverSectionType.genres },
    ];
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return SORT_OPTIONS;
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const results = await this.loadDiscoverSection(section, metadata);
    return { ...results, items: filterAdultItems(results.items, getHideAdultContent()) };
  }

  private async loadDiscoverSection(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case SECTIONS.POPULAR:
        return this.getBrowseSectionItems(
          "popular",
          (item) => toFeaturedItem(item, "popular"),
          metadata,
        );
      case SECTIONS.EDITORS:
        return this.getEditorsSectionItems();
      case SECTIONS.LATEST:
        return this.getLatestSectionItems();
      case SECTIONS.TOP_RATED:
        return this.getBrowseSectionItems("rating", (item) => toCardItem(item, "rating"), metadata);
      case SECTIONS.MOST_CHAPTERS:
        return this.getBrowseSectionItems(
          "chapters",
          (item) => toCardItem(item, "chapters"),
          metadata,
        );
      case SECTIONS.GENRES:
        return this.getGenresSectionItems();
      default:
        return { items: [] };
    }
  }

  private getGenres(): Promise<Tag[]> {
    return (this.genresPromise ??= (async () => {
      const cached = Application.getState(STATE_KEYS.GENRES) as Tag[] | undefined;
      if (cached) return cached;

      const genres = parseGenreOptions(await fetchGenres());
      Application.setState(genres, STATE_KEYS.GENRES);
      return genres;
    })());
  }

  private async getGenresSectionItems(): Promise<PagedResults<DiscoverSectionItem>> {
    return { items: toGenreCarouselItems(await this.getGenres()) };
  }

  private async getLatestSectionItems(): Promise<PagedResults<DiscoverSectionItem>> {
    const { novels } = await fetchApi<NovelListResponse>(
      novelsFeedUrl("recently-updated", PAGE_SIZE),
    );
    return {
      items: parseNovelList(novels).flatMap((item) => {
        const card = toChapterUpdateItem(item);
        return card ? [card] : [];
      }),
    };
  }

  private async getEditorsSectionItems(): Promise<PagedResults<DiscoverSectionItem>> {
    const { novels } = await fetchApi<NovelListResponse>(novelsFeedUrl("editors-choice"));
    return {
      items: parseNovelList(novels).map((item) => toFeaturedItem(item, "editors")),
    };
  }

  private async getBrowseSectionItems(
    sort: string,
    toItem: (item: NovelListItem) => DiscoverSectionItem,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const data = await fetchApi<NovelListResponse>(buildNovelsUrl({ page, sort }));
    return {
      items: parseNovelList(data.novels).map(toItem),
      metadata: data.pagination?.has_next ? { page: page + 1 } : undefined,
    };
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new NovelArchiveAdvancedSearchForm(query, await this.getGenres());
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const results = await this.loadSearchResults(query, metadata, sortingOption);
    return { ...results, items: filterAdultItems(results.items, getHideAdultContent()) };
  }

  private async loadSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const pasted = await this.resolveUrlQuery(query.title ?? "");
    if (pasted) return pasted;

    const searchMetadata = query.metadata ?? { status: [], genreMatch: ["all"], genres: {} };
    const search = (query.title ?? "").trim();
    const page = metadata?.page ?? 1;

    const url = buildNovelsUrl({
      page,
      search: search || undefined,
      sort: sortingOption?.id,
      status: searchMetadata.status?.[0],
      genreMatch: searchMetadata.genreMatch?.[0],
      genresInclude: pickGenreValues(searchMetadata.genres, "included"),
      genresExclude: pickGenreValues(searchMetadata.genres, "excluded"),
    });

    const data = await fetchApi<NovelListResponse>(url);
    return {
      items: parseNovelList(data.novels).map(toSearchResultItem),
      metadata: data.pagination?.has_next ? { page: page + 1 } : undefined,
    };
  }

  private async resolveUrlQuery(
    query: string,
  ): Promise<PagedResults<SearchResultItem> | undefined> {
    const trimmed = query.trim();
    if (!/^https?:\/\/(?:www\.)?novelarchive\.cc\//i.test(trimmed)) return undefined;

    const urlId =
      trimmed.match(/[?&](?:id|novel)=([^&#]+)/i)?.[1] ??
      trimmed.match(/\/novels?\/([^/?#]+)/i)?.[1];
    if (!urlId) return undefined;

    const novelId = decodeId(urlId);
    try {
      const data = await fetchApi<NovelDetailResponse>(novelsUrl(novelId));
      const manga = parseMangaDetails(data.novel, encodeId(novelId));
      return {
        items: [
          {
            mangaId: manga.mangaId,
            title: manga.mangaInfo.primaryTitle,
            imageUrl: manga.mangaInfo.thumbnailUrl,
            contentRating: manga.mangaInfo.contentRating,
          },
        ],
      };
    } catch (error: unknown) {
      if (error instanceof CloudflareError) throw error;
      return undefined;
    }
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const data = await fetchApi<NovelDetailResponse>(novelsUrl(decodeId(mangaId)));
    return parseMangaDetails(data.novel, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const novelId = decodeId(sourceManga.mangaId);
    const [data, sources] = await Promise.all([
      fetchApi<NovelDetailResponse>(novelsUrl(novelId)),
      fetchSources(novelId),
    ]);

    const chapters = parseChapters(data.novel, sourceManga);
    const sourceChapterLists = await Promise.all(
      sources.map(async (source) =>
        parseSourceChapters(source, await fetchSourceChapters(novelId, source.id), sourceManga),
      ),
    );

    return mergeChapterVersions(chapters, ...sourceChapterLists);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const novelId = decodeId(chapter.sourceManga.mangaId);
    const separator = chapter.chapterId.lastIndexOf(":");

    // Mirror ids encode the source and chapter number around the final colon.
    if (separator >= 0) {
      const sourceId = decodeId(chapter.chapterId.slice(0, separator));
      const chapterNumber = decodeId(chapter.chapterId.slice(separator + 1));
      const data = await fetchApi<SourceChapterDetailResponse>(
        novelsUrl(novelId, "sources", sourceId, "chapters", chapterNumber),
      );
      return parseSourceChapterDetails(data, chapter);
    }

    const data = await fetchApi<ChapterDetailResponse>(
      novelsUrl(novelId, "chapters", chapter.chapterId),
    );
    return parseChapterDetails(data, chapter);
  }
}

export const NovelArchive = new NovelArchiveExtension();
