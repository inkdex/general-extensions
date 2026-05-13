/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type ChapterUpdatesCarouselItem,
  type FeaturedCarouselItem,
  type SearchResultItem,
  type SimpleCarouselItem,
  type SourceManga,
  type TagSection,
} from "@paperback/types";
import { type CheerioAPI } from "cheerio";

import { DOMAIN, type PageResponse, type SearchDetails, type SearchOption } from "./models";

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

export const parseSearch = ($: CheerioAPI): SearchResultItem[] => {
  const searchResults: SearchResultItem[] = [];

  $(".original.card-lg .unit .inner").each((_, element) => {
    const unit = $(element);
    const infoLink = unit.find(".info > a");
    const title = infoLink.text().trim();
    const image = unit.find("img").attr("src") || "";
    const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";
    const latestChapter = unit
      .find(".content[data-name='chap'] a")
      .first()
      .find("span")
      .first()
      .text()
      .trim();
    const latestChapterMatch = latestChapter.match(/Chap (\d+)/);
    const subtitle = latestChapterMatch ? `Ch. ${latestChapterMatch[1]}` : undefined;

    if (!title || !mangaId) {
      return;
    }

    searchResults.push({
      mangaId,
      imageUrl: image,
      title,
      subtitle,
      contentRating: ContentRating.EVERYONE,
    });
  });

  return searchResults;
};

export const hasNextPage = ($: CheerioAPI): boolean => {
  return !!$(".page-item.active + .page-item .page-link").length;
};

export const parseMangaDetails = (
  $: CheerioAPI,
  mangaId: string,
  searchDetails?: SearchDetails,
): SourceManga => {
  const title = $(".manga-detail .info h1").text().trim();
  const altTitles = [$(".manga-detail .info h6").text().trim()].filter((t) => t);
  const image = $(".manga-detail .poster img").attr("src") || "";
  const description =
    $("#synopsis .modal-content").text().trim() ||
    $(".manga-detail .info .description").text().trim();
  const authors: string[] = [];
  $("#info-rating .meta div").each((_, element) => {
    const label = $(element).find("span").first().text().trim();
    if (label === "Author:") {
      $(element)
        .find("a")
        .each((_, authorElement) => {
          authors.push($(authorElement).text().trim());
        });
    }
  });
  const status = $(".manga-detail .info p").last().text().trim() || "Unknown";

  const tags: TagSection[] = [];
  const genres: string[] = [];
  let rating = 0;

  $("#info-rating .meta div").each((_, element) => {
    const label = $(element).find("span").first().text().trim();
    if (label === "Genres:") {
      $(element)
        .find("a")
        .each((_, genreElement) => {
          genres.push($(genreElement).text().trim());
        });
    }
  });

  const ratingValue = $("#info-rating .score .live-score").text().trim();
  if (ratingValue) {
    rating = parseFloat(ratingValue) / 10;
  }

  if (genres.length > 0) {
    const genreIdByLabel = new Map(
      (searchDetails?.genres ?? []).map((genre) => [genre.label.toLowerCase(), genre.id]),
    );
    tags.push({
      id: "genres",
      title: "Genres",
      tags: genres.map((genre) => ({
        id: genreIdByLabel.get(genre.toLowerCase()) ?? genre,
        title: genre,
      })),
    });
  }

  return {
    mangaId: mangaId,
    mangaInfo: {
      primaryTitle: title,
      secondaryTitles: altTitles,
      thumbnailUrl: image,
      synopsis: description,
      rating: rating,
      contentRating: ContentRating.EVERYONE,
      status: status,
      tagGroups: tags,
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

    const chapterUrlPath = href.startsWith("http") ? href.replace(/^https?:\/\/[^/]+/, "") : href;

    const dateText = li.find("span").last().text().trim();
    const title =
      link.find("span").first().text().trim().split(`${chapterNumber}:`)[1]?.trim() || undefined;

    chapters.push({
      chapterId: chapterUrlPath,
      title: title,
      sourceManga,
      chapNum: parseFloat(chapterNumber ?? "0"),
      publishDate: new Date(convertToISO8601(dateText)),
      volume: 0,
      langCode,
    });
  });
  return chapters;
};

export const parseChapterDetails = (json: PageResponse, chapter: Chapter): ChapterDetails => {
  const pages = json.result.images.map((value) => value[0]);
  return {
    mangaId: chapter.sourceManga.mangaId,
    id: chapter.chapterId,
    pages: pages,
  };
};

export const parseUpdatedSection = ($: CheerioAPI): ChapterUpdatesCarouselItem[] => {
  const items: ChapterUpdatesCarouselItem[] = [];

  $(".unit .inner").each((_, element) => {
    const unit = $(element);
    const infoLink = unit.find(".info > a").last();
    const title = infoLink.text().trim();
    const image = unit.find(".poster img").attr("src") || "";
    const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";
    const latestChapter = unit.find(".content[data-name='chap']").find("a").eq(0).text().trim();
    const latestChapterMatch = latestChapter.match(/Chap (\d+)/);
    const subtitle = latestChapterMatch ? `Ch. ${latestChapterMatch[1]}` : undefined;

    const chapterLink = unit.find(".content[data-name='chap'] a").first();
    const chapterHref = chapterLink.attr("href") || "";
    const chapterId = chapterHref.startsWith("http")
      ? chapterHref.replace(/^https?:\/\/[^/]+/, "")
      : chapterHref;

    if (title && mangaId) {
      items.push({
        type: "chapterUpdatesCarouselItem",
        mangaId: mangaId,
        chapterId: chapterId,
        imageUrl: image,
        title: title,
        subtitle: subtitle,
        contentRating: ContentRating.EVERYONE,
      });
    }
  });

  return items;
};

export const parsePopularSection = ($: CheerioAPI): FeaturedCarouselItem[] => {
  const items: FeaturedCarouselItem[] = [];

  $(".unit .inner").each((_, element) => {
    const unit = $(element);
    const infoLink = unit.find(".info > a").last();
    const title = infoLink.text().trim();
    const image = unit.find(".poster img").attr("src") || "";
    const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";

    const latestChapter = unit
      .find(".content[data-name='chap'] a")
      .filter((_, el) => $(el).find("b").text() === "EN")
      .first()
      .find("span")
      .first()
      .text()
      .trim();

    const chapterMatch = latestChapter.match(/Chap (\d+)/);
    const supertitle = chapterMatch ? `Ch. ${chapterMatch[1]}` : "";

    if (title && mangaId) {
      items.push({
        type: "featuredCarouselItem",
        mangaId: mangaId,
        imageUrl: image,
        title: title,
        supertitle: supertitle,
        contentRating: ContentRating.EVERYONE,
      });
    }
  });

  return items;
};

export const popularHasNextPage = ($: CheerioAPI): boolean => {
  return !!$(".hpage .r").length;
};

export const parseNewMangaSection = ($: CheerioAPI): SimpleCarouselItem[] => {
  const items: SimpleCarouselItem[] = [];

  $(".unit .inner").each((_, element) => {
    const unit = $(element);
    const infoLink = unit.find(".info > a").last();
    const title = infoLink.text().trim();
    const image = unit.find(".poster img").attr("src") || "";
    const mangaId = infoLink.attr("href")?.replace("/manga/", "") || "";

    const latestChapter = unit
      .find(".content[data-name='chap'] a")
      .first()
      .find("span")
      .first()
      .text()
      .trim();
    const latestChapterMatch = latestChapter.match(/Chap (\d+)/);
    const subtitle = latestChapterMatch ? `Ch. ${latestChapterMatch[1]}` : undefined;

    if (title && mangaId) {
      items.push({
        mangaId,
        imageUrl: image,
        title: title,
        subtitle: subtitle,
        contentRating: ContentRating.EVERYONE,
        type: "simpleCarouselItem",
      });
    }
  });

  return items;
};

function convertToISO8601(dateText: string): string {
  const now = new Date();

  if (!dateText?.trim()) return now.toISOString();

  if (/^yesterday$/i.test(dateText)) {
    now.setDate(now.getDate() - 1);
    return now.toISOString();
  }

  const relativeMatch = dateText.match(/(\d+)\s+(second|minute|hour|day)s?\s+ago/i);
  if (relativeMatch) {
    const [_, value, unit] = relativeMatch;
    const parsedValue = parseInt(value, 10);
    switch (unit.toLowerCase()) {
      case "second":
        now.setSeconds(now.getSeconds() - parsedValue);
        break;
      case "minute":
        now.setMinutes(now.getMinutes() - parsedValue);
        break;
      case "hour":
        now.setHours(now.getHours() - parsedValue);
        break;
      case "day":
        now.setDate(now.getDate() - parsedValue);
        break;
    }
    return now.toISOString();
  }

  const parsedDate = new Date(dateText);
  return isNaN(parsedDate.getTime()) ? now.toISOString() : parsedDate.toISOString();
}
