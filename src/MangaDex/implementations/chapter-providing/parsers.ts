/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ChapterData, ChapterRelationship } from "../shared/models";

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
    chapNum = prevChapNum > 0 ? prevChapNum - 0.001 : 0;
  }
  return { chapNum, isUnnumbered };
}

// Numbered: (chapNum, lang). Unnumbered: resolved name or unnumberedIndex (must keep growing).
// Volume is normally left out so the same chapter from different groups dedups even when
// they tag volumes differently. It is added back only when the title restarts numbering
// each volume, otherwise Vol. 1 Ch. 1 and Vol. 2 Ch. 1 would wrongly collapse to one.
export function buildChapterIdentifier(
  chapNum: number,
  isUnnumbered: boolean,
  name: string,
  translatedLanguage: string,
  unnumberedIndex: number,
  volume: number,
  resetNumbersOnVolume: boolean,
): string {
  if (!isUnnumbered) {
    return resetNumbersOnVolume
      ? `${volume}-${chapNum}-${translatedLanguage}`
      : `${chapNum}-${translatedLanguage}`;
  }
  const key = name.trim().toLowerCase() || `idx${unnumberedIndex}`;
  return `unn-${key}-${translatedLanguage}`;
}

// Number(undefined) is NaN and Number("Infinity") is Infinity. Both
// would slip through a bare pages > 0 guard.
export function normalizePagesCount(raw: unknown): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
