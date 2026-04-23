/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  DiscoverSectionType,
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchResultItem,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import type {
  ChapterContentResponse,
  ChapterEntry,
  LatestChapterEntry,
  PopularItem,
  SearchResultEntry,
} from "./models";
import { fixImageUrl } from "./utils";

export function parsePopularItems(
  jsonStr: string,
  sectionType: DiscoverSectionType,
): PagedResults<DiscoverSectionItem> {
  const data = JSON.parse(jsonStr) as PopularItem[];
  const items: DiscoverSectionItem[] = [];

  const itemType: "prominentCarouselItem" | "simpleCarouselItem" =
    sectionType === DiscoverSectionType.prominentCarousel
      ? "prominentCarouselItem"
      : "simpleCarouselItem";

  for (const manga of data) {
    const mangaId = extractMangaSlug(manga.permalink);
    if (mangaId && manga.title) {
      items.push({
        mangaId,
        title: manga.title,
        imageUrl: fixImageUrl(manga.cover),
        type: itemType,
      });
    }
  }

  return { items, metadata: undefined };
}

export function parseLatestUpdates(
  jsonStr: string,
  page: number,
): PagedResults<DiscoverSectionItem> {
  const response = JSON.parse(jsonStr) as { success: boolean; data: LatestChapterEntry[] };

  if (!response.success || !response.data) {
    return { items: [] };
  }

  const items: DiscoverSectionItem[] = [];

  for (const entry of response.data) {
    const mangaId = extractMangaSlug(entry.manga_permalink);
    const latestChapter = entry.last_3_chapters[0];
    const chapterId = latestChapter ? extractChapterId(latestChapter.link) : "";

    if (mangaId && entry.title && chapterId) {
      items.push({
        mangaId,
        title: entry.title,
        chapterId,
        subtitle: entry.chapter || undefined,
        imageUrl: fixImageUrl(entry.cover),
        type: "chapterUpdatesCarouselItem",
      });
    }
  }

  return {
    items,
    metadata: items.length > 0 && page < 10 ? page + 1 : undefined,
  };
}

export function parseHighscoreItems(jsonStr: string): PagedResults<DiscoverSectionItem> {
  const data = JSON.parse(jsonStr) as PopularItem[];
  const items: DiscoverSectionItem[] = [];

  for (const manga of data) {
    const mangaId = extractMangaSlug(manga.permalink);
    if (mangaId && manga.title) {
      items.push({
        mangaId,
        title: manga.title,
        imageUrl: fixImageUrl(manga.cover),
        type: "simpleCarouselItem",
      });
    }
  }

  return { items, metadata: undefined };
}

export function parseSearchResults(jsonStr: string): PagedResults<SearchResultItem> {
  const data = JSON.parse(jsonStr) as SearchResultEntry[];
  const items: SearchResultItem[] = [];

  for (const entry of data) {
    const mangaId = entry.slug || extractMangaSlug(entry.permalink);
    if (mangaId && entry.title) {
      items.push({
        mangaId,
        title: entry.title,
        subtitle: entry.type || undefined,
        imageUrl: fixImageUrl(entry.thumbnail),
      });
    }
  }

  return { items };
}

export function parseMangaDetails(html: string, mangaId: string): SourceManga {
  const $ = cheerio.load(html);

  const title = $("h1").first().text().trim() || mangaId;

  // Extract cover image from JSON-LD or img tag
  let imageUrl = "";
  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      const ld = JSON.parse($(el).html() ?? "") as { "@type"?: string; image?: string };
      if (ld["@type"] === "ComicSeries" && ld.image) {
        imageUrl = ld.image;
      }
    } catch {
      /* skip */
    }
  });
  if (!imageUrl) {
    imageUrl = $('img[alt^="Cover for"]').first().attr("src") ?? "";
  }

  // Extract author from JSON-LD
  let author = "";
  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      const ld = JSON.parse($(el).html() ?? "") as {
        "@type"?: string;
        author?: { name?: string };
      };
      if (ld["@type"] === "ComicSeries" && ld.author?.name) {
        author = ld.author.name;
      }
    } catch {
      /* skip */
    }
  });

  // Extract description
  let description = "No description available.";
  const descEl = $("#description-content-tab");
  if (descEl.length > 0) {
    const paragraphs: string[] = [];
    descEl.find("p").each((_i, p) => {
      const text = $(p).text().trim();
      if (text.length > 0) paragraphs.push(text);
    });
    if (paragraphs.length > 0) {
      description = paragraphs.join("\n");
    } else {
      const text = descEl.text().trim();
      if (text.length > 0) description = text;
    }
  }

  // Extract status from JSON-LD
  let status: "ONGOING" | "COMPLETED" | "UNKNOWN" = "UNKNOWN";
  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      const ld = JSON.parse($(el).html() ?? "") as { "@type"?: string; status?: string };
      if (ld["@type"] === "ComicSeries" && ld.status) {
        const s = ld.status.toLowerCase();
        if (s.includes("ongoing")) status = "ONGOING";
        else if (s.includes("completed") || s.includes("complete")) status = "COMPLETED";
      }
    } catch {
      /* skip */
    }
  });

  // Extract tags
  const tags: Tag[] = [];
  $('a[href*="/tag/"]').each((_i, el) => {
    const tagText = $(el).text().trim();
    if (tagText && tagText.length < 30) {
      tags.push({
        id: tagText.toLowerCase().replace(/\s+/g, "-"),
        title: tagText,
      });
    }
  });

  const tagSections: TagSection[] = [];
  if (tags.length > 0) {
    tagSections.push({ id: "genres", title: "Genres", tags });
  }

  return {
    mangaId,
    mangaInfo: {
      primaryTitle: title,
      secondaryTitles: [],
      thumbnailUrl: fixImageUrl(imageUrl),
      synopsis: description,
      author: author || undefined,
      contentRating: ContentRating.EVERYONE,
      status,
      tagGroups: tagSections,
    },
  };
}

export function extractMangaNumericId(html: string): string {
  const $ = cheerio.load(html);
  return $(".chapter-list[data-manga-id]").attr("data-manga-id") ?? "";
}

export function parseChapters(jsonStr: string, sourceManga: SourceManga): Chapter[] {
  const response = JSON.parse(jsonStr) as {
    success: boolean;
    chapters: ChapterEntry[];
    total: number;
    has_more: boolean;
  };

  if (!response.success || !response.chapters) {
    return [];
  }

  return response.chapters.map((entry) => ({
    chapterId: entry.id,
    sourceManga,
    langCode: entry.language?.toUpperCase() || "EN",
    chapNum: parseFloat(entry.chapter) || 0,
    title: entry.title && entry.title !== "N/A" ? entry.title.trim() : undefined,
    volume: undefined,
    publishDate: parseRelativeDate(entry.date),
  }));
}

export function parseChapterDetails(
  jsonStr: string,
  chapterId: string,
  mangaId: string,
): ChapterDetails {
  const response = JSON.parse(jsonStr) as ChapterContentResponse;

  if (!response.success || !response.images || response.images.length === 0) {
    throw new Error(`No images found for chapter ${chapterId}.`);
  }

  return {
    id: chapterId,
    mangaId,
    pages: response.images.map((url) => fixImageUrl(url)),
  };
}

function parseRelativeDate(dateText: string): Date {
  const now = new Date();
  const text = dateText.toLowerCase();

  if (text.includes("just now") || text.includes("now") || text.includes("second")) {
    return now;
  }

  const patterns: [RegExp, number][] = [
    [/(\d+)\s*min/, 60 * 1000],
    [/(\d+)\s*hour/, 60 * 60 * 1000],
    [/(\d+)\s*day/, 24 * 60 * 60 * 1000],
    [/(\d+)\s*week/, 7 * 24 * 60 * 60 * 1000],
    [/(\d+)\s*month/, 30 * 24 * 60 * 60 * 1000],
  ];

  for (const [regex, multiplier] of patterns) {
    const match = text.match(regex);
    if (match?.[1]) {
      return new Date(now.getTime() - parseInt(match[1]) * multiplier);
    }
  }

  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const dateMatch = text.match(/(\w+)\s+(\d+),\s+(\d+)/);
  if (dateMatch?.[1] && dateMatch[2] && dateMatch[3]) {
    const month = monthNames.findIndex((m) => dateMatch[1]!.startsWith(m));
    if (month !== -1) {
      return new Date(parseInt(dateMatch[3]), month, parseInt(dateMatch[2]));
    }
  }

  return now;
}

function extractMangaSlug(url: string): string {
  if (!url || !url.includes("/manga/")) return "";
  return url.split("/manga/")[1]?.replace(/\/$/, "") ?? "";
}

function extractChapterId(url: string): string {
  const match = url.match(/\/ch[\d.]+-(\d+)/);
  return match?.[1] ?? "";
}
