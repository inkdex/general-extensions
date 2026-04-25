/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ChapterUpdatesCarouselItem, SimpleCarouselItem } from "@paperback/types";
import { ContentRating } from "@paperback/types";

import type {
  MangaTaroFollowedMangaItem,
  MangaTaroPopularChapter,
  MangaTaroPopularMangaItem,
  MangaTaroStatusMangaItem,
} from "../shared/models";
import { formatMangaId, isNovel, slugFromUrl } from "../shared/utils";

export function parsePopularChapters(
  chapters: MangaTaroPopularChapter[],
): ChapterUpdatesCarouselItem[] {
  return chapters
    .filter((ch) => !isNovel(ch.manga_type))
    .map((ch) => ({
      type: "chapterUpdatesCarouselItem" as const,
      mangaId: formatMangaId(ch.manga_slug, ch.manga_id),
      chapterId: ch.chapter_id.toString(),
      imageUrl: ch.cover,
      title: ch.manga_title,
      subtitle: ch.chapter_title || `Ch. ${ch.chapter_number}`,
      contentRating: ContentRating.EVERYONE,
    }));
}

export function parseStatusManga(items: MangaTaroStatusMangaItem[]): SimpleCarouselItem[] {
  return items
    .filter((item) => !isNovel(item.manga_type))
    .map((item) => ({
      type: "simpleCarouselItem" as const,
      mangaId: formatMangaId(item.slug, item.manga_id),
      imageUrl: item.cover,
      title: item.title,
      subtitle: item.manga_type,
      contentRating: ContentRating.EVERYONE,
    }));
}

export function parseFollowedManga(items: MangaTaroFollowedMangaItem[]): SimpleCarouselItem[] {
  return items
    .filter((item) => !isNovel(item.manga_type))
    .map((item) => ({
      type: "simpleCarouselItem" as const,
      mangaId: formatMangaId(item.slug, item.manga_id),
      imageUrl: item.cover,
      title: item.title,
      subtitle: item.manga_type,
      contentRating: ContentRating.EVERYONE,
    }));
}

export function parsePopularManga(items: MangaTaroPopularMangaItem[]): SimpleCarouselItem[] {
  return items
    .filter((item) => !isNovel(item.manga_type))
    .map((item) => ({
      type: "simpleCarouselItem" as const,
      // no numeric id from this endpoint, slug only
      mangaId: slugFromUrl(item.permalink),
      imageUrl: item.cover,
      title: item.title,
      subtitle: item.manga_type,
      contentRating: ContentRating.EVERYONE,
    }));
}
