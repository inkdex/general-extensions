/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  BasicRateLimiter,
  DiscoverSectionType,
  Form,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { RoyalRoadAdvancedSearchForm, RoyalRoadSettingsForm } from "./forms";
import { getShareUrl } from "./helpers";
import {
  DISCOVER_LISTINGS,
  GENRES,
  SORT_ORDERS,
  type RoyalRoadMetadata,
  type SearchMetadata,
} from "./models";
import { RoyalRoadInterceptor } from "./network";
import {
  fetchChapterPage,
  fetchListingPage,
  fetchMangaDetailsPage,
  fetchSearchPage,
} from "./network";
import {
  isLastListingPage,
  parseChapterDetails,
  parseChapters,
  parseFictionEntries,
  parseMangaDetails,
} from "./parsers";

export class RoyalRoadExtension
  implements
    Extension,
    SearchResultsProviding,
    MangaProviding,
    ChapterProviding,
    DiscoverSectionProviding,
    SettingsFormProviding
{
  globalRateLimiter = new BasicRateLimiter("ratelimiter", {
    numberOfRequests: 5,
    bufferInterval: 0.5,
    ignoreImages: true,
  });

  requestManager = new RoyalRoadInterceptor("main");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.requestManager.registerInterceptor();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const sections: DiscoverSection[] = DISCOVER_LISTINGS.map((listing) => ({
      id: listing.id,
      title: listing.title,
      type: listing.type,
    }));
    sections.push({ id: "genres", title: "Genres", type: DiscoverSectionType.genres });
    return sections;
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: RoyalRoadMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    if (section.id === "genres") {
      const items: DiscoverSectionItem[] = GENRES.map((genre) => ({
        type: "genresCarouselItem",
        searchQuery: { title: "", metadata: { genres: { [genre.id]: "included" } } },
        name: genre.title,
        metadata: undefined,
      }));
      return { items, metadata: undefined };
    }

    const page = metadata?.page ?? 1;
    const [, buffer] = await fetchListingPage(section.id, page);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const items: DiscoverSectionItem[] = parseFictionEntries($).map((entry) => ({
      type:
        section.type === DiscoverSectionType.featured
          ? "featuredCarouselItem"
          : "simpleCarouselItem",
      mangaId: entry.mangaId,
      title: entry.title,
      imageUrl: entry.imageUrl,
      subtitle: entry.stats?.chapters ?? undefined,
      infoItems: [
        { symbol: "book.fill", text: `${entry.stats?.chapters}` },
        { symbol: "star.fill", text: `Rating ${entry.stats?.rating ?? 0}` },
      ],
      summary: entry.description,
    }));

    return {
      items,
      metadata: isLastListingPage($) ? undefined : { page: page + 1 },
    };
  }

  getMangaShareUrl(mangaId: string): string {
    return getShareUrl(mangaId);
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const [, buffer] = await fetchMangaDetailsPage(mangaId);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return parseMangaDetails($, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const [, buffer] = await fetchMangaDetailsPage(sourceManga.mangaId);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return parseChapters($, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const [, buffer] = await fetchChapterPage(chapter.chapterId);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return parseChapterDetails($, chapter.sourceManga.mangaId, chapter.chapterId);
  }

  async supportsTagExclusion(): Promise<boolean> {
    return false;
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return SORT_ORDERS.map((order) => ({ id: order.id, label: order.label }));
  }

  async getSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: RoyalRoadMetadata | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const md = query.metadata ?? {};

    // Genres and tags share Royal Road's tagsAdd/tagsRemove parameters.
    const tagsAdd: string[] = [];
    const tagsRemove: string[] = [];
    for (const [id, state] of Object.entries({ ...md.genres, ...md.tags })) {
      if (state === "included") tagsAdd.push(id);
      else if (state === "excluded") tagsRemove.push(id);
    }

    const [, buffer] = await fetchSearchPage({
      title: query.title ?? "",
      author: md.author,
      orderBy: sortingOption?.id ?? "relevance",
      ascending: md.ascending,
      status: md.status,
      type: md.type,
      tagsAdd,
      tagsRemove,
      contentWarnings: md.contentWarnings ?? [],
      page,
    });
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const items: SearchResultItem[] = parseFictionEntries($).map((entry) => ({
      mangaId: entry.mangaId,
      title: entry.title,
      imageUrl: entry.imageUrl,
      subtitle: entry.stats?.chapters,
    }));

    return {
      items,
      metadata: isLastListingPage($) ? undefined : { page: page + 1 },
    };
  }

  async getAdvancedSearchForm(
    searchQuery: SearchQuery<SearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    return new RoyalRoadAdvancedSearchForm(searchQuery);
  }

  async getSettingsForm(): Promise<Form> {
    return new RoyalRoadSettingsForm();
  }
}

export const RoyalRoad = new RoyalRoadExtension();
