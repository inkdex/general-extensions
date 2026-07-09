/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type SearchResultItem,
  type SourceManga,
  type TagSection,
} from "@paperback/types";

import {
  ADULT_GENRES,
  DOMAIN,
  MATURE_GENRES,
  STATUS_MAP,
  type ChapterItem,
  type TitleDetails,
  type TitleItem,
} from "./models";

export type MangaListItem = SearchResultItem & { updatedAt?: string; rank?: number };

export const parseMangaList = (items: TitleItem[]): MangaListItem[] =>
  items.map((item) => ({
    mangaId: item.hid,
    title: item.title,
    imageUrl: posterUrl(item),
    subtitle: item.latestChapter ? `Ch. ${item.latestChapter}` : undefined,
    updatedAt: item.chapterUpdatedAt,
    rank: item.rank,
    contentRating: ContentRating.EVERYONE, // List items do not include genres
  }));

const posterUrl = (item: TitleItem): string =>
  item.poster?.large ??
  item.poster?.medium ??
  item.poster?.small ??
  "https://placehold.co/300x420/14161c/6b7080/png/?text=No+Poster";

export const parseMangaDetails = (details: TitleDetails, mangaId: string): SourceManga => {
  const genres = details.genres ?? [];
  const tagGroups: TagSection[] = [
    { key: "genres", items: genres },
    { key: "themes", items: details.themes ?? [] },
  ]
    .filter(({ items }) => items.length > 0)
    .map(({ key, items }) => ({
      id: key,
      title: key[0].toUpperCase() + key.slice(1),
      tags: items.map((tag) => ({ id: tag.id.toString(), title: tag.title })),
    }));

  const contentRating = genres.some((genre) => ADULT_GENRES.has(genre.title))
    ? ContentRating.ADULT
    : genres.some((genre) => MATURE_GENRES.has(genre.title))
      ? ContentRating.MATURE
      : ContentRating.EVERYONE;

  return {
    mangaId,
    mangaInfo: {
      primaryTitle: details.title,
      secondaryTitles: details.altTitles ?? [],
      thumbnailUrl: posterUrl(details),
      synopsis: details.synopsisHtml ? stripHtml(details.synopsisHtml) : "",
      author: details.authors?.map((author) => author.title).join(", ") || undefined,
      artist: details.artists?.map((artist) => artist.title).join(", ") || undefined,
      rating: details.rating ? details.rating / 10 : 0,
      contentRating,
      status: STATUS_MAP[details.status ?? ""] ?? "Unknown",
      tagGroups,
      shareUrl: `${DOMAIN}/title/${mangaId}`,
    },
  };
};

export const parseChapters = (
  items: ChapterItem[],
  sourceManga: SourceManga,
  langCode: string,
): Chapter[] =>
  items.map((item) => ({
    chapterId: item.id.toString(),
    title: item.name || undefined,
    sourceManga,
    chapNum: item.number,
    publishDate: item.createdAt ? new Date(item.createdAt * 1000) : undefined,
    volume: 0, // Site does not provide volume information
    langCode,
  }));

const stripHtml = (html: string): string =>
  Application.decodeHTMLEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .trim(),
  );

// The manga ID is the title's "hid". Legacy IDs were "slug.hid", so take the part after the dot.
export const parseHid = (mangaId: string): string => {
  return mangaId.split(".").pop() ?? mangaId;
};
