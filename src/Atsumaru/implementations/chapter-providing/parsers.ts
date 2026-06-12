/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Chapter, SourceManga } from "@paperback/types";

import type { AtsuChaptersResponse } from "../shared/models";

export function parseChapterList(
  data: AtsuChaptersResponse,
  sourceManga: SourceManga,
  scanlatorMap: Map<string, string>,
): Chapter[] {
  const sorted = data.chapters
    .map((chapter) => {
      const groupName = chapter.scanlationMangaId
        ? (scanlatorMap.get(chapter.scanlationMangaId) ?? "No Group")
        : "No Group";

      return { chapter, groupName };
    })
    .sort((a, b) => {
      if (a.chapter.number !== b.chapter.number) {
        return b.chapter.number - a.chapter.number;
      }

      return a.groupName.localeCompare(b.groupName);
    });

  return sorted.map(({ chapter: ch, groupName }, index) => {
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
      sortingIndex: sorted.length - index,
      publishDate: new Date(ch.createdAt),
    };
  });
}
