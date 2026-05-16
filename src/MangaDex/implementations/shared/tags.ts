/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { TagSection } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { RATINGS } from "./lookups";
import { buildTagListUrl } from "./urls";

const TAG_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// Open string type: a future MangaDex group is accepted and
// rendered generically instead of stranding the cache.
export type TagGroup = string;
export const KNOWN_TAG_GROUPS = ["format", "genre", "theme", "content", "content_rating"] as const;

export interface Tag {
  id: string;
  group: TagGroup;
  name: { en: string; [locale: string]: string };
}

export interface TagCache {
  tags: Tag[];
  fetchedAt: number;
}

interface RawTagListResponse {
  data: Array<{
    id: string;
    attributes: {
      group: TagGroup;
      name: { en: string; [locale: string]: string };
    };
  }>;
}

// Ordinal synthetic tags derived from RATINGS. Position is the tag id so
// content rating tags stay in Safe -> Mature order (preserved by getSearchTagSections).
const SYNTHETIC_RATING_TAGS: Tag[] = RATINGS.map((r, i) => ({
  id: String(i + 1),
  group: "content_rating",
  name: { en: r.shortName },
}));

export const CONTENT_RATING_GROUP = "content_rating";

// Maps synthetic tag id -> API enum value (NOT display label). Used to
// translate UI tag selections back into contentRating[] query params.
export const SYNTHETIC_RATING_ID_TO_NAME: Readonly<Record<string, string>> = Object.fromEntries(
  RATINGS.map((r, i) => [String(i + 1), r.enum]),
);

// Real /manga/tag responses have 60+ entries plus 4 synthetic
// ratings. Anything smaller is suspect, so refuse to save it.
const MIN_FETCHED_TAG_ENTRIES = 40;

let inFlightFetch: Promise<TagCache> | null = null;

// Shared cold start promise so concurrent ensureTags callers
// produce one fallback write and one retry timer update, not N.
let inFlightColdStart: Promise<TagCache> | null = null;

// Backoff for the synthetic only fallback (fetchedAt === 0). Stops
// a persistent outage from firing /manga/tag on every UI render.
const SYNTH_BACKOFF_START_MS = 60 * 1000;
const SYNTH_BACKOFF_MAX_MS = 60 * 60 * 1000;
let synthRetryAt = 0;
let synthBackoffMs = SYNTH_BACKOFF_START_MS;

export function getCachedTags(): TagCache | null {
  const raw = Application.getState("mangadex_tag_cache") as unknown;
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    !Array.isArray((raw as TagCache).tags) ||
    typeof (raw as TagCache).fetchedAt !== "number"
  ) {
    return null;
  }
  const cache = raw as TagCache;
  // Every legitimate cache holds at least the four synthetic
  // ratings, so empty means the persisted value got corrupted.
  if (cache.tags.length === 0) {
    return null;
  }
  // Reject the whole cache on any malformed tag. Empty strings
  // count as missing.
  for (const tag of cache.tags as unknown[]) {
    const typedTag = tag as { id?: unknown; group?: unknown; name?: { en?: unknown } };
    if (
      !typedTag ||
      typeof typedTag !== "object" ||
      typeof typedTag.id !== "string" ||
      typedTag.id === "" ||
      typeof typedTag.group !== "string" ||
      typedTag.group === "" ||
      !typedTag.name ||
      typeof typedTag.name !== "object" ||
      typeof (typedTag.name as { en?: unknown }).en !== "string" ||
      (typedTag.name as { en?: string }).en === ""
    ) {
      return null;
    }
  }
  return cache;
}

export function setCachedTags(cache: TagCache): void {
  Application.setState(cache, "mangadex_tag_cache");
}

// Drops the saved cache and resets the backoff so the next
// ensureTags call is a cold start. Used by "Reset to Defaults".
export function resetTagCache(): void {
  Application.setState(undefined, "mangadex_tag_cache");
  synthRetryAt = 0;
  synthBackoffMs = SYNTH_BACKOFF_START_MS;
}

export async function fetchTags(): Promise<TagCache> {
  // /manga/tag rejects extra query params strictly. Adding limit
  // here would strand the extension on the synthetic fallback.
  const response = await fetchJSON<RawTagListResponse>({
    url: buildTagListUrl(),
    method: "GET",
  });
  const apiTags: Tag[] = response.data.map((entry) => ({
    id: entry.id,
    group: entry.attributes.group,
    name: entry.attributes.name,
  }));
  const cache: TagCache = {
    tags: [...SYNTHETIC_RATING_TAGS, ...apiTags],
    fetchedAt: Date.now(),
  };
  // A nearly empty 200 would otherwise be cached for 30 days. Throw
  // so the synthetic fallback runs and the retry timer applies.
  if (cache.tags.length < MIN_FETCHED_TAG_ENTRIES) {
    throw new Error(
      `MangaDex /manga/tag returned only ${apiTags.length} tags (need >= ${MIN_FETCHED_TAG_ENTRIES - SYNTHETIC_RATING_TAGS.length})`,
    );
  }
  setCachedTags(cache);
  return cache;
}

// Returns the in flight fetch, or starts one. Background callers
// swallow errors. Manual callers surface them to the UI.
function startFetch(): Promise<TagCache> {
  if (inFlightFetch !== null) return inFlightFetch;
  const promise = fetchTags();
  inFlightFetch = promise;
  // finally() returns a new promise that rejects when fetchTags() rejects,
  // so catch it too. Callers still see the original rejection via `promise`.
  promise
    .finally(() => {
      if (inFlightFetch === promise) inFlightFetch = null;
    })
    .catch(() => {});
  return promise;
}

export async function ensureTags(): Promise<TagCache> {
  const cache = getCachedTags();
  if (!cache) {
    // Cold start. All concurrent callers share the same promise so
    // a failed fetch produces one fallback write, not N.
    if (inFlightColdStart === null) {
      inFlightColdStart = startFetch()
        .catch((err): TagCache => {
          console.log(`[MangaDex] Tag fetch failed, using synthetic fallback: ${String(err)}`);
          const fallback: TagCache = { tags: [...SYNTHETIC_RATING_TAGS], fetchedAt: 0 };
          setCachedTags(fallback);
          synthRetryAt = Date.now() + synthBackoffMs;
          return fallback;
        })
        .finally(() => {
          // Clear so a later cold start can reenter this branch.
          inFlightColdStart = null;
        });
    }
    return inFlightColdStart;
  }
  if (cache.fetchedAt === 0) {
    // Synthetic only fallback. Retry on backoff. A successful
    // refresh replaces the cache and we leave this branch.
    if (Date.now() >= synthRetryAt) {
      synthRetryAt = Date.now() + synthBackoffMs;
      synthBackoffMs = Math.min(synthBackoffMs * 2, SYNTH_BACKOFF_MAX_MS);
      startFetch().then(
        () => {
          synthBackoffMs = SYNTH_BACKOFF_START_MS;
          synthRetryAt = 0;
        },
        (err: unknown) => {
          console.log(`[MangaDex] Synthetic fallback tag refresh failed: ${String(err)}`);
        },
      );
    }
    return cache;
  }
  if (Date.now() - cache.fetchedAt >= TAG_CACHE_MAX_AGE_MS) {
    // Stale: serve cached, refresh in background. Errors keep stale.
    startFetch().catch((err) => {
      console.log(`[MangaDex] Background tag refresh failed, keeping stale cache: ${String(err)}`);
    });
  }
  return cache;
}

// Manual refresh joins an in flight fetch or starts one. Bypasses
// freshness checks and errors propagate.
export function forceRefreshTags(): Promise<TagCache> {
  return startFetch();
}

// "content_rating" -> "Content rating", "genre" -> "Genre".
export const formatTagGroupName = (group: string): string =>
  group.charAt(0).toUpperCase() + group.slice(1).replace(/_/g, " ");

export async function getSearchTagSections(enabledRatings?: string[]): Promise<TagSection[]> {
  const cache = await ensureTags();
  const sections = new Map<string, TagSection>();
  for (const tag of cache.tags) {
    let section = sections.get(tag.group);
    if (!section) {
      section = { id: tag.group, title: formatTagGroupName(tag.group), tags: [] };
      sections.set(tag.group, section);
    }
    const blocked =
      tag.group === "content_rating" &&
      enabledRatings !== undefined &&
      !enabledRatings.includes(SYNTHETIC_RATING_ID_TO_NAME[tag.id] ?? "");
    section.tags?.push({
      id: tag.id,
      title: blocked ? `${tag.name.en} (Blocked in settings)` : tag.name.en,
    });
  }
  for (const section of sections.values()) {
    // Content rating is ordinal (Safe -> Pornographic), so preserve
    // the insertion order from SYNTHETIC_RATING_TAGS instead of sorting.
    if (section.id === CONTENT_RATING_GROUP) continue;
    section.tags?.sort((a, b) => a.title.localeCompare(b.title));
  }
  return Array.from(sections.values()).sort((a, b) => a.title.localeCompare(b.title));
}
