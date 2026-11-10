/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  CloudflareError,
  ContentRating,
  URL,
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
  type FeaturedCarouselItem,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
  type Tag,
  type UpdateManager,
} from "@paperback/types";

import { NovelArchiveAdvancedSearchForm } from "./forms/search";
import { NovelArchiveSettingsForm, getDefaultGenres, getHideAdultContent } from "./forms/settings";
import {
  FEED_SIZE,
  SECTIONS,
  SORT_OPTIONS,
  type ChapterDetailResponse,
  type NovelDetailResponse,
  type NovelListResponse,
  type PageMetadata,
  type SearchMetadata,
  type SourceChapterDetailResponse,
} from "./models";
import {
  buildNovelsUrl,
  fetchJSON,
  fetchGenres,
  fetchSourceChapters,
  fetchSources,
  novelsUrl,
  NovelArchiveInterceptor,
} from "./network";
import {
  contentRatingForGenres,
  decodeId,
  filterNovelList,
  mergeChapterVersions,
  parseChapterDetails,
  parseChapters,
  parseMangaDetails,
  parseNovelList,
  parseSourceChapterDetails,
  parseSourceChapters,
  pickGenreValues,
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
      { id: SECTIONS.TRENDING, title: "Trending", type: DiscoverSectionType.featured },
      { id: SECTIONS.TOP_RATED, title: "Top Rated", type: DiscoverSectionType.simpleCarousel },
      {
        id: SECTIONS.RECENTLY_ADDED,
        title: "Recently Added",
        type: DiscoverSectionType.simpleCarousel,
      },
      { id: SECTIONS.LATEST, title: "Latest Updates", type: DiscoverSectionType.chapterUpdates },
      { id: SECTIONS.EDITORS, title: "Editor's Choice", type: DiscoverSectionType.featured },
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
    if (section.id === SECTIONS.GENRES) {
      const genres = await this.getGenres();
      return {
        items: genres
          .filter(
            (genre) =>
              !getHideAdultContent() ||
              contentRatingForGenres([genre.title]) === ContentRating.EVERYONE,
          )
          .map((genre) => ({
            type: "genresCarouselItem",
            name: genre.title,
            searchQuery: {
              title: "",
              metadata: { genres: { [genre.id]: "included" } } satisfies SearchMetadata,
            },
            contentRating: contentRatingForGenres([genre.title]),
          })),
      };
    }
    const page = metadata?.page ?? 1;
    let url: string;
    switch (section.id) {
      case SECTIONS.TOP_RATED:
      case SECTIONS.RECENTLY_ADDED:
        url = buildNovelsUrl({
          page,
          sort: section.id === SECTIONS.TOP_RATED ? "rating" : "recent",
        });
        break;
      case SECTIONS.TRENDING:
        url = new URL(novelsUrl("trending")).setQueryItem("limit", FEED_SIZE.toString()).toString();
        break;
      case SECTIONS.EDITORS:
        url = new URL(novelsUrl("editors-choice"))
          .setQueryItem("limit", FEED_SIZE.toString())
          .toString();
        break;
      case SECTIONS.LATEST:
        url = new URL(novelsUrl("recently-updated"))
          .setQueryItem("limit", FEED_SIZE.toString())
          .toString();
        break;
      default:
        return { items: [] };
    }
    const data = await fetchJSON<NovelListResponse>(url);
    const novels = filterNovelList(
      parseNovelList(data.novels),
      getDefaultGenres(),
      getHideAdultContent(),
    );
    const items: DiscoverSectionItem[] = novels.flatMap((novel): DiscoverSectionItem[] => {
      const item = toSearchResultItem(novel);
      switch (section.id) {
        case SECTIONS.TRENDING:
        case SECTIONS.EDITORS: {
          const ratingInfo =
            novel.rating != null
              ? { symbol: "star.fill" as const, text: novel.rating.toFixed(1) }
              : undefined;
          const secondaryInfo =
            section.id === SECTIONS.TRENDING
              ? novel.author
                ? { symbol: "person.fill" as const, text: novel.author }
                : undefined
              : novel.views != null
                ? {
                    symbol: "eye.fill" as const,
                    text: new Intl.NumberFormat("en", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(novel.views),
                  }
                : undefined;
          const infoItems: FeaturedCarouselItem["infoItems"] =
            ratingInfo && secondaryInfo
              ? [ratingInfo, secondaryInfo]
              : ratingInfo
                ? [ratingInfo]
                : secondaryInfo
                  ? [secondaryInfo]
                  : undefined;
          return [
            {
              ...item,
              type: "featuredCarouselItem",
              supertitle:
                section.id === SECTIONS.EDITORS
                  ? novel.author
                  : novel.genres.slice(0, 3).join(", "),
              summary: novel.summary,
              infoItems,
            },
          ];
        }
        case SECTIONS.LATEST:
          return novel.chapterCount > 0
            ? [
                {
                  ...item,
                  type: "chapterUpdatesCarouselItem",
                  // The native endpoint uses positions, even when printed chapter numbers skip.
                  chapterId: String(novel.chapterCount),
                  publishDate: novel.publishDate,
                },
              ]
            : [];
        default:
          return [{ ...item, type: "simpleCarouselItem" }];
      }
    });
    return { items, ...(data.pagination?.has_next ? { metadata: { page: page + 1 } } : {}) };
  }

  private async getGenres(): Promise<Tag[]> {
    try {
      return await (this.genresPromise ??= fetchGenres());
    } catch (error) {
      this.genresPromise = undefined;
      throw error;
    }
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new NovelArchiveAdvancedSearchForm(query, await this.getGenres());
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const search = (query.title ?? "").trim();
    const searchMetadata = query.metadata ?? { status: [], genreMatch: ["all"] };
    const genres = searchMetadata.genres ?? getDefaultGenres();
    const match = searchMetadata.genreMatch?.[0] ?? "all";
    const urlId = /^https?:\/\/(?:www\.)?novelarchive\.(?:cc|st)\//i.test(search)
      ? (search.match(/[?&](?:id|novel)=([^&#]+)/i)?.[1] ??
        search.match(/\/novels?\/([^/?#]+)/i)?.[1])
      : undefined;
    if (urlId) {
      const data = await fetchJSON<NovelDetailResponse>(novelsUrl(decodeId(urlId)));
      return {
        items: filterNovelList(
          parseNovelList([data.novel]),
          genres,
          getHideAdultContent(),
          match,
        ).map(toSearchResultItem),
      };
    }
    const page = metadata?.page ?? 1;
    const data = await fetchJSON<NovelListResponse>(
      buildNovelsUrl({
        page,
        search,
        sort: sortingOption?.id,
        status: searchMetadata.status?.[0],
        genreMatch: match,
        genresInclude: pickGenreValues(genres, "included"),
        genresExclude: pickGenreValues(genres, "excluded"),
      }),
    );
    return {
      items: filterNovelList(parseNovelList(data.novels), genres, getHideAdultContent(), match).map(
        toSearchResultItem,
      ),
      ...(data.pagination?.has_next ? { metadata: { page: page + 1 } } : {}),
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const data = await fetchJSON<NovelDetailResponse>(novelsUrl(decodeId(mangaId)));
    return parseMangaDetails(data.novel, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const novelId = decodeId(sourceManga.mangaId);
    const [data, sources] = await Promise.all([
      fetchJSON<NovelDetailResponse>(novelsUrl(novelId)),
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

  async processTitlesForUpdates(updateManager: UpdateManager): Promise<void> {
    const [first] = updateManager.getQueuedItems();
    if (!first) return;
    try {
      await fetchJSON<NovelDetailResponse>(novelsUrl(decodeId(first.mangaId)));
    } catch (error) {
      // This probe only prompts for Cloudflare; Paperback performs the update fetch.
      if (error instanceof CloudflareError) throw error;
    }
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const novelId = decodeId(chapter.sourceManga.mangaId);
    const separator = chapter.chapterId.lastIndexOf(":");

    // Mirror ids encode the source and chapter number around the final colon.
    if (separator >= 0) {
      const sourceId = decodeId(chapter.chapterId.slice(0, separator));
      const chapterNumber = decodeId(chapter.chapterId.slice(separator + 1));
      const data = await fetchJSON<SourceChapterDetailResponse>(
        novelsUrl(novelId, "sources", sourceId, "chapters", chapterNumber),
      );
      return parseSourceChapterDetails(data, chapter);
    }

    const data = await fetchJSON<ChapterDetailResponse>(
      new URL(novelsUrl(novelId, "chapters", chapter.chapterId))
        .setQueryItem("prefetch", "1")
        .toString(),
    );
    return parseChapterDetails(data, chapter);
  }
}

export const NovelArchive = new NovelArchiveExtension();
