/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  URL,
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type FeaturedCarouselItem,
  type MangaInfo,
  type SearchResultItem,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import { type CheerioAPI } from "cheerio";

import { DOMAIN, type ComicCard, type SectionType } from "./models";

const formatCount = (raw: string): string => {
  const n = parseInt(raw.replace(/,/g, ""), 10);
  if (isNaN(n)) return raw;
  if (n < 1_000) return n.toString();
  if (n < 1_000_000) return `${+(n / 1_000).toFixed(1)}K`;
  return `${+(n / 1_000_000).toFixed(1)}M`;
};

export const parseMangaDetails = (
  $: CheerioAPI,
  mangaId: string,
  sourceUrl: string,
): SourceManga => {
  const primaryTitle = Application.decodeHTMLEntities($(".novel-title").text().trim());

  const secondaryTitles: string[] = [];
  secondaryTitles.push(
    Application.decodeHTMLEntities($("img", "div.fixed-img").attr("alt")?.trim() ?? ""),
  );
  const altTitles = $("h2.alternative-title.text1row", "div.main-head").text().trim().split(",");
  for (const title of altTitles) {
    secondaryTitles.push(Application.decodeHTMLEntities(title));
  }

  const thumbnailUrl = $("img", "div.fixed-img").attr("data-src") ?? "";
  const author = $("span", "div.author").next().text().trim();

  const description = Application.decodeHTMLEntities($(".description").first().text().trim()).split(
    "The Summary is",
  );
  const synopsis = description[1] ? description[1] : description.join("");

  const arrayTags: Tag[] = [];
  for (const tag of $("li", "div.categories").toArray()) {
    const title = $(tag).text().trim();
    const id = title.replaceAll(" ", "_");

    if (!id || !title) continue;
    arrayTags.push({ id: id, title: title });
  }
  const tagGroups: TagSection[] = [{ id: "0", title: "genres", tags: arrayTags }];

  const rawRating = parseFloat($(".rating-star strong").contents().first().text().trim());
  const rating = isNaN(rawRating) ? undefined : rawRating / 5;

  const rawStatus = $("small:contains(Status)", "div.header-stats").prev().text().trim();
  let status = "ONGOING";
  switch (rawStatus.toUpperCase()) {
    case "ONGOING":
      status = "Ongoing";
      break;
    case "COMPLETED":
      status = "Completed";
      break;
    default:
      status = "Ongoing";
      break;
  }

  return {
    mangaId,
    mangaInfo: {
      thumbnailUrl,
      synopsis,
      primaryTitle,
      secondaryTitles,
      contentRating: ContentRating.EVERYONE,
      rating,
      status,
      author,
      tagGroups,
      shareUrl: new URL(sourceUrl).addPathComponent("manga").addPathComponent(mangaId).toString(),
    } as MangaInfo,
  } as SourceManga;
};

export const parseChapters = ($: CheerioAPI, sourceManga: SourceManga): Chapter[] => {
  const chapters: Chapter[] = [];
  let sortingIndex = chapters.length - 1;

  for (const chapter of $("li", "ul.chapter-list").toArray()) {
    let title = Application.decodeHTMLEntities($("strong.chapter-title", chapter).text().trim());
    const chapterId: string =
      $("a", chapter).attr("href")?.replace(/\/$/, "").split("/").pop() ?? "";
    if (!chapterId) continue;

    const normalizedDateTime = ($("time.chapter-update", chapter).attr("datetime") ?? "")
      .replace(/\bp\.m\.?/i, "PM")
      .replace(/\ba\.m\.?/i, "AM");
    const publishDate = new Date(normalizedDateTime);
    const chapNumRegex = /(\d+)(?:[-.]\d+)?/.exec(title);

    let chapNum = 0;
    if (chapNumRegex?.[0]) {
      let chapRegex = chapNumRegex[0];
      if (chapRegex.includes("-")) chapRegex = chapRegex.replace("-", ".");
      chapNum = Number(chapRegex);
    }

    // Display original title if chapNum parsing fails
    title = isNaN(chapNum) ? title : "";

    chapters.push({
      chapterId,
      sourceManga,
      langCode: "en",
      chapNum,
      title,
      volume: 0,
      publishDate,
      sortingIndex,
    });
    sortingIndex--;
  }

  if (chapters.length == 0) {
    throw new Error(`Couldn't find any chapters for mangaId: ${sourceManga.mangaId}!`);
  }

  return chapters;
};

export const parseChapterDetails = ($: CheerioAPI, chapter: Chapter): ChapterDetails => {
  const pages: string[] = [];
  for (const img of $(".page-in img[onerror]").toArray()) {
    let image = $(img).attr("src") ?? "";
    if (!image) image = $(img).attr("data-src") ?? "";
    if (!image) continue;
    if (image.includes("credits-mgeko.png")) continue;
    pages.push(image);
  }

  return {
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    pages,
  };
};

const parseViewMore = ($: CheerioAPI): ComicCard[] => {
  const cards: ComicCard[] = [];

  for (const obj of $("article.comic-card").toArray()) {
    let imageUrl =
      $("img", obj).first().attr("data-src") ?? $("img", obj).first().attr("src") ?? "";
    if (imageUrl.startsWith("/")) imageUrl = DOMAIN + imageUrl;

    const title = Application.decodeHTMLEntities($("img", obj).first().attr("alt") ?? "");
    const mangaId = $("a", obj).attr("href")?.replace(/\/$/, "").split("/").pop() ?? "";
    const rating = $(".comic-card__stat--rating", obj)
      .text()
      .trim()
      .replace(/[⭐★]/g, "")
      .trim();
    const views =
      $(".comic-card__stat--hot span", obj)
        .map((_, el) => $(el).text().trim())
        .toArray()
        .find((t) => t) ?? "";
    const badge = $(".comic-card__badge", obj).first().text().trim();

    cards.push({ mangaId, title, imageUrl, rating, views, badge });
  }

  return cards;
};

const buildStatSubtitle = (rating: string, views: string): string =>
  [rating ? `★ ${rating}` : "", views ? `▲ ${formatCount(views)}` : ""].filter(Boolean).join(" · ");

export const parseSectionItem = (
  $: CheerioAPI,
  sectionType: SectionType,
): DiscoverSectionItem[] => {
  const seen = new Set<string>();

  return parseViewMore($)
    .filter(({ mangaId, title }) => {
      if (!mangaId || !title || seen.has(mangaId)) return false;
      seen.add(mangaId);
      return true;
    })
    .map(({ mangaId, title, imageUrl, rating, views, badge }) => {
      if (sectionType === "featuredCarouselItem") {
        const infoItems: NonNullable<FeaturedCarouselItem["infoItems"]>[number][] = [];
        if (rating) infoItems.push({ symbol: "star.fill", text: rating });
        if (views) infoItems.push({ symbol: "flame.fill", text: formatCount(views) });
        return {
          type: sectionType,
          mangaId,
          title,
          imageUrl,
          contentRating: ContentRating.EVERYONE,
          supertitle: badge || undefined,
          infoItems: infoItems.length
            ? (infoItems as FeaturedCarouselItem["infoItems"])
            : undefined,
        };
      }

      return {
        type: sectionType,
        mangaId,
        title,
        imageUrl,
        contentRating: ContentRating.EVERYONE,
        subtitle: buildStatSubtitle(rating, views),
      };
    });
};

export const parseGenreTags = ($: CheerioAPI): TagSection[] => {
  const arrayTags: Tag[] = [];
  for (const tag of $("button.chip[data-group='include_genres']").toArray()) {
    const title = $(tag).attr("data-value") ?? "";

    if (!title) continue;
    arrayTags.push({ id: title.replaceAll(" ", "_"), title: title });
  }

  const statusTags: Tag[] = [];
  for (const option of $("select#bf-status option").toArray()) {
    const value = $(option).attr("value") ?? "";
    const title = $(option).text().trim();
    if (!value) continue;
    statusTags.push({ id: value, title: title });
  }

  const typeTags: Tag[] = [];
  for (const option of $("select#bf-type option").toArray()) {
    const value = $(option).attr("value") ?? "";
    const title = $(option).text().trim();
    if (!value) continue;
    typeTags.push({ id: value, title: title });
  }

  return [
    { id: "genres", title: "Genres", tags: arrayTags },
    { id: "status", title: "Status", tags: statusTags },
    { id: "type", title: "Type", tags: typeTags },
  ];
};

export const parseOldSearch = ($: CheerioAPI, baseUrl: string): SearchResultItem[] => {
  const mangas: SearchResultItem[] = [];
  for (const obj of $("li.novel-item", "ul.novel-list").toArray()) {
    let imageUrl =
      $("img", obj).first().attr("data-src") ?? $("img", obj).first().attr("src") ?? "";
    if (imageUrl.startsWith("/")) imageUrl = baseUrl + imageUrl;

    const title = Application.decodeHTMLEntities($("img", obj).first().attr("alt") ?? "");
    const mangaId = $("a", obj).attr("href")?.replace(/\/$/, "").split("/").pop() ?? "";
    const getChapter = $("div.novel-stats > strong", obj).text().trim();
    const chapNumRegex = /(\d+)(?:[-.]\d+)?/.exec(getChapter);

    let chapNum = 0;
    if (chapNumRegex?.[1]) {
      let chapRegex = chapNumRegex[1];
      if (chapRegex.includes("-")) chapRegex = chapRegex.replace("-", ".");
      chapNum = Number(chapRegex);
    }
    const subtitle = chapNum ? `Chapter ${chapNum.toString()}` : "Chapter N/A";

    if (!mangaId || !title) continue;

    mangas.push({
      mangaId,
      title,
      imageUrl,
      subtitle,
      contentRating: ContentRating.EVERYONE,
    });
  }
  return mangas;
};

export const parseSearch = ($: CheerioAPI): SearchResultItem[] => {
  return parseViewMore($)
    .filter(({ mangaId, title }) => mangaId && title)
    .map(({ mangaId, title, imageUrl, rating, views }) => ({
      mangaId,
      title,
      imageUrl,
      subtitle: buildStatSubtitle(rating, views),
      contentRating: ContentRating.EVERYONE,
    }));
};
