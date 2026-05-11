/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Chapter, SourceManga } from "@paperback/types";

import type { AtsuChaptersResponse } from "../shared/models";

export function parseChapterList(
  data: AtsuChaptersResponse,
  sourceManga: SourceManga,
  scanlatorMap: Map<string, string>,
): Chapter[] {
  return data.chapters.map((ch) => {
    const groupName = ch.scanlationMangaId
      ? (scanlatorMap.get(ch.scanlationMangaId) ?? "No Group")
      : "No Group";

    const title = ch.title
      .replace(/^((Chapter|Episode|Ch\.?)\s*[\d.]+|#\s*[\d.]+)\s*(\bS\d+\b)?\s*[-:]?\s*/i, "")
      .trim();
    const volume = Number(ch.title.match(/\bS(\d+)\b/i)?.[1] ?? 0);

    return {
      chapterId: ch.id,
      sourceManga,
      title,
      chapNum: ch.number,
      volume,
      langCode: "en",
      version: groupName,
      sortingIndex: ch.index,
      publishDate: new Date(ch.createdAt),
    };
  });
}
