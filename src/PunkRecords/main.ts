/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
  type Form,
  type MangaProviding,
  type PagedResults,
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { SettingsForm } from "./forms";
import { PUNK_RECORDS_SECTIONS, getShowCatalogueOnHome, type CatalogueEntry } from "./models";
import { MainInterceptor } from "./network";
import { PunkRecordsParser, parseCatalogue } from "./parsers";
import { DOMAIN, MANGA_PATH, fetchText, toChapterUrl, toMangaUrl } from "./utils";

type PunkRecordsImplementation = SettingsFormProviding &
  Extension &
  DiscoverSectionProviding &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding;

export class PunkRecordsExtension implements PunkRecordsImplementation {
  parser = new PunkRecordsParser();

  mainRateLimiter = new BasicRateLimiter("main", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });

  mainInterceptor = new MainInterceptor("main");

  async initialise(): Promise<void> {
    this.mainRateLimiter.registerInterceptor();
    this.mainInterceptor.registerInterceptor();
  }

  async getSettingsForm(): Promise<Form> {
    return new SettingsForm();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return this.parser.buildDiscoverSections(getShowCatalogueOnHome());
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: unknown,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    void metadata;

    const [catalogue, homeHtml] = await Promise.all([
      this.fetchCatalogue(),
      section.id === PUNK_RECORDS_SECTIONS.latest ? this.fetchHtml(DOMAIN) : Promise.resolve(""),
    ]);

    if (
      section.id === PUNK_RECORDS_SECTIONS.latest ||
      section.id === PUNK_RECORDS_SECTIONS.catalogue
    ) {
      return {
        items: this.parser.buildDiscoverItems(section.id, catalogue, homeHtml),
      };
    }

    return { items: [] };
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    return [];
  }

  async getSearchResults(
    query: SearchQuery,
    metadata: unknown,
    sortingOption: SortingOption | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    void metadata;
    void sortingOption;

    const catalogue = await this.fetchCatalogue();
    return { items: this.parser.buildSearchResults(catalogue, query.title ?? "") };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const [html, catalogue] = await Promise.all([
      this.fetchHtml(toMangaUrl(mangaId)),
      this.fetchCatalogue(),
    ]);
    const fallbackEntry = catalogue.find((manga) => manga.mangaId === mangaId);
    const manga = this.parser.parseMangaDetails(
      mangaId,
      html,
      fallbackEntry,
      `${DOMAIN}/logo512.png`,
    );

    return {
      ...manga,
      mangaInfo: {
        ...manga.mangaInfo,
        shareUrl: toMangaUrl(mangaId),
      },
    };
  }

  async getChapters(sourceManga: SourceManga, sinceDate?: Date): Promise<Chapter[]> {
    void sinceDate;

    const html = await this.fetchHtml(toMangaUrl(sourceManga.mangaId));
    return this.parser.parseChapterList(html, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const html = await this.fetchHtml(toChapterUrl(chapter.sourceManga.mangaId, chapter.chapterId));
    return this.parser.parseChapterDetails(html, chapter);
  }

  private async fetchCatalogue(): Promise<CatalogueEntry[]> {
    const html = await this.fetchHtml(MANGA_PATH);
    return parseCatalogue(html);
  }

  private async fetchHtml(url: string): Promise<string> {
    return fetchText({
      url,
      method: "GET",
    });
  }
}

export const PunkRecords = new PunkRecordsExtension();
