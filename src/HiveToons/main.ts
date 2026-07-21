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

import { HiveToonsAdvancedSearchForm } from "./forms/search";
import { getShowLockedChapters, HiveToonsSettingsForm } from "./forms/settings";
import {
  API_URL,
  PAGE_SIZE,
  SECTIONS,
  SORTING_OPTIONS,
  type HiveToonsChapterResponse,
  type HiveToonsSearchResponse,
  type PageMetadata,
  type SearchMetadata,
} from "./models";
import {
  fetchGenres,
  fetchJSON,
  fetchPostDetails,
  fetchSearchPage,
  HiveToonsInterceptor,
  resolveUrlQuery,
} from "./network";
import {
  contentRatingForGenres,
  parseChapterDetails,
  parseChapterList,
  parseMangaDetails,
  parseMangaList,
} from "./parsers";
import type HiveToonsConfig from "./pbconfig";

export class HiveToonsExtension implements ExtensionImpl<typeof HiveToonsConfig> {
  private rateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 5,
    bufferInterval: 4,
    ignoreImages: true,
  });
  private cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  private interceptor = new HiveToonsInterceptor("main");

  private genresPromise?: Promise<Tag[]>;

  async initialise(): Promise<void> {
    this.rateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.interceptor.registerInterceptor();
  }

  async getSettingsForm(): Promise<Form> {
    return new HiveToonsSettingsForm();
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    this.genresPromise = undefined;
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

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: SECTIONS.POPULAR,
        title: "Popular",
        type: DiscoverSectionType.featured,
      },
      {
        id: SECTIONS.NOVELS,
        title: "Top Novels",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: SECTIONS.HOT,
        title: "Hot Releases",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: SECTIONS.NEW,
        title: "Latest Updates",
        type: DiscoverSectionType.chapterUpdates,
      },
      { id: SECTIONS.GENRES, title: "Genres", type: DiscoverSectionType.genres },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    switch (section.id) {
      case SECTIONS.POPULAR:
        return this.getPopularSectionItems(metadata);
      case SECTIONS.NOVELS:
        return this.getNovelsSectionItems(metadata);
      case SECTIONS.HOT:
        return this.getHotReleasesSectionItems(metadata);
      case SECTIONS.NEW:
        return this.getLatestUpdatesSectionItems(metadata);
      case SECTIONS.GENRES:
        return this.getGenresSectionItems();
      default:
        return { items: [] };
    }
  }

  private async getGenresSectionItems(): Promise<PagedResults<DiscoverSectionItem>> {
    const genres = await (this.genresPromise ??= fetchGenres());
    const items: DiscoverSectionItem[] = genres.map((genre) => ({
      type: "genresCarouselItem",
      name: genre.title,
      searchQuery: {
        title: "",
        metadata: {
          genres: { [genre.id]: "included" },
        } satisfies SearchMetadata,
      },
      contentRating: contentRatingForGenres([genre.title]),
    }));
    return { items };
  }

  private async getPopularSectionItems(
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const url = new URL(API_URL)
      .addPathComponent("query")
      .setQueryItem("page", page.toString())
      .setQueryItem("perPage", PAGE_SIZE.toString())
      .setQueryItem("orderBy", "totalViews")
      .toString();
    const data = await fetchJSON<HiveToonsSearchResponse>({
      url,
      method: "GET",
    });
    const items: DiscoverSectionItem[] = parseMangaList(data.posts ?? [])
      .filter((post) => !post.isNovel)
      .map((post) => {
        const ratingInfo =
          post.rating == null
            ? undefined
            : { symbol: "star.fill" as const, text: post.rating.toString() };
        const statusInfo = post.status
          ? { symbol: "book.fill" as const, text: post.status }
          : undefined;

        return {
          type: "featuredCarouselItem",
          mangaId: post.mangaId,
          title: post.title,
          imageUrl: post.imageUrl,
          supertitle: post.author,
          summary: post.summary,
          infoItems:
            ratingInfo && statusInfo
              ? ([ratingInfo, statusInfo] as const)
              : ratingInfo
                ? ([ratingInfo] as const)
                : statusInfo
                  ? ([statusInfo] as const)
                  : undefined,
          contentRating: post.contentRating,
        };
      });
    const hasNextPage = data.totalCount > page * PAGE_SIZE;
    return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
  }

  private async getNovelsSectionItems(
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const url = new URL(API_URL)
      .addPathComponent("query")
      .setQueryItem("page", page.toString())
      .setQueryItem("perPage", PAGE_SIZE.toString())
      .setQueryItem("seriesType", "NOVEL")
      .setQueryItem("orderBy", "totalViews")
      .setQueryItem("orderDirection", "desc")
      .toString();

    const data = await fetchJSON<HiveToonsSearchResponse>({
      url,
      method: "GET",
    });
    const items: DiscoverSectionItem[] = parseMangaList(data.posts ?? [])
      .filter((post) => post.isNovel)
      .map((post) => ({
        type: "prominentCarouselItem",
        mangaId: post.mangaId,
        title: post.title,
        imageUrl: post.imageUrl,
        subtitle: post.subtitle || undefined,
        contentRating: post.contentRating,
      }));

    const hasNextPage = data.totalCount > page * PAGE_SIZE;
    return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
  }

  private async getHotReleasesSectionItems(
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const url = new URL(API_URL)
      .addPathComponent("posts")
      .setQueryItem("page", page.toString())
      .setQueryItem("perPage", PAGE_SIZE.toString())
      .setQueryItem("tag", SECTIONS.HOT)
      .toString();

    const data = await fetchJSON<HiveToonsSearchResponse>({
      url,
      method: "GET",
    });
    const items: DiscoverSectionItem[] = parseMangaList(data.posts ?? [])
      .filter((post) => !post.isNovel)
      .map((post) => ({
        type: "prominentCarouselItem",
        mangaId: post.mangaId,
        title: post.title,
        imageUrl: post.imageUrl,
        subtitle: post.subtitle || undefined,
        contentRating: post.contentRating,
      }));

    const hasNextPage = data.totalCount > page * PAGE_SIZE;
    return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
  }

  private async getLatestUpdatesSectionItems(
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const url = new URL(API_URL)
      .addPathComponent("posts")
      .setQueryItem("page", page.toString())
      .setQueryItem("perPage", PAGE_SIZE.toString())
      .setQueryItem("tag", SECTIONS.NEW)
      .toString();

    const data = await fetchJSON<HiveToonsSearchResponse>({
      url,
      method: "GET",
    });
    const items: DiscoverSectionItem[] = parseMangaList(data.posts ?? [])
      .filter((post) => !post.isNovel && Boolean(post.latestChapterId))
      .map((post) => ({
        type: "chapterUpdatesCarouselItem",
        mangaId: post.mangaId,
        chapterId: post.latestChapterId!,
        title: post.title,
        imageUrl: post.imageUrl,
        subtitle: post.subtitle,
        publishDate: post.publishDate,
        contentRating: post.contentRating,
      }));

    const hasNextPage = data.totalCount > page * PAGE_SIZE;
    return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
  }

  async getSortingOptions(_query: SearchQuery<SearchMetadata>): Promise<SortingOption[]> {
    return SORTING_OPTIONS;
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new HiveToonsAdvancedSearchForm(query, await (this.genresPromise ??= fetchGenres()));
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const pasted = await resolveUrlQuery(query.title ?? "");
    if (pasted) return pasted;

    const page = metadata?.page ?? 1;
    const data = await fetchSearchPage(query, sortingOption, page);
    const items: SearchResultItem[] = parseMangaList(data.posts ?? []).map((post) => ({
      mangaId: post.mangaId,
      title: post.title,
      imageUrl: post.imageUrl,
      subtitle: post.subtitle || undefined,
      contentRating: post.contentRating,
    }));
    const hasNextPage = data.totalCount > page * PAGE_SIZE;
    return { items, metadata: hasNextPage ? { page: page + 1 } : undefined };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const data = await fetchPostDetails(mangaId);
    return parseMangaDetails(data.post);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const data = await fetchPostDetails(sourceManga.mangaId);
    return parseChapterList(data.post.chapters ?? [], sourceManga, getShowLockedChapters());
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const url = new URL(API_URL)
      .addPathComponent("chapter")
      .setQueryItem("chapterId", chapter.chapterId)
      .toString();

    const data = await fetchJSON<HiveToonsChapterResponse>({
      url,
      method: "GET",
    });
    if (!data.chapter) {
      throw new Error(`No chapter data returned for chapter ${chapter.chapterId}`);
    }
    return parseChapterDetails(data.chapter, chapter);
  }
}

export const HiveToons = new HiveToonsExtension();
