/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type SourceManga,
  type Tag,
} from "@paperback/types";
import { type CheerioAPI } from "cheerio";
import { decodeHTML } from "entities";

import { getAuthorNoteSettings } from "./forms";
import {
  fixVoidElements,
  getShareUrl,
  mapStatus,
  toChapterId,
  toMangaId,
  formatImageUrl,
} from "./helpers";
import { DEFAULT_LANGUAGE_CODE, type FictionEntry } from "./models";

// Shared parser for the `div.fiction-list-item` cards used across every
// discovery listing and the search results page.
export const parseFictionEntries = ($: CheerioAPI): FictionEntry[] => {
  const entries: FictionEntry[] = [];
  for (const item of $("div.fiction-list-item").toArray()) {
    const link = $("h2.fiction-title a", item).first();
    const stats = $("div.stats", item).first();
    const href = link.attr("href") ?? "";
    if (!href) continue;
    entries.push({
      mangaId: toMangaId(href),
      title: decodeHTML(link.text().trim()),
      imageUrl: formatImageUrl($("figure img", item).first().attr("src") ?? ""),
      description:
        decodeHTML(
          $(`div#description-${toMangaId(href).split("/")[0]}`, item)
            .text()
            .trim(),
        ) ?? "",
      stats: {
        followers: decodeHTML(stats.find("i.fa-users").siblings().text().trim()) ?? "",
        views: decodeHTML(stats.find("i.fa-eye").siblings().text().trim()) ?? "",
        rating: stats.find("i.fa-star").siblings().attr("title") ?? "",
        chapters: decodeHTML(stats.find("i.fa-list").siblings().text().trim()) ?? "",
      },
    });
  }
  return entries;
};

// Royal Road paginates with a Bootstrap pager; the "next" arrow is disabled on
// the final page.
export const isLastListingPage = ($: CheerioAPI): boolean => {
  const next = $("ul.pagination");
  if (next.length === 0) {
    return true;
  }
  return false;
};

export const parseMangaDetails = ($: CheerioAPI, mangaId: string): SourceManga => {
  const title = decodeHTML(
    $("div.fic-title h1").first().text().trim() || $("h1").first().text().trim(),
  );
  const image = formatImageUrl($("div.cover-art-container img").first().attr("src") ?? "");
  const author = decodeHTML($("h4 a").first().text().trim());
  const synopsis = decodeHTML($("div.description").first().text().trim());

  const genres: Tag[] = [];
  for (const genreObj of $("a.fiction-tag").toArray()) {
    const genre = $(genreObj).text().trim();
    if (!genre) continue;
    genres.push({ id: genre.toLowerCase().replaceAll(" ", "-"), title: genre });
  }

  let status = "Unknown";
  for (const labelObj of $("span.label.label-default.label-sm").toArray()) {
    const mapped = mapStatus($(labelObj).text());
    if (mapped !== "Unknown") {
      status = mapped;
      break;
    }
  }

  const contentRating = () => {
    const rating = $(".fiction-info .text-center").text().trim();
    if (rating.includes("Sexual Content")) return ContentRating.ADULT;
    else if (rating.includes("Graphic Violence") || rating.includes("Sensitive Content"))
      return ContentRating.MATURE;
    else return ContentRating.EVERYONE;
  };

  return {
    mangaId: mangaId,
    mangaInfo: {
      primaryTitle: title,
      secondaryTitles: [],
      contentType: "novel",
      status: status,
      author: author,
      tagGroups: [{ id: "genres", title: "Genres", tags: genres }],
      synopsis: synopsis,
      thumbnailUrl: image,
      contentRating: contentRating(),
      shareUrl: getShareUrl(mangaId),
    },
  };
};

export const parseChapters = ($: CheerioAPI, sourceManga: SourceManga): Chapter[] => {
  const chapters: Chapter[] = [];
  const rows = $("table#chapters tbody tr").toArray();

  rows.forEach((row, index) => {
    const link = $("td a", row).first();
    const href = link.attr("href") ?? "";
    if (!href) return;

    const datetime = $("td time", row).first().attr("datetime") ?? "";
    const publishDate = datetime ? new Date(datetime) : new Date();

    chapters.push({
      chapterId: toChapterId(href),
      title: decodeHTML(link.text().trim()),
      chapNum: index + 1,
      publishDate,
      langCode: DEFAULT_LANGUAGE_CODE,
      volume: 0,
      sourceManga,
    });
  });

  if (chapters.length === 0) {
    throw new Error(`Couldn't find any chapters for mangaId: ${sourceManga.mangaId}`);
  }
  return chapters;
};

export const parseChapterDetails = (
  $: CheerioAPI,
  mangaId: string,
  chapterId: string,
): ChapterDetails => {
  const content = $("div.chapter-content").html()?.replaceAll("&nbsp;", " ") ?? "";

  const authorNote = $("div.author-note").html()?.replaceAll("&nbsp;", " ") ?? "";
  const authorNoteTitle = $("div.author-note-portlet .portlet-title").first().text().trim();

  // Readium parses the chapter as XHTML, so unclosed void tags like <br> must be
  // normalised into their self-closing form first.
  let body: string;
  if (getAuthorNoteSettings() && authorNote) {
    body = fixVoidElements(authorNoteTitle + "\n" + authorNote + "\n <hr />" + content);
  } else {
    body = fixVoidElements(content);
  }
  const html = `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${body}</body></html>`;

  return {
    id: chapterId,
    mangaId: mangaId,
    type: "html",
    html,
  };
};
