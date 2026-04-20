/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Chapter, ChapterDetails, SourceManga } from "@paperback/types";
import type { QIScansSeriesChapter, QIScansSeriesChapterDetailsResponse } from "../shared/models";

export function parseChapterList(
  chapters: QIScansSeriesChapter[],
  sourceManga: SourceManga,
): Chapter[] {
  if (chapters.length === 0) {
    return [];
  }

  const sorted = [...chapters].sort((a, b) => {
    if (a.number !== b.number) return a.number - b.number;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const available = sorted.filter(
    (chapter) => chapter.publishStatus === "PUBLIC" && !chapter.requiresPurchase,
  );

  return available.map((chapter, index) => ({
    chapterId: chapter.slug,
    sourceManga,
    title: chapter.title?.trim() || "",
    chapNum: chapter.number,
    volume: 0,
    volumetitle: "",
    langCode: "en",
    sortingIndex: index,
    publishDate: new Date(chapter.createdAt),
  }));
}

export function parseChapterDetails(
  data: QIScansSeriesChapterDetailsResponse,
  chapter: Chapter,
): ChapterDetails {
  const pages = [...(data.images ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((image) => image.url)
    .filter((url) => url.length > 0);

  if (pages.length === 0) {
    throw new Error("No chapter page data could be parsed from QiScans for this chapter.");
  }

  return {
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    pages,
  };
}
