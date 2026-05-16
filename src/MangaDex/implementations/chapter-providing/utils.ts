/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import type { PrecomputedQuery } from "../shared/utils";
import { relevanceScore } from "../shared/utils";

// Inverse of the Paperback enum. Fallback for entries saved before
// we started storing the raw MangaDex rating.
export const PAPERBACK_TO_MANGADEX_RATINGS: Record<ContentRating, string[]> = {
  [ContentRating.EVERYONE]: ["safe"],
  [ContentRating.MATURE]: ["suggestive"],
  [ContentRating.ADULT]: ["erotica", "pornographic"],
};

// Prefers the raw rating. The Paperback enum lumps erotica and
// pornographic into ADULT and would miss a flip between them.
export function isRatingAllowed(
  storedMdRating: string | undefined,
  mangaPbRating: ContentRating,
  enabledRatings: readonly string[],
): boolean {
  if (storedMdRating) return enabledRatings.includes(storedMdRating);
  return (PAPERBACK_TO_MANGADEX_RATINGS[mangaPbRating] ?? []).some((r) =>
    enabledRatings.includes(r),
  );
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

// MangaDex's publishAtSince wants "YYYY-MM-DDTHH:MM:SS" (no ms,
// no TZ). Returns undefined so the URL builder skips the param.
export function formatPublishAtSince(date: Date | undefined): string | undefined {
  if (!(date instanceof Date) || isNaN(date.getTime())) return undefined;
  return date.toISOString().replace(/\.\d{3}Z$/, "");
}

// threshold=1 means "any > 0". threshold>1 means "percentage >= threshold".
export function shouldSkipByCount(
  threshold: number,
  count: number | undefined,
  total: number | undefined,
): boolean {
  if (threshold <= 0 || count === undefined || !total) return false;
  if (threshold === 1) return count > 0;
  return (count / total) * 100 >= threshold;
}
