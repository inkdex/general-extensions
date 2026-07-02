/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type FeaturedCarouselItem,
  type SourceManga,
  type TagSection,
} from "@paperback/types";
import { type CheerioAPI } from "cheerio";

import {
  DOMAIN,
  type MangaListItem,
  type PageResponse,
  type SearchDetails,
  type SearchOption,
} from "./models";

const parseDropdownOptions = (
  $: CheerioAPI,
  selector: string,
  requireId: boolean = true,
): SearchOption[] => {
  const options: SearchOption[] = [];
  $(selector).each((_, element) => {
    const id = $(element).find("input").attr("value") ?? "";
    const label = $(element).find("label").text().trim();
    if (label && (!requireId || id)) {
      options.push({ id, label });
    }
  });
  return options;
};

export const parseSearchDetails = ($: CheerioAPI): SearchDetails => {
  return {
    types: parseDropdownOptions(
      $,
      ".dropdown:has(button .value[data-placeholder='Type']) .dropdown-menu.noclose.c1 li",
      false,
    ),
    genres: parseDropdownOptions($, ".genres li"),
    status: parseDropdownOptions(
      $,
      ".dropdown:has(button .value[data-placeholder='Status']) .dropdown-menu.noclose.c1 li",
    ),
    languages: parseDropdownOptions(
      $,
      ".dropdown:has(button .value[data-placeholder='Language']) .dropdown-menu.noclose.c1 li",
    ),
    years: parseDropdownOptions(
      $,
      ".dropdown:has(button .value[data-placeholder='Year']) .dropdown-menu.noclose.md.c3 li",
    ),
    lengths: parseDropdownOptions(
      $,
      ".dropdown:has(button .value[data-placeholder='Length']) .dropdown-menu.noclose.c1 li",
    ),
    sorts: parseDropdownOptions(
      $,
      ".dropdown:has(button .value[data-placeholder='Sort by']) .dropdown-menu.noclose.c1 li",
    ),
  };
};

const stripOrigin = (href: string): string => href.replace(/^https?:\/\/[^/]+/, "");

export const parseMangaList = (
  $: CheerioAPI,
  languages: string[],
  selector = ".unit .inner",
): MangaListItem[] => {
  const items: MangaListItem[] = [];

  $(selector).each((_, element) => {
    const unit = $(element);
    const infoLink = unit.find(".info > a").last();
    const title = infoLink.text().trim();
    const mangaId = infoLink.attr("href")?.replace("/manga/", "") ?? "";
    if (!title || !mangaId) return;

    // Chapter rows are per-language (marked by a <b> tag) and the first row isn't
    // necessarily in a selected language.
    const chapterLinks = unit.find(".content[data-name='chap'] a");
    const preferred = chapterLinks
      .filter((_, el) => languages.includes($(el).find("b").text().trim().toLowerCase()))
      .first();
    const chapterLink = preferred.length ? preferred : chapterLinks.first();
    const chapterMatch = chapterLink.text().match(/Chap (\d+)/);

    items.push({
      mangaId,
      title,
      imageUrl: unit.find(".poster img").attr("src") ?? "",
      subtitle: chapterMatch ? `Ch. ${chapterMatch[1]}` : undefined,
      chapterId: stripOrigin(chapterLink.attr("href") ?? ""),
      contentRating: ContentRating.EVERYONE, // Site does not provide content rating
    });
  });

  return items;
};

export const parseTrendingSection = ($: CheerioAPI): FeaturedCarouselItem[] => {
  const items: FeaturedCarouselItem[] = [];

  $(".swiper.trending .swiper-slide").each((_, element) => {
    const slide = $(element);
    const infoLink = slide.find(".info .above a.unit");
    const title = infoLink.text().trim();
    const mangaId = infoLink.attr("href")?.replace("/manga/", "") ?? "";
    if (!title || !mangaId) return;

    const status = slide.find(".info .above span").text().trim();
    const chapterMatch = slide
      .find(".info .below p")
      .text()
      .match(/Chap (\d+(?:\.\d+)?)/);
    const genres = slide
      .find(".info .below div a")
      .toArray()
      .map((el) => $(el).text().trim());

    const infoItems = [
      ...(chapterMatch ? [{ symbol: "book.fill", text: `Ch. ${chapterMatch[1]}` }] : []),
      ...(status ? [{ symbol: "clock.fill", text: status }] : []),
    ];

    items.push({
      type: "featuredCarouselItem",
      mangaId,
      title,
      imageUrl: slide.find(".poster img").attr("src") ?? "",
      supertitle: genres.join(" • "),
      summary: slide.find(".info .below span").text().trim(),
      infoItems: infoItems.length ? (infoItems as FeaturedCarouselItem["infoItems"]) : undefined,
      contentRating: ContentRating.EVERYONE,
    });
  });

  return items;
};

export const hasNextPage = ($: CheerioAPI): boolean =>
  !!$(".page-item.active + .page-item .page-link").length;

export const parseMangaDetails = (
  $: CheerioAPI,
  mangaId: string,
  searchDetails: SearchDetails,
): SourceManga => {
  const description =
    $("#synopsis .modal-content").text().trim() ||
    $(".manga-detail .info .description").text().trim();

  const authors: string[] = [];
  const genres: string[] = [];
  $("#info-rating .meta div").each((_, element) => {
    const label = $(element).find("span").first().text().trim();
    const values = $(element)
      .find("a")
      .toArray()
      .map((el) => $(el).text().trim());
    if (label === "Author:") authors.push(...values);
    if (label === "Genres:") genres.push(...values);
  });

  const genreIdByLabel = new Map(
    searchDetails.genres.map((genre) => [genre.label.toLowerCase(), genre.id]),
  );
  const tagGroups: TagSection[] = genres.length
    ? [
        {
          id: "genres",
          title: "Genres",
          tags: genres.map((genre) => ({
            id: genreIdByLabel.get(genre.toLowerCase()) ?? genre,
            title: genre,
          })),
        },
      ]
    : [];

  return {
    mangaId,
    mangaInfo: {
      primaryTitle: $(".manga-detail .info h1").text().trim(),
      secondaryTitles: [$(".manga-detail .info h6").text().trim()].filter(Boolean),
      thumbnailUrl: $(".manga-detail .poster img").attr("src") ?? "",
      synopsis: description,
      author: authors.join(", ") || undefined,
      rating: parseFloat($("#info-rating .score .live-score").text()) / 10 || 0,
      contentRating: ContentRating.EVERYONE, // Site does not provide content rating
      status: $(".manga-detail .info p").last().text().trim() || "Unknown",
      tagGroups,
      shareUrl: `${DOMAIN}/manga/${mangaId}`,
    },
  };
};

export const parseChapters = (
  $: CheerioAPI,
  sourceManga: SourceManga,
  langCode: string,
): Chapter[] => {
  const chapters: Chapter[] = [];

  $("li").each((_, el) => {
    const li = $(el);
    const chapterNumber = li.attr("data-number");
    if (!chapterNumber) return;

    const link = li.find("a");
    const href = link.attr("href");
    if (!href) return;

    const title =
      link.find("span").first().text().trim().split(`${chapterNumber}:`)[1]?.trim() || undefined;

    chapters.push({
      chapterId: stripOrigin(href),
      title,
      sourceManga,
      chapNum: parseFloat(chapterNumber),
      publishDate: parseChapterDate(li.find("span").last().text().trim()),
      volume: 0, // Site does not provide volume information
      langCode,
    });
  });

  return chapters;
};

export const parseChapterDetails = (json: PageResponse, chapter: Chapter): ChapterDetails => ({
  mangaId: chapter.sourceManga.mangaId,
  id: chapter.chapterId,
  pages: json.result.images.map((image) => image[0]),
});

const UNIT_MS = { second: 1000, minute: 60_000, hour: 3_600_000, day: 86_400_000 };

function parseChapterDate(dateText: string): Date {
  const now = new Date();
  if (!dateText) return now;

  if (/^yesterday$/i.test(dateText)) return new Date(now.getTime() - UNIT_MS.day);

  const relative = dateText.match(/(\d+)\s+(second|minute|hour|day)s?\s+ago/i);
  if (relative) {
    const unit = relative[2].toLowerCase() as keyof typeof UNIT_MS;
    return new Date(now.getTime() - parseInt(relative[1], 10) * UNIT_MS[unit]);
  }

  const parsed = new Date(dateText);
  return isNaN(parsed.getTime()) ? now : parsed;
}

export function parseJson<T>(raw: string, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Failed to parse ${context}`, { cause: error });
  }
}
