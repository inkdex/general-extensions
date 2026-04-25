/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Chapter, SourceManga } from "@paperback/types";

import type { AtsuChaptersResponse } from "../shared/models";

export function parseChapterList(
  json: AtsuChaptersResponse,
  sourceManga: SourceManga,
  scanlatorMap: Map<string, string>,
): Chapter[] {
  const maxIndex = json.chapters.length - 1;
  return json.chapters.map((ch, index) => {
    const groupName = ch.scanlationMangaId
      ? (scanlatorMap.get(ch.scanlationMangaId) ?? "No Group")
      : "No Group";

    const title = ch.title.replace(/^((Chapter|Episode|Ch\.?)\s*[\d.]+|#\s*[\d.]+)\s*/i, "").trim();

    return {
      chapterId: ch.id,
      sourceManga,
      title,
      chapNum: ch.number,
      volume: 0,
      langCode: "en",
      version: groupName,
      sortingIndex: maxIndex - index,
      publishDate: new Date(ch.createdAt),
    };
  });
}
