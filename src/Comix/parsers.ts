/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type SourceManga,
  type Tag,
} from "@paperback/types";
import * as cheerio from "cheerio";

import {
  DOMAIN,
  NO_IMAGE,
  type ApiResponse,
  type ChapterItem,
  type ChapterPages,
  type MangaItem,
  type MangaListItem,
  type ResultManga,
} from "./models";

// Comix server-renders page state into
// `<script type="application/json" id="initial-data">` as a React-Query cache:
// `{ page, queries: { '["manga","detail","{hid}"]': <payload>, ... } }`. Detail
// pages embed the manga here because the JSON API itself is now 403.
//
// The `["manga","detail","{hid}"]` query value is the Manga object directly
// (unwrapped); guard for a future `{ result }` wrapper too, keying off `hid`.
function extractDetailManga(html: string): MangaItem | undefined {
  const $ = cheerio.load(html);
  // Script content is raw text (htmlparser2 does not entity-decode rawtext nodes),
  // so `.text()` returns the JSON verbatim.
  const raw = $("script#initial-data").text();
  if (!raw) return undefined;
  let queries: Record<string, unknown> | undefined;
  try {
    queries = (JSON.parse(raw) as { queries?: Record<string, unknown> }).queries;
  } catch {
    return undefined;
  }
  if (!queries) return undefined;
  const key = Object.keys(queries).find((k) => k.includes('"detail"'));
  if (key === undefined) return undefined;
  const value = queries[key] as MangaItem & { result?: MangaItem };
  const manga = value?.result ?? value;
  return manga?.hid !== undefined ? manga : undefined;
}

export const parseMangaList = (result: ResultManga): MangaListItem[] =>
  result.items.map((item) => ({
    mangaId: item.hid,
    title: item.title,
    imageUrl: getPoster(item),
    subtitle: `Chapter ${item.latestChapter || item.finalChapter}`,
    contentRating: toContentRating(item.contentRating),
    publishDate: parseRelativeDate(item.chapterUpdatedAtFormatted),
    supertitle: [item.type.toUpperCase(), item.year].filter(Boolean).join(" · "),
    summary: item.synopsis,
    infoItems: [
      { symbol: "star.fill", text: item.ratedAvg.toFixed(1) },
      { symbol: "heart.fill", text: formatCount(item.followsTotal) },
    ],
  }));

const formatCount = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString();

export function parseMangaDetails(mangaId: string, html: string): SourceManga {
  const manga = extractDetailManga(html);
  if (!manga) {
    throw new Error(`Comix: could not find detail data for ${mangaId}`);
  }
  const toTags = (items: { id: number; title: string }[]): Tag[] =>
    items.map((item) => ({ id: item.id.toString(), title: item.title }));
  return {
    mangaId,
    mangaInfo: {
      thumbnailUrl: getPoster(manga),
      bannerUrl: getPoster(manga),
      synopsis: manga.synopsis,
      primaryTitle: manga.title,
      secondaryTitles: manga.altTitles,
      contentRating: toContentRating(manga.contentRating),
      status: manga.status,
      artist: manga.artists?.map((artist) => artist.title).join(" ") ?? "",
      author: manga.authors?.map((author) => author.title).join(" ") ?? "",
      rating: manga.ratedAvg / 10,
      tagGroups: [
        { id: "demographic", title: "demographic", tags: toTags(manga.demographics) },
        { id: "genres", title: "genres", tags: toTags(manga.genres) },
      ],
      shareUrl: `${DOMAIN}${manga.url}`,
    },
  };
}

export const parseChapters = (sourceManga: SourceManga, items: ChapterItem[]): Chapter[] =>
  items.map((chapter) => ({
    chapterId: chapter.id.toString(),
    sourceManga,
    langCode: chapter.language,
    chapNum: chapter.number,
    title: chapter.name,
    volume: chapter.volume,
    version: chapter.isOfficial
      ? (chapter.group?.name ?? "Official")
      : (chapter.group?.name ?? "Unknown"),
    sortingIndex: chapter.number,
    publishDate: parseRelativeDate(chapter.createdAtFormatted),
    additionalInfo: { vote: chapter.votes.toString(), url: chapter.url },
  }));

export function parseChapterDetails(
  chapterId: string,
  pages: ApiResponse<ChapterPages>,
): ChapterDetails {
  const { baseUrl, items } = pages.result.pages;
  const base = baseUrl.replace(/\/$/, "");
  return {
    id: chapterId,
    mangaId: pages.result.mangaId.toString(),
    pages: items.map((img) =>
      img.url.startsWith("http") ? img.url : `${base}/${img.url.replace(/^\//, "")}`,
    ),
  };
}

function toContentRating(content: string): ContentRating {
  switch (content) {
    case "suggestive":
      return ContentRating.MATURE;
    case "erotica":
    case "pornographic":
      return ContentRating.ADULT;
    default:
      return ContentRating.EVERYONE;
  }
}

function parseRelativeDate(value: string): Date {
  const now = new Date();
  const match = value.match(/^(\d+)\s*(mo|yr|[smhdwy])s?(\s+ago)?$/i);
  if (!match) {
    return now;
  }
  const amount = Number(match[1]);
  switch (match[2].toLowerCase()) {
    case "s":
      now.setSeconds(now.getSeconds() - amount);
      break;
    case "m":
      now.setMinutes(now.getMinutes() - amount);
      break;
    case "h":
      now.setHours(now.getHours() - amount);
      break;
    case "d":
      now.setDate(now.getDate() - amount);
      break;
    case "w":
      now.setDate(now.getDate() - amount * 7);
      break;
    case "mo":
      now.setMonth(now.getMonth() - amount);
      break;
    case "yr":
    case "y":
      now.setFullYear(now.getFullYear() - amount);
      break;
  }
  return now;
}

function getPoster(item: MangaItem): string {
  return item.poster?.large || item.poster?.medium || NO_IMAGE;
}
