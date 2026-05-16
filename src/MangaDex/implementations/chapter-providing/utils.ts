/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { paperbackToMangaDexRatings } from "../shared/parsers";
import type { PrecomputedQuery } from "../shared/utils";
import { relevanceScore } from "../shared/utils";

// Prefers the raw rating. The Paperback enum lumps erotica and
// pornographic into ADULT and would miss a flip between them.
export function isRatingAllowed(
  storedMdRating: string | undefined,
  mangaPbRating: ContentRating,
  enabledRatings: readonly string[],
): boolean {
  if (storedMdRating) return enabledRatings.includes(storedMdRating);
  return (paperbackToMangaDexRatings[mangaPbRating] ?? []).some((r) => enabledRatings.includes(r));
}

// Cache shared across chapter rows so repeat group names skip the
// retokenize and rescore. Caller short circuits on empty queries.
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
