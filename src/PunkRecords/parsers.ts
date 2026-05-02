/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  DiscoverSectionType,
  URL,
  type Chapter,
  type ChapterDetails,
  type DiscoverSection,
  type DiscoverSectionItem,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";

import {
  API_DOMAIN,
  type CatalogueEntry,
  type DiscoverItemType,
  type PunkRecordsSectionId,
} from "./models";

const FALLBACK_THUMBNAIL = "icon.png";

type PunkRecordsMangaRecord = {
  __typename: "Manga";
  name?: string;
  slug?: string;
  thumb?: string;
  published?: boolean;
};

export class PunkRecordsParser {
  buildDiscoverSections(showCatalogueOnHome: boolean): DiscoverSection[] {
    const sections: DiscoverSection[] = [
      {
        id: "latest",
        title: "Dernieres sorties",
        type: DiscoverSectionType.featured,
      },
    ];

    if (showCatalogueOnHome) {
      sections.push({
        id: "catalogue",
        title: "Catalogue",
        type: DiscoverSectionType.simpleCarousel,
      });
    }

    return sections;
  }

  buildDiscoverItems(
    sectionId: PunkRecordsSectionId,
    catalogue: CatalogueEntry[],
    homeHtml: string,
  ): DiscoverSectionItem[] {
    if (sectionId === "latest") {
      const latestIds = this.extractLatestUpdatedMangaIds(cheerio.load(homeHtml));
      return latestIds
        .map((mangaId) => catalogue.find((entry) => entry.mangaId === mangaId))
        .filter((entry): entry is CatalogueEntry => entry !== undefined)
        .map((entry) => this.toDiscoverItem(entry, "featuredCarouselItem"));
    }

    return catalogue.map((entry) => this.toDiscoverItem(entry, "simpleCarouselItem"));
  }

  buildSearchResults(catalogue: CatalogueEntry[], query: string): SearchResultItem[] {
    const search = this.normalizeString(query);
    return catalogue
      .filter((entry) => !search || this.normalizeString(entry.title).includes(search))
      .map((entry) => ({
        mangaId: entry.mangaId,
        title: entry.title,
        imageUrl: entry.image,
        contentRating: ContentRating.EVERYONE,
      }));
  }

  parseMangaDetails(
    mangaId: string,
    html: string,
    fallbackEntry: CatalogueEntry | undefined,
  ): SourceManga {
    const $ = cheerio.load(html);
    const primaryTitle = (this.extractTagContent($, "title") ?? fallbackEntry?.title ?? mangaId)
      .replace(/\s+\|\s+Punk Records.*$/i, "")
      .replace(/\s+-\s+Scan couleur$/i, "")
      .trim();
    const thumbnailUrl =
      this.extractMetaContent($, "property", "og:image") ??
      fallbackEntry?.image ??
      FALLBACK_THUMBNAIL;
    const synopsis =
      this.extractMetaContent($, "name", "description") ?? "Aucune description disponible.";
    const keywords = this.extractMetaContent($, "name", "keywords");
    const creator = keywords
      ?.split(",")
      .map((part) => part.trim())
      .filter((part) => /^[A-ZÀ-ÖØ-Þ][\p{L}.'-]+(?:\s+[A-ZÀ-ÖØ-Þ][\p{L}.'-]+)+$/u.test(part))
      .at(-1);

    return {
      mangaId,
      mangaInfo: {
        thumbnailUrl,
        synopsis,
        primaryTitle,
        secondaryTitles: [],
        contentRating: ContentRating.EVERYONE,
        author: creator,
        artist: creator,
        status: "Ongoing",
        additionalInfo: {
          format: "Scan couleur",
        },
        artworkUrls: [thumbnailUrl],
      },
    };
  }

  parseChapterList(html: string, sourceManga: SourceManga): Chapter[] {
    const $ = cheerio.load(html);
    const chapters: Chapter[] = [];
    const seen = new Set<string>();

    $(`a[href^="/mangas/${sourceManga.mangaId}/"]`).each((_, element) => {
      const hrefParts = ($(element).attr("href") ?? "").split("/").filter(Boolean);
      const chapterId = hrefParts[2]?.trim();
      const title = $(element).text().trim();

      if (!chapterId || seen.has(chapterId)) {
        return;
      }

      chapters.push({
        chapterId,
        sourceManga,
        langCode: "FR",
        chapNum: this.extractChapterNumber(chapterId, title),
        title: title || undefined,
      });
      seen.add(chapterId);
    });

    if (!chapters.length) {
      throw new Error(`Couldn't find any chapters for mangaId: ${sourceManga.mangaId}!`);
    }

    return chapters;
  }

  parseChapterDetails(html: string, chapter: Chapter): ChapterDetails {
    const $ = cheerio.load(html);
    const pages: string[] = [];
    const seen = new Set<string>();

    $('img[alt*="-page-"]').each((_, element) => {
      const page = $(element).attr("src")?.trim();
      if (!page || seen.has(page)) {
        return;
      }

      if (!page.startsWith(`${API_DOMAIN}/images/`)) {
        return;
      }

      pages.push(page);
      seen.add(page);
    });

    if (!pages.length) {
      throw new Error(
        `Couldn't find any pages for mangaId: ${chapter.sourceManga.mangaId} chapterId: ${chapter.chapterId}!`,
      );
    }

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages,
    };
  }

  parseCatalogue(html: string): CatalogueEntry[] {
    const $ = cheerio.load(html);
    const scriptTexts = $("script")
      .toArray()
      .map((element) => $(element).text().trim())
      .filter((text) => text.length > 0);
    const entries = this.parseCatalogueScripts(scriptTexts);
    if (!entries.length) {
      throw new Error("Couldn't parse the Punk Records catalogue.");
    }

    return entries;
  }

  private extractMetaContent(
    $: cheerio.CheerioAPI,
    attribute: "name" | "property",
    key: string,
  ): string | undefined {
    return $(`meta[${attribute}="${key}"]`).attr("content")?.trim();
  }

  private extractTagContent($: cheerio.CheerioAPI, tagName: string): string | undefined {
    return $(tagName).first().text().trim() || undefined;
  }

  private extractLatestUpdatedMangaIds($: cheerio.CheerioAPI): string[] {
    return $('a[href^="/mangas/"]')
      .toArray()
      .map((element) => ($(element).attr("href") ?? "").split("/").filter(Boolean)[1])
      .filter((mangaId): mangaId is string => Boolean(mangaId))
      .reduce<string[]>((mangaIds, mangaId) => {
        if (!mangaIds.includes(mangaId)) {
          mangaIds.push(mangaId);
        }

        return mangaIds;
      }, []);
  }

  /**
   * Punk Records exposes chapter labels in French ("Chapitre 12")
   */
  private extractChapterNumber(chapterId: string, title: string): number {
    const titleMatch = /chapitre\s+([\d.]+)/i.exec(title);
    if (titleMatch?.[1]) {
      return Number(titleMatch[1]);
    }

    const chapterMatch = /([\d.]+)/.exec(chapterId);
    return chapterMatch?.[1] ? Number(chapterMatch[1]) : 0;
  }

  private normalizeString(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  private isPunkRecordsMangaRecord(
    value: Record<string, unknown>,
  ): value is PunkRecordsMangaRecord {
    return (
      value.__typename === "Manga" &&
      (!("name" in value) || typeof value.name === "string") &&
      (!("slug" in value) || typeof value.slug === "string") &&
      (!("thumb" in value) || typeof value.thumb === "string") &&
      (!("published" in value) || typeof value.published === "boolean")
    );
  }

  private addCatalogueEntry(
    entries: CatalogueEntry[],
    seen: Set<string>,
    rawTitle: string | undefined,
    mangaId: string | undefined,
    thumb: string | undefined,
    published: boolean,
  ): void {
    if (!published || !rawTitle || !mangaId || !thumb || seen.has(mangaId)) {
      return;
    }

    entries.push({
      mangaId,
      title: JSON.parse(`"${rawTitle}"`) as string,
      image: new URL(API_DOMAIN)
        .addPathComponent("images")
        .addPathComponent("webp")
        .addPathComponent(`${thumb}.webp`)
        .toString(),
    });
    seen.add(mangaId);
  }

  private walkCatalogueJson(value: unknown, entries: CatalogueEntry[], seen: Set<string>): void {
    if (Array.isArray(value)) {
      for (const item of value) {
        this.walkCatalogueJson(item, entries, seen);
      }
      return;
    }

    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return;
    }

    const record = value as Record<string, unknown>;

    if (this.isPunkRecordsMangaRecord(record)) {
      this.addCatalogueEntry(
        entries,
        seen,
        record.name,
        record.slug,
        record.thumb,
        record.published !== false,
      );
    }

    for (const child of Object.values(record)) {
      this.walkCatalogueJson(child, entries, seen);
    }
  }

  private parseCatalogueScripts(scriptTexts: string[]): CatalogueEntry[] {
    const entries: CatalogueEntry[] = [];
    const seen = new Set<string>();

    for (const scriptText of scriptTexts) {
      try {
        this.walkCatalogueJson(JSON.parse(scriptText), entries, seen);
      } catch {
        // Next.js flight chunks are handled by the serialized fallback below.
      }
    }

    const normalizedScripts = scriptTexts
      .join("\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\u0026/g, "&")
      .replace(/\\u0026/g, "&");
    const mangaRegex =
      /"__typename":"Manga"[\s\S]{0,250}?"name":"((?:\\.|[^"\\])*)"[\s\S]{0,250}?"slug":"([^"]+)"[\s\S]{0,250}?"thumb":"([^"]+)"(?:[\s\S]{0,120}?"published":(true|false))?/g;
    let match: RegExpExecArray | null;

    while ((match = mangaRegex.exec(normalizedScripts)) !== null) {
      this.addCatalogueEntry(entries, seen, match[1], match[2], match[3], match[4] !== "false");
    }

    return entries;
  }

  private toDiscoverItem(entry: CatalogueEntry, type: DiscoverItemType): DiscoverSectionItem {
    return {
      type,
      mangaId: entry.mangaId,
      title: entry.title,
      imageUrl: entry.image,
      contentRating: ContentRating.EVERYONE,
    };
  }
}
