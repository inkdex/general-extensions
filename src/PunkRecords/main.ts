/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  URL,
  type Chapter,
  type ChapterDetails,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type Form,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { PunkRecordsSettingsForm } from "./forms";
import {
  DOMAIN,
  PUNK_RECORDS_SECTIONS,
  PUNK_RECORDS_STATE_KEYS,
  type CatalogueEntry,
} from "./models";
import { MainInterceptor } from "./network";
import { PunkRecordsParser } from "./parsers";
import type PunkRecordsConfig from "./pbconfig";

export class PunkRecordsExtension implements ExtensionImpl<typeof PunkRecordsConfig> {
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
    return new PunkRecordsSettingsForm();
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return this.parser.buildDiscoverSections(
      Application.getState(PUNK_RECORDS_STATE_KEYS.ShowCatalogueOnHome) !== false,
    );
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: unknown,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    void metadata;

    const [catalogue, homeHtml] = await Promise.all([
      this.fetchCatalogue(),
      section.id === PUNK_RECORDS_SECTIONS.LATEST
        ? Application.scheduleRequest({
            url: `${DOMAIN}/`,
            method: "GET",
          }).then(([, buffer]) => Application.arrayBufferToUTF8String(buffer))
        : Promise.resolve(""),
    ]);

    if (
      section.id === PUNK_RECORDS_SECTIONS.LATEST ||
      section.id === PUNK_RECORDS_SECTIONS.CATALOGUE
    ) {
      return {
        items: this.parser.buildDiscoverItems(section.id, catalogue, homeHtml),
      };
    }

    return { items: [] };
  }

  async getSearchResults(
    query: SearchQuery<never>,
    metadata: unknown,
    sortingOption: SortingOption | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    void metadata;
    void sortingOption;

    const catalogue = await this.fetchCatalogue();
    return { items: this.parser.buildSearchResults(catalogue, query.title ?? "") };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const [mangaPageHtml, catalogue] = await Promise.all([
      Application.scheduleRequest({
        url: this.buildMangaUrl(mangaId),
        method: "GET",
      }).then(([, buffer]) => Application.arrayBufferToUTF8String(buffer)),
      this.fetchCatalogue(),
    ]);
    const fallbackEntry = catalogue.find((manga) => manga.mangaId === mangaId);
    const manga = this.parser.parseMangaDetails(mangaId, mangaPageHtml, fallbackEntry);

    return {
      ...manga,
      mangaInfo: {
        ...manga.mangaInfo,
        shareUrl: this.buildMangaUrl(mangaId),
      },
    };
  }

  async getChapters(sourceManga: SourceManga, sinceDate?: Date): Promise<Chapter[]> {
    void sinceDate;

    const [, buffer] = await Application.scheduleRequest({
      url: this.buildMangaUrl(sourceManga.mangaId),
      method: "GET",
    });
    return this.parser.parseChapterList(Application.arrayBufferToUTF8String(buffer), sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const [, buffer] = await Application.scheduleRequest({
      url: new URL(DOMAIN)
        .addPathComponent("mangas")
        .addPathComponent(chapter.sourceManga.mangaId)
        .addPathComponent(chapter.chapterId)
        .toString(),
      method: "GET",
    });
    return this.parser.parseChapterDetails(Application.arrayBufferToUTF8String(buffer), chapter);
  }

  private async fetchCatalogue(): Promise<CatalogueEntry[]> {
    const [, buffer] = await Application.scheduleRequest({
      url: new URL(DOMAIN).addPathComponent("mangas").toString(),
      method: "GET",
    });
    return this.parser.parseCatalogue(Application.arrayBufferToUTF8String(buffer));
  }

  private buildMangaUrl(mangaId: string): string {
    return new URL(DOMAIN).addPathComponent("mangas").addPathComponent(mangaId).toString();
  }
}

export const PunkRecords = new PunkRecordsExtension();
