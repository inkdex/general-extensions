/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { fetchJSON } from "../../services/network";
import { buildUserListsUrl } from "./urls";

// The MangaDex admin user owns all the homepage curated lists.
const MANGADEX_ADMIN_USER_ID = "d2ae45e0-b5e2-4e7f-a688-17925c2d7d6b";

const CURATED_LISTS_CACHE_KEY = "mangadex_curated_lists_cache";
const CURATED_LISTS_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const USER_LISTS_FETCH_LIMIT = 100;

// Fallback IDs if discovery fails and no cache exists
const FALLBACK_SEASONAL_ID = "68ab4f4e-6f01-4898-9038-c5eee066be27";
const FALLBACK_RECOMMENDED_ID = "805ba886-dd99-4aa4-b460-4bd7c7b71352";
const FALLBACK_SELF_PUBLISHED_ID = "f66ebc10-ef89-46d1-be96-bb704559e04a";

export interface CuratedListIds {
  seasonal: string;
  recommended: string;
  selfPublished: string;
}

interface CuratedListCache {
  ids: Partial<CuratedListIds>;
  fetchedAt: number;
}

interface UserListsResponse {
  data: Array<{
    id: string;
    attributes: {
      name: string;
      visibility: string;
    };
    relationships: Array<{ id: string; type: string }>;
  }>;
}

// Anime season convention: Winter Jan-Mar, Spring Apr-Jun,
// Summer Jul-Sep, Fall Oct-Dec.
const SEASON_TO_INDEX = { winter: 0, spring: 1, summer: 2, fall: 3 } as const;
type SeasonName = keyof typeof SEASON_TO_INDEX;

// Trailing \b so "Seasonal: Spring 2026 Extra" still parses as
// Spring 2026 rather than being skipped.
const SEASONAL_RE = /^Seasonal:\s+(Winter|Spring|Summer|Fall)\s+(\d{4})\b/i;

interface ParsedSeason {
  season: SeasonName;
  year: number;
}

function parseSeasonalName(name: string): ParsedSeason | null {
  const m = name.match(SEASONAL_RE);
  if (!m) return null;
  return { season: m[1].toLowerCase() as SeasonName, year: parseInt(m[2], 10) };
}

// The season currently underway. Stops us from switching to
// "Summer 2026" the moment its list appears in late spring.
function getCurrentSeason(now: Date): ParsedSeason {
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  if (month <= 3) return { season: "winter", year };
  if (month <= 6) return { season: "spring", year };
  if (month <= 9) return { season: "summer", year };
  return { season: "fall", year };
}

function scoreSeason(season: ParsedSeason): number {
  return season.year * 4 + SEASON_TO_INDEX[season.season];
}

// Strip spaces, hyphens, and underscores so "Self-Published",
// "Self Published", and "self_published" all match.
function normalizeListName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[-_\s]+/g, "");
}

// Seasonal picks the latest list whose season has already started.
// Manga count breaks ties between same season duplicates.
function discoverFromResponse(response: UserListsResponse): Partial<CuratedListIds> {
  const currentScore = scoreSeason(getCurrentSeason(new Date()));
  let recommended: string | undefined;
  let selfPublished: string | undefined;
  let seasonal: { id: string; score: number; count: number } | undefined;

  for (const entry of response.data ?? []) {
    if (entry?.attributes?.visibility !== "public") continue;
    const name = entry.attributes.name ?? "";
    if (!name) continue;
    const count = Array.isArray(entry.relationships)
      ? entry.relationships.filter((r) => r?.type === "manga").length
      : 0;
    if (count === 0) continue;

    const normalized = normalizeListName(name);
    if (!recommended && normalized === "recommended") {
      recommended = entry.id;
      continue;
    }
    if (!selfPublished && normalized === "selfpublished") {
      selfPublished = entry.id;
      continue;
    }
    const parsed = parseSeasonalName(name);
    if (!parsed) continue;
    const score = scoreSeason(parsed);
    if (score > currentScore) continue;
    if (
      !seasonal ||
      score > seasonal.score ||
      (score === seasonal.score && count > seasonal.count)
    ) {
      seasonal = { id: entry.id, score, count };
    }
  }

  return { seasonal: seasonal?.id, recommended, selfPublished };
}

function isOptionalNonEmptyString(v: unknown): boolean {
  return v === undefined || (typeof v === "string" && v.length > 0);
}

function isCuratedListCache(value: unknown): value is CuratedListCache {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const c = value as Record<string, unknown>;
  if (typeof c.fetchedAt !== "number") return false;
  if (!c.ids || typeof c.ids !== "object" || Array.isArray(c.ids)) return false;
  const ids = c.ids as Record<string, unknown>;
  return (
    isOptionalNonEmptyString(ids.seasonal) &&
    isOptionalNonEmptyString(ids.recommended) &&
    isOptionalNonEmptyString(ids.selfPublished)
  );
}

function readCache(): CuratedListCache | null {
  const raw = Application.getState(CURATED_LISTS_CACHE_KEY) as unknown;
  return isCuratedListCache(raw) ? raw : null;
}

function writeCache(ids: Partial<CuratedListIds>): void {
  Application.setState({ ids, fetchedAt: Date.now() } as CuratedListCache, CURATED_LISTS_CACHE_KEY);
}

function withFallbacks(ids: Partial<CuratedListIds>): CuratedListIds {
  return {
    seasonal: ids.seasonal ?? FALLBACK_SEASONAL_ID,
    recommended: ids.recommended ?? FALLBACK_RECOMMENDED_ID,
    selfPublished: ids.selfPublished ?? FALLBACK_SELF_PUBLISHED_ID,
  };
}

function hasAnyMatch(ids: Partial<CuratedListIds>): boolean {
  return (
    ids.seasonal !== undefined || ids.recommended !== undefined || ids.selfPublished !== undefined
  );
}

let inFlightFetch: Promise<Partial<CuratedListIds>> | null = null;

async function fetchAndDiscover(): Promise<Partial<CuratedListIds>> {
  const response = await fetchJSON<UserListsResponse>({
    url: buildUserListsUrl(MANGADEX_ADMIN_USER_ID, USER_LISTS_FETCH_LIMIT).toString(),
    method: "GET",
  });
  const ids = discoverFromResponse(response);
  // Skip caching a fully empty result
  if (hasAnyMatch(ids)) {
    writeCache(ids);
  } else {
    // Make a silent fall through to hardcoded IDs observable
    console.log("[MangaDex] Curated list discovery matched zero lists, using hardcoded fallbacks");
  }
  return ids;
}

function startFetch(): Promise<Partial<CuratedListIds>> {
  if (inFlightFetch !== null) return inFlightFetch;
  const promise = fetchAndDiscover();
  inFlightFetch = promise;
  // .catch suppresses the unhandled rejection on the cleanup chain
  promise
    .finally(() => {
      if (inFlightFetch === promise) inFlightFetch = null;
    })
    .catch(() => {});
  return promise;
}

// Resolves curated list IDs
export async function ensureCuratedListIds(): Promise<CuratedListIds> {
  const cache = readCache();
  if (cache === null) {
    try {
      const refreshed = await startFetch();
      return withFallbacks(refreshed);
    } catch {
      return withFallbacks({});
    }
  }
  if (Date.now() - cache.fetchedAt >= CURATED_LISTS_CACHE_MAX_AGE_MS) {
    // Serve stale, refresh in background. A failed refresh keeps the cache.
    startFetch().catch(() => {});
  }
  return withFallbacks(cache.ids);
}
