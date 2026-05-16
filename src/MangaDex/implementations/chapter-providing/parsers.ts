/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ChapterAttributes, ChapterData, ChapterRelationship } from "../shared/models";

// Skips malformed relationships and entries without a name.
export function extractScanlationGroupNames(chapter: ChapterData): string[] {
  return (
    chapter.relationships
      ?.filter((x: ChapterRelationship) => x?.type === "scanlation_group")
      .map((x: ChapterRelationship) => x.attributes?.name)
      .filter((n): n is string => !!n) ?? []
  );
}

export interface AssignedChapterNumber {
  chapNum: number;
  isUnnumbered: boolean;
}

// Oneshots come back as null or "". Number() = 0 would collapse extras to one dedup id.
export function assignChapterNumber(
  rawChap: string | null | undefined,
  prevChapNum: number,
): AssignedChapterNumber {
  const rawIsEmpty = rawChap === null || rawChap === undefined || rawChap === "";
  let chapNum = rawIsEmpty ? NaN : Number(rawChap);
  const isUnnumbered = isNaN(chapNum);
  if (isUnnumbered) {
    chapNum = prevChapNum - 0.001;
  }
  return { chapNum, isUnnumbered };
}

// Numbered: (volume, chapNum, lang). Unnumbered: title or unnumberedIndex (must keep growing).
export function buildChapterIdentifier(
  volume: number,
  chapNum: number,
  isUnnumbered: boolean,
  attributes: ChapterAttributes,
  unnumberedIndex: number,
): string {
  const translatedLanguage = attributes.translatedLanguage ?? "";
  if (!isUnnumbered) {
    return `${volume}-${chapNum}-${translatedLanguage}`;
  }
  const rawTitle = attributes.title?.trim() ?? "";
  const key = rawTitle.toLowerCase() || `idx${unnumberedIndex}`;
  return `${volume}-unn-${key}-${translatedLanguage}`;
}

// Number(undefined) is NaN and Number("Infinity") is Infinity. Both
// would slip through a bare pages > 0 guard.
export function normalizePagesCount(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
