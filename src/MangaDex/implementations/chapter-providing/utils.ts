/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ContentRating } from "@paperback/types";

import { paperbackToMangaDexRatings } from "../shared/parsers";
import type { PrecomputedQuery } from "../shared/utils";
import { relevanceScore } from "../shared/utils";

// Prefers the raw MangaDex rating. Paperback's enum lumps erotica and
// pornographic together as ADULT, so it would miss a switch between the two.
export function isRatingAllowed(
  storedMdRating: string | undefined,
  mangaPbRating: ContentRating,
  enabledRatings: readonly string[],
): boolean {
  if (storedMdRating) return enabledRatings.includes(storedMdRating);
  return (paperbackToMangaDexRatings[mangaPbRating] ?? []).some((r) => enabledRatings.includes(r));
}

// Cache shared across chapter rows so a repeated group name skips tokenizing
// and scoring again. The caller skips this entirely when there are no queries.
export function isGroupNameBlocked(
  name: string,
  blockedGroupQueries: PrecomputedQuery[],
  groupBlockCache: Map<string, boolean>,
): boolean {
  const cached = groupBlockCache.get(name);
  if (cached !== undefined) return cached;
  const blocked = blockedGroupQueries.some((q) => relevanceScore(name, q) >= 70);
  groupBlockCache.set(name, blocked);
  return blocked;
}
