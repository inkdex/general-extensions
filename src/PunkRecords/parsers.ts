/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  DiscoverSectionType,
  type Chapter,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";

import type {
  CatalogueEntry,
  DiscoverItemType,
  PunkRecordsChapterDetails,
  PunkRecordsDiscoverItem,
  PunkRecordsDiscoverSection,
  PunkRecordsSectionId,
} from "./models";
import { toAbsoluteImage } from "./utils";

function decodeJsonText(value: string): string {
  return JSON.parse(`"${value}"`) as string;
}

function decodeHtml(value: string | undefined): string | undefined {
  if (!value) {
    return value;
  }

  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMatch(regex: RegExp, value: string): RegExpExecArray | undefined {
  return regex.exec(value) ?? undefined;
}

export function extractMetaContent(
  html: string,
  attribute: "name" | "property",
  key: string,
): string | undefined {
  const escapedKey = escapeRegex(key);
  const regex = new RegExp(`<meta[^>]+${attribute}="${escapedKey}"[^>]+content="([^"]+)"`, "i");
  return decodeHtml(extractMatch(regex, html)?.[1]);
}

export function extractTagContent(html: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`, "i");
  return decodeHtml(extractMatch(regex, html)?.[1]);
}

export function extractLatestUpdatedMangaIds(html: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const regex = /href="\/mangas\/([^/"?#]+)\/[^"?#/]+"/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const mangaId = match[1];
    if (!mangaId || seen.has(mangaId)) {
      continue;
    }

    ids.push(mangaId);
    seen.add(mangaId);
  }

  return ids;
}

/**
 * Punk Records exposes chapter labels in French ("Chapitre 12") while chapter slugs
 * may still carry the numeric fallback. Prefer the title because it is what readers
 * see on the website, then fall back to the slug when the title changes shape.
 */
export function extractChapterNumber(chapterId: string, title: string): number {
  const titleMatch = /chapitre\s+([\d.]+)/i.exec(title);
  if (titleMatch?.[1]) {
    return Number(titleMatch[1]);
  }

  const chapterMatch = /([\d.]+)/.exec(chapterId);
  return chapterMatch?.[1] ? Number(chapterMatch[1]) : 0;
}

export function cleanTitle(title: string): string {
  return title
    .replace(/\s+\|\s+Punk Records.*$/i, "")
    .replace(/\s+-\s+Scan couleur$/i, "")
    .trim();
}

export function normalizeString(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function extractAuthorFromKeywords(html: string): string | undefined {
  const keywords = extractMetaContent(html, "name", "keywords");
  if (!keywords) {
    return undefined;
  }

  const candidates = keywords
    .split(",")
    .map((part) => part.trim())
    .filter((part) => /^[A-ZÀ-ÖØ-Þ][\p{L}.'-]+(?:\s+[A-ZÀ-ÖØ-Þ][\p{L}.'-]+)+$/u.test(part));

  return candidates.at(-1);
}

export class PunkRecordsParser {
  buildDiscoverSections(showCatalogueOnHome: boolean): PunkRecordsDiscoverSection[] {
    const sections: PunkRecordsDiscoverSection[] = [
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
  ): PunkRecordsDiscoverItem[] {
    if (sectionId === "latest") {
      const latestIds = extractLatestUpdatedMangaIds(homeHtml);
      return latestIds
        .map((mangaId) => catalogue.find((entry) => entry.mangaId === mangaId))
        .filter((entry): entry is CatalogueEntry => entry !== undefined)
        .map((entry) => this.toDiscoverItem(entry, "featuredCarouselItem"));
    }

    return catalogue.map((entry) => this.toDiscoverItem(entry, "simpleCarouselItem"));
  }

  buildSearchResults(catalogue: CatalogueEntry[], query: string): SearchResultItem[] {
    const search = normalizeString(query);
    return catalogue
      .filter((entry) => !search || normalizeString(entry.title).includes(search))
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
    fallbackThumbnailUrl: string,
  ): SourceManga {
    const primaryTitle = cleanTitle(
      extractTagContent(html, "title") ?? fallbackEntry?.title ?? mangaId,
    );
    const thumbnailUrl =
      extractMetaContent(html, "property", "og:image") ??
      fallbackEntry?.image ??
      fallbackThumbnailUrl;
    const synopsis =
      extractMetaContent(html, "name", "description") ?? "Aucune description disponible.";
    const creator = extractAuthorFromKeywords(html);

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
    const chapters: Chapter[] = [];
    const seen = new Set<string>();
    const regex = new RegExp(`href="/mangas/${sourceManga.mangaId}/([^"?#/]+)"[^>]*>([^<]+)<`, "g");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const chapterId = match[1]?.trim();
      const title = match[2]?.trim() ?? "";

      if (!chapterId || seen.has(chapterId)) {
        continue;
      }

      chapters.push({
        chapterId,
        sourceManga,
        langCode: "FR",
        chapNum: extractChapterNumber(chapterId, title),
        title: title || undefined,
      });
      seen.add(chapterId);
    }

    if (!chapters.length) {
      throw new Error(`Couldn't find any chapters for mangaId: ${sourceManga.mangaId}!`);
    }

    return chapters;
  }

  parseChapterDetails(html: string, chapter: Chapter): PunkRecordsChapterDetails {
    const regex =
      /<img[^>]+alt="[^"]*-page-[^"]*"[^>]+src="(https:\/\/api\.punkrecordz\.com\/images\/[^"]+)"/g;
    const pages: string[] = [];
    const seen = new Set<string>();
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      const page = match[1]?.trim();
      if (!page || seen.has(page)) {
        continue;
      }

      pages.push(page);
      seen.add(page);
    }

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

  private toDiscoverItem(entry: CatalogueEntry, type: DiscoverItemType): PunkRecordsDiscoverItem {
    return {
      type,
      mangaId: entry.mangaId,
      title: entry.title,
      imageUrl: entry.image,
      contentRating: ContentRating.EVERYONE,
    };
  }
}

/**
 * Catalogue cards are rendered from Next.js data rather than static markup. The
 * parser keeps a few increasingly loose passes so small payload-shape changes do
 * not make the whole source disappear from browse and search.
 */
export function parseCatalogue(html: string): CatalogueEntry[] {
  const normalizedHtml = html
    .replace(/\\"/g, '"')
    .replace(/\\\\u0026/g, "&")
    .replace(/\\u0026/g, "&");
  const entries: CatalogueEntry[] = [];
  const seen = new Set<string>();
  const objectRegex = /{[^{}]*"__typename":"Manga"[^{}]*}/g;
  let match: RegExpExecArray | null;
  const pushEntry = (
    rawTitle: string | undefined,
    mangaId: string | undefined,
    thumb: string | undefined,
    published: boolean,
  ): void => {
    if (!published || !rawTitle || !mangaId || !thumb || seen.has(mangaId)) {
      return;
    }

    entries.push({
      mangaId,
      title: decodeJsonText(rawTitle),
      image: toAbsoluteImage(thumb),
    });
    seen.add(mangaId);
  };

  while ((match = objectRegex.exec(normalizedHtml)) !== null) {
    const block = match[0];
    const rawTitle = /"name":"((?:\\.|[^"\\])*)"/.exec(block)?.[1];
    const mangaId = /"slug":"([^"]+)"/.exec(block)?.[1];
    const thumb = /"thumb":"([^"]+)"/.exec(block)?.[1];
    const published = /"published":(true|false)/.exec(block)?.[1] === "true";
    pushEntry(rawTitle, mangaId, thumb, published);
  }

  if (!entries.length) {
    const marker = '"__typename":"Manga"';
    const chunks = normalizedHtml.split(marker).slice(1);

    for (const chunk of chunks) {
      const block = `${marker}${chunk.slice(0, 400)}`;
      const rawTitle = /"name":"((?:\\.|[^"\\])*)"/.exec(block)?.[1];
      const mangaId = /"slug":"([^"]+)"/.exec(block)?.[1];
      const thumb = /"thumb":"([^"]+)"/.exec(block)?.[1];
      const publishedMatch = /"published":(true|false)/.exec(block)?.[1];
      const published = publishedMatch ? publishedMatch === "true" : true;

      pushEntry(rawTitle, mangaId, thumb, published);
    }
  }

  if (!entries.length) {
    const looseRegex =
      /"__typename":"Manga"[\s\S]{0,250}?"name":"((?:\\.|[^"\\])*)"[\s\S]{0,250}?"slug":"([^"]+)"[\s\S]{0,250}?"thumb":"([^"]+)"[\s\S]{0,120}?"published":(true|false)/g;

    while ((match = looseRegex.exec(normalizedHtml)) !== null) {
      const rawTitle = match[1];
      const mangaId = match[2];
      const thumb = match[3];
      const published = match[4] === "true";

      pushEntry(rawTitle, mangaId, thumb, published);
    }
  }

  if (!entries.length) {
    throw new Error("Couldn't parse the Punk Records catalogue.");
  }

  return entries;
}
