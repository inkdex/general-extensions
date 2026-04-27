/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  DiscoverSectionType,
  URL,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Metadata,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { WebtoonAdvancedSearchForm } from "./forms";
import type { SearchMetadata } from "./models";
import {
  type Tag,
  type WebtoonsSearchingMetadata,
  type WebtoonChaptersListDto,
  BASE_URL,
  MOBILE_URL,
  getDateDayFormat,
  getLanguagesTitle,
  Language,
} from "./models";
import { WebtoonInfra } from "./network";

export class WebtoonExtention
  extends WebtoonInfra
  implements SearchResultsProviding, ChapterProviding, DiscoverSectionProviding
{
  getMangaDetails(mangaId: string): Promise<SourceManga> {
    return this.ExecRequest(
      {
        url: `${BASE_URL}/${mangaId}`,
      },
      ($) => this.parseDetails($, mangaId),
    );
  }

  getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const titleUrl = new URL(`${BASE_URL}/${sourceManga.mangaId}`);
    const titleId = titleUrl.queryItems!["title_no"].toString();
    const isCanvas = titleUrl.path.includes("/canvas/");
    const segment = isCanvas ? "canvas" : "webtoon";

    return this.ExecApiRequest(
      {
        url: `${MOBILE_URL}/api/v1/${segment}/${titleId}/episodes`,
        params: { pageSize: 99999 },
        headers: { referer: MOBILE_URL },
      },
      (dto: WebtoonChaptersListDto) => this.parseChaptersList(dto, sourceManga),
    );
  }

  getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    return this.ExecRequest(
      {
        url: `${BASE_URL}/${chapter.chapterId}`,
      },
      ($) => this.parseChapterDetails($, chapter),
    );
  }

  getPopularTitles(
    language: Language,
    metadata: WebtoonsSearchingMetadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.ExecPagedResultsRequest(
      { url: `${BASE_URL}/${language}/ranking/popular` },
      { page: metadata?.page ?? 0, maxPages: 1 },
      ($) => this.parseTodayTitles($, true),
    );
  }

  getTodayTitles(
    language: Language,
    metadata: WebtoonsSearchingMetadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.ExecPagedResultsRequest(
      {
        url: `${BASE_URL}/${language}/originals/${getDateDayFormat()}`,
      },
      { page: metadata?.page ?? 0, maxPages: 1 },
      ($) => this.parseTodayTitles($, true),
    );
  }

  getTrendingTitles(
    language: Language,
    metadata: WebtoonsSearchingMetadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.ExecPagedResultsRequest(
      { url: `${BASE_URL}/${language}/ranking/trending` },
      { page: metadata?.page ?? 0, maxPages: 1 },
      ($) => this.parseTodayTitles($, true),
    );
  }

  getCompletedTitles(
    language: Language,
    metadata: WebtoonsSearchingMetadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.ExecPagedResultsRequest(
      { url: `${BASE_URL}/${language}/originals/complete` },
      { page: metadata?.page ?? 0, maxPages: 1 },
      ($) => this.parseTodayTitles($, true),
    );
  }

  getCanvasRecommendedTitles(language: Language): Promise<PagedResults<SearchResultItem>> {
    return this.ExecRequest({ url: `${BASE_URL}/${language}/canvas` }, ($) =>
      this.parseCanvasRecommendedTitles($),
    );
  }

  getCanvasPopularTitles(
    language: Language,
    metadata: WebtoonsSearchingMetadata | undefined,
    genre?: string,
    sortOrder?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.ExecPagedResultsRequest(
      {
        url: `${BASE_URL}/${language}/canvas/list`,
        params: {
          genreTab: genre ?? "ALL",
          sortOrder: sortOrder?.id ?? "MANA",
        },
      },
      { page: metadata?.page ?? 0 },
      ($) => this.parseCanvasPopularTitles($),
    );
  }

  getTitlesByGenre(
    language: Language,
    genre: string,
    sortOrder: SortingOption | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.ExecRequest(
      {
        url: `${BASE_URL}/${language}/genres/${genre}`,
        params: { sortOrder: sortOrder?.id ?? "" },
      },
      ($) => this.parseTagResults($),
    );
  }

  getTitlesByKeyword(
    language: Language,
    keyword: string,
    metadata: WebtoonsSearchingMetadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    return this.ExecPagedResultsRequest(
      {
        url: `${BASE_URL}/${language}/search`,
        params: {
          keyword: keyword,
          // ...(this.canvasWanted ? {} : { searchType: "WEBTOON" }),
        },
      },
      { page: metadata?.page ?? 0 },
      ($) => this.parseSearchResults($),
    );
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: Metadata | undefined,
    sortingOption: SortingOption | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const result: Promise<PagedResults<SearchResultItem>>[] = [];

    const searchMetadata = query.metadata ?? { genres: [], languages: [] };

    const genres: string =
      searchMetadata.genres.length !== 0 ? searchMetadata.genres.join("%%") : "ALL";

    const languages: Language[] =
      searchMetadata.languages.length !== 0
        ? (searchMetadata.languages as Language[])
        : this.languages;

    languages.forEach((lang) => {
      result.push(
        genres !== "ALL"
          ? genres.startsWith("CANVAS%%")
            ? this.getCanvasPopularTitles(
                lang,
                metadata as WebtoonsSearchingMetadata,
                genres.split("%%")[1],
                sortingOption,
              )
            : this.getTitlesByGenre(lang, genres, sortingOption)
          : query.title
            ? this.getTitlesByKeyword(lang, query.title, metadata as WebtoonsSearchingMetadata)
            : Promise.resolve({ items: [] }),
      );
    });

    return Promise.all(result).then((res) => {
      return {
        items: res.flatMap((r) => r.items),
        metadata: res.filter((r) => r.metadata != undefined)[0]?.metadata ?? undefined,
      };
    });
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: WebtoonsSearchingMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let result: PagedResults<SearchResultItem> = { items: [] };
    const [languagestr, sectionId] = section.id.split("-_-");
    const language = languagestr as Language;

    switch (sectionId) {
      case "trending":
        result = await this.getTrendingTitles(language, metadata);
        break;
      case "today":
        result = await this.getTodayTitles(language, metadata);
        break;
      case "popular":
        result = await this.getPopularTitles(language, metadata);
        break;
      case "completed":
        result = await this.getCompletedTitles(language, metadata);
        break;
      case "canvas_recommended":
        result = await this.getCanvasRecommendedTitles(language);
        break;
      case "canvas_popular":
        result = await this.getCanvasPopularTitles(language, metadata);
        break;
    }

    return {
      items: result.items.map(
        (item) =>
          ({
            type: "simpleCarouselItem",
            ...item,
          }) as DiscoverSectionItem,
      ),
      metadata: result.metadata,
    };
  }

  getDiscoverSections(): Promise<DiscoverSection[]> {
    const result: DiscoverSection[] = [];
    this.languages.forEach((language) => {
      result.push(...this.getLanguageDiscoverSections(language));
    });
    return Promise.resolve(result);
  }

  getLanguageDiscoverSections(language: Language): DiscoverSection[] {
    const idBegin = `${language}-_-`;
    const titleBegin = this.languages.length > 1 ? `${getLanguagesTitle(language)} - ` : "";
    return [
      {
        id: `${idBegin}trending`,
        title: `${titleBegin}New & Trending`,
        type: DiscoverSectionType.prominentCarousel,
      },

      {
        id: `${idBegin}today`,
        title: `${titleBegin}Today release`,
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: `${idBegin}popular`,
        title: `${titleBegin}Popular`,
        type: DiscoverSectionType.simpleCarousel,
      },
      {
        id: `${idBegin}completed`,
        title: `${titleBegin}Completed`,
        type: DiscoverSectionType.simpleCarousel,
      },
      ...(this.canvasWanted
        ? [
            {
              id: `${idBegin}canvas_recommended`,
              title: `${titleBegin}Canvas Recommended`,
              type: DiscoverSectionType.simpleCarousel,
            },
            {
              id: `${idBegin}canvas_popular`,
              title: `${titleBegin}Canvas Popular`,
              type: DiscoverSectionType.simpleCarousel,
            },
          ]
        : []),
    ];
  }

  // TODO GENRES LOCALISATION
  async getSearchGenres(): Promise<Tag[]> {
    return [
      { id: "ALL", title: "ALL" },
      ...(await this.ExecRequest({ url: `${BASE_URL}/en/genres` }, ($) => this.parseGenres($))),
      ...(this.canvasWanted
        ? await this.ExecRequest({ url: `${BASE_URL}/en/canvas` }, ($) => this.parseCanvasGenres($))
        : []),
    ];
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "MANA", label: "Popularity" },
      { id: "LIKEIT", label: "Likes" },
      { id: "UPDATE", label: "Date" },
    ];
  }

  async getAdvancedSearchForm(searchQuery: SearchQuery<Metadata>): Promise<AdvancedSearchForm> {
    const genres = await this.getSearchGenres();

    return new WebtoonAdvancedSearchForm(searchQuery as SearchQuery<SearchMetadata>, genres);
  }
}

export const Webtoon = new WebtoonExtention();
