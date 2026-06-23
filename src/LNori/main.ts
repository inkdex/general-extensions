/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  DiscoverSectionType,
  URL,
  type Chapter,
  type ChapterDetails,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";

import { DOMAIN } from "./models";
import { fetchHTML, mainRateLimiter } from "./network";
import { LNoriParser } from "./parser";
import type LNoriConfig from "./pbconfig";

export class LNoriExtension implements ExtensionImpl<typeof LNoriConfig> {
  parser = new LNoriParser();

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const discover_section: DiscoverSection[] = [];
    discover_section.push({
      id: "prominent",
      title: "Top",
      subtitle: "",
      type: DiscoverSectionType.featured,
    });
    discover_section.push({
      id: "seasonal",
      title: "Seasonal",
      subtitle: "",
      type: DiscoverSectionType.prominentCarousel,
    });
    discover_section.push({
      id: "popular",
      title: "Popular",
      subtitle: "",
      type: DiscoverSectionType.prominentCarousel,
    });
    return discover_section;
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const html = await fetchHTML(DOMAIN);
    switch (section.id) {
      case "prominent": {
        return this.parser.parseProminent(html);
      }
      case "seasonal": {
        return this.parser.extractSection(html, "winter-heading");
      }
      case "popular": {
        return this.parser.extractSection(html, "library-heading");
      }
      default:
        return { items: [] };
    }
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const url = new URL(DOMAIN).addPathComponent(mangaId);
    const html = await fetchHTML(url.toString());
    return this.parser.extractSeriesDetails(mangaId, html);
  }

  async getSearchResults(
    query: SearchQuery<{}>,
    _metadata: undefined,
    _sortingOption: undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const html = await fetchHTML(`${DOMAIN}/library`);
    return this.parser.parseSearch(html, query.title);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const volumes: { title: string; link: string; dot5: boolean }[] = JSON.parse(
      sourceManga.mangaInfo.additionalInfo?.volumes ?? "",
    );
    let novels: Chapter[] = [];
    let volumeNum = 0;
    volumes.forEach((volume, index) => {
      if (volume.dot5) {
        volumeNum = volumeNum + 0.5;
      } else {
        if (Number.isInteger(volumeNum)) {
          volumeNum = volumeNum + 1;
        } else {
          volumeNum = volumeNum + 0.5;
        }
      }
      novels.push({
        chapterId: volume.link,
        volume: volumeNum,
        title: volume.title,
        sourceManga: sourceManga,
        langCode: "en",
        sortingIndex: index,
        chapNum: 1,
      });
    });
    return novels.reverse();
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const url = new URL(DOMAIN).addPathComponent(chapter.chapterId);
    const html = await fetchHTML(url.toString());
    return this.parser.parseChapter(chapter, html);
  }

  async initialise(): Promise<void> {
    mainRateLimiter.registerInterceptor();
  }
}

export const LNori = new LNoriExtension();
