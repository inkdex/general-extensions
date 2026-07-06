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
} from "@paperback/types";

import {
  AllMangaAdvancedSearchForm,
  AllMangaSettingsForm,
  contentRatingForAdult,
  getImageQuality,
  getShowAdult,
} from "./forms";
import {
  CHAPTERS_QUERY,
  DETAILS_QUERY,
  genreId,
  GENRE_NAME_BY_ID,
  GENRE_OPTIONS,
  LATEST_QUERY,
  LIMIT,
  MIRROR_HOSTS,
  POPULAR_QUERY,
  RANDOM_QUERY,
  SEARCH_QUERY,
  SECTION_GENRES,
  SECTION_LATEST,
  SECTION_POPULAR,
  SECTION_POPULAR_MONTH,
  SECTION_POPULAR_WEEK,
  SECTION_RECOMMENDED,
  SORTING_OPTIONS,
  type ChaptersData,
  type DetailsData,
  type MangaCard,
  type PageMetadata,
  type PopularData,
  type RandomData,
  type SearchData,
  type SearchMetadata,
} from "./models";
import makeRequest, { AllMangaInterceptor } from "./network";
import {
  dateFromParts,
  formatCount,
  parseChapters,
  parseMangaDetails,
  parsePageUrls,
  parseThumbnailUrl,
  toSearchResultItem,
} from "./parsers";
import type AllMangaConfig from "./pbconfig";
import { pageListViaWebView } from "./utils/webView";

export class AllMangaExtension implements ExtensionImpl<typeof AllMangaConfig> {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 3,
    bufferInterval: 1,
    ignoreImages: true,
  });
  cookieStorageInterceptor = new CookieStorageInterceptor({ storage: "stateManager" });
  allMangaInterceptor = new AllMangaInterceptor("main");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.allMangaInterceptor.registerInterceptor();
  }

  async getSettingsForm(): Promise<Form> {
    return new AllMangaSettingsForm();
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
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
      { id: SECTION_POPULAR, title: "Popular", type: DiscoverSectionType.featured },
      {
        id: SECTION_POPULAR_WEEK,
        title: "Popular This Week",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: SECTION_POPULAR_MONTH,
        title: "Popular This Month",
        type: DiscoverSectionType.simpleCarousel,
      },
      { id: SECTION_LATEST, title: "Latest Updates", type: DiscoverSectionType.chapterUpdates },
      { id: SECTION_RECOMMENDED, title: "Recommended", type: DiscoverSectionType.simpleCarousel },
      { id: SECTION_GENRES, title: "Genres", type: DiscoverSectionType.genres },
    ];
  }

  private async popularSection(
    page: number,
    dateRange: number,
    toItem: (card: MangaCard, views: string | null | undefined) => DiscoverSectionItem,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const data = await makeRequest<PopularData>(POPULAR_QUERY, {
      type: "manga",
      size: LIMIT,
      dateRange,
      page,
      allowAdult: getShowAdult(),
      allowUnknown: false,
    });
    const recommendations = data.queryPopular.recommendations;
    const items = recommendations
      .filter((rec) => rec.anyCard != null)
      .map((rec) => toItem(rec.anyCard!, rec.pageStatus?.views));
    const hasNext = recommendations.length === LIMIT;
    return { items, metadata: hasNext ? { page: page + 1 } : undefined };
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: PageMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const contentRating = contentRatingForAdult();

    if (section.id === SECTION_GENRES) {
      const items: DiscoverSectionItem[] = GENRE_OPTIONS.map((genre) => ({
        type: "genresCarouselItem",
        name: genre,
        searchQuery: {
          title: "",
          metadata: { genres: { [genreId(genre)]: "included" } } satisfies SearchMetadata,
        },
        metadata: undefined,
      }));
      return { items, metadata: undefined };
    }

    if (section.id === SECTION_RECOMMENDED) {
      const data = await makeRequest<RandomData>(RANDOM_QUERY, {
        format: "manga",
        allowAdult: getShowAdult(),
      });
      const items: DiscoverSectionItem[] = (data.queryRandomRecommendation ?? []).map((card) => ({
        type: "simpleCarouselItem",
        mangaId: card._id,
        title: Application.decodeHTMLEntities(card.englishName || card.name),
        imageUrl: parseThumbnailUrl(card.thumbnail),
        contentRating,
      }));
      return { items, metadata: undefined };
    }

    const page = metadata?.page ?? 1;

    if (section.id === SECTION_POPULAR) {
      return this.popularSection(page, 0, (card, views) => {
        const rating =
          card.score != null
            ? { symbol: "star.fill" as const, text: card.score.toFixed(1) }
            : undefined;
        const viewInfo = views
          ? { symbol: "flame.fill" as const, text: formatCount(views) }
          : undefined;
        const chapters = card.availableChapters?.sub;
        return {
          type: "featuredCarouselItem",
          mangaId: card._id,
          title: Application.decodeHTMLEntities(card.englishName || card.name),
          imageUrl: parseThumbnailUrl(card.thumbnail),
          supertitle: chapters != null ? `${chapters} Chapters` : undefined,
          infoItems:
            rating && viewInfo
              ? [rating, viewInfo]
              : rating
                ? [rating]
                : viewInfo
                  ? [viewInfo]
                  : undefined,
          contentRating,
        };
      });
    }

    if (section.id === SECTION_POPULAR_WEEK) {
      return this.popularSection(page, 7, (card) => ({
        type: "prominentCarouselItem",
        mangaId: card._id,
        title: Application.decodeHTMLEntities(card.englishName || card.name),
        imageUrl: parseThumbnailUrl(card.thumbnail),
        subtitle: card.score != null ? `★ ${card.score.toFixed(1)}` : undefined,
        contentRating,
      }));
    }

    if (section.id === SECTION_POPULAR_MONTH) {
      return this.popularSection(page, 30, (card) => ({
        type: "simpleCarouselItem",
        mangaId: card._id,
        title: Application.decodeHTMLEntities(card.englishName || card.name),
        imageUrl: parseThumbnailUrl(card.thumbnail),
        subtitle: card.score != null ? `★ ${card.score.toFixed(1)}` : undefined,
        contentRating,
      }));
    }

    const data = await makeRequest<SearchData>(LATEST_QUERY, {
      search: {
        query: null,
        sortBy: null,
        genres: null,
        excludeGenres: null,
        isManga: true,
        allowAdult: getShowAdult(),
        allowUnknown: false,
      },
      size: LIMIT,
      page,
      translationType: "sub",
      countryOrigin: "ALL",
    });
    const items: DiscoverSectionItem[] = data.mangas.edges
      .map((card): DiscoverSectionItem | undefined => {
        const latestChapter = card.availableChaptersDetail?.sub?.[0];
        if (!latestChapter) return undefined;
        return {
          type: "chapterUpdatesCarouselItem",
          mangaId: card._id,
          chapterId: latestChapter,
          title: Application.decodeHTMLEntities(card.englishName || card.name),
          imageUrl: parseThumbnailUrl(card.thumbnail),
          subtitle: `Chapter ${latestChapter}`,
          publishDate: dateFromParts(card.lastChapterDate?.sub),
          contentRating,
        };
      })
      .filter((item): item is DiscoverSectionItem => item != null);
    const hasNext = data.mangas.edges.length === LIMIT;
    return { items, metadata: hasNext ? { page: page + 1 } : undefined };
  }

  async getSortingOptions(_query: SearchQuery<SearchMetadata>): Promise<SortingOption[]> {
    return SORTING_OPTIONS;
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchMetadata>): Promise<AdvancedSearchForm> {
    return new AllMangaAdvancedSearchForm(query);
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: PageMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const title = (query.title ?? "").trim();

    const pasted = await this.resolveDirectQuery(title);
    if (pasted) return pasted;

    const page = metadata?.page ?? 1;
    const data = await this.runSearch(title, query.metadata, sortingOption?.id, page);

    const contentRating = contentRatingForAdult();
    const items = data.mangas.edges.map((card) => toSearchResultItem(card, contentRating));
    const hasNext = data.mangas.edges.length === LIMIT;

    return { items, metadata: hasNext ? { page: page + 1 } : undefined };
  }

  private async resolveDirectQuery(
    query: string,
  ): Promise<PagedResults<SearchResultItem> | undefined> {
    let id: string | undefined;
    const mirrorHostsPattern = MIRROR_HOSTS.map((host) => host.replace(/\./g, "\\.")).join("|");
    const urlMatch = query.match(
      new RegExp(`^https?:\\/\\/[^/]*(?:${mirrorHostsPattern})\\/manga\\/([^/?#]+)`, "i"),
    );
    if (urlMatch) {
      id = decodeURIComponent(urlMatch[1]);
    } else if (query.toLowerCase().startsWith("id:")) {
      id = query.slice(3).trim();
    }
    if (!id) return undefined;

    try {
      const manga = await this.getMangaDetails(id);
      return {
        items: [
          {
            mangaId: manga.mangaId,
            title: manga.mangaInfo.primaryTitle,
            imageUrl: manga.mangaInfo.thumbnailUrl,
            contentRating: manga.mangaInfo.contentRating,
          },
        ],
        metadata: undefined,
      };
    } catch (error) {
      if (error instanceof CloudflareError) throw error;
      return undefined;
    }
  }

  private async runSearch(
    title: string,
    meta: SearchMetadata | undefined,
    sortId: string | undefined,
    page: number,
  ): Promise<SearchData> {
    const ids = (state: "included" | "excluded") =>
      Object.entries(meta?.genres ?? {})
        .filter(([, s]) => s === state)
        .map(([id]) => id);
    // Ids from the fixed GENRE_OPTIONS list go to `genres`; ids from a
    // manga's own detail tags (not in that list) go to `tags` instead.
    const toNames = (id: string) => GENRE_NAME_BY_ID[id] ?? id.replace(/_/g, " ");
    const isGenre = (id: string) => id in GENRE_NAME_BY_ID;
    const includedIds = ids("included");
    const excludedIds = ids("excluded");
    const includedGenres = includedIds.filter(isGenre).map(toNames);
    const excludedGenres = excludedIds.filter(isGenre).map(toNames);
    const includedTags = includedIds.filter((id) => !isGenre(id)).map(toNames);
    const excludedTags = excludedIds.filter((id) => !isGenre(id)).map(toNames);

    return makeRequest<SearchData>(SEARCH_QUERY, {
      search: {
        query: title.length > 0 ? title : null,
        sortBy: sortId ? sortId : null,
        genres: includedGenres.length > 0 ? includedGenres : null,
        excludeGenres: excludedGenres.length > 0 ? excludedGenres : null,
        tags: includedTags.length > 0 ? includedTags : null,
        excludeTags: excludedTags.length > 0 ? excludedTags : null,
        isManga: true,
        allowAdult: getShowAdult(),
        allowUnknown: false,
      },
      size: LIMIT,
      page,
      translationType: "sub",
      countryOrigin: meta?.country?.[0] ?? "ALL",
    });
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const data = await makeRequest<DetailsData>(DETAILS_QUERY, { id: mangaId });
    return parseMangaDetails(mangaId, data.manga);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId;
    const data = await makeRequest<ChaptersData>(CHAPTERS_QUERY, {
      id: mangaId,
      showId: `manga@${mangaId}`,
    });
    return parseChapters(sourceManga, data);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const mangaId = chapter.sourceManga.mangaId;
    const quality = getImageQuality();

    // chapterPages has no working direct-query path; only WebView can serve real pages.
    const data = await pageListViaWebView(
      mangaId,
      chapter.chapterId,
      this.cookieStorageInterceptor,
    );
    const pages = data ? parsePageUrls(data, quality) : [];

    if (pages.length === 0) {
      throw new Error(`No pages found for chapter ${chapter.chapterId}.`);
    }

    return {
      id: chapter.chapterId,
      mangaId,
      pages,
    };
  }
}

export const AllManga = new AllMangaExtension();
