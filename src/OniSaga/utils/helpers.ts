/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { GENRES, GENRES_FETCHED_KEY, GENRES_KEY, GENRES_TTL, type Option } from "../models";

// iOS swaps straight quotes for curly ones; the site only matches the straight
// forms, so normalize before searching.
export function straightenQuotes(value: string): string {
  return value.replace(/[‘’‛]/g, "'").replace(/[“”]/g, '"');
}

// Slug from a /manga/<slug> href (absolute or relative).
export function mangaIdFromHref(href: string): string {
  const path = href.startsWith("http") ? href.replace(/^https?:\/\/[^/]+/, "") : href;
  const after = path.split("/manga/")[1] ?? "";
  return after.replace(/^\/+|\/+$/g, "");
}

// Root-relative path from a chapter href (used verbatim as the chapter id).
export function chapterIdFromHref(href: string): string {
  const path = href.startsWith("http") ? href.replace(/^https?:\/\/[^/]+/, "") : href;
  return path.startsWith("/") ? path : `/${path}`;
}

export function parseJson<T>(raw: string, context: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Failed to parse ${context}`, { cause: error });
  }
}

// ----- Genre cache -----

// The genre list shown in search, the Genres rail and the blacklist: the copy
// fetched from the site if present, otherwise the bundled fallback so the source
// works before the first fetch (or if it fails).
export function getGenres(): Option[] {
  const cached = Application.getState(GENRES_KEY) as Option[] | undefined;
  return cached && cached.length > 0 ? cached : GENRES;
}

export function cacheGenres(genres: Option[], now: number): void {
  Application.setState(genres, GENRES_KEY);
  Application.setState(now, GENRES_FETCHED_KEY);
}

// True when the cache is empty or older than the TTL, so it's worth refetching.
export function genresAreStale(now: number): boolean {
  const at = (Application.getState(GENRES_FETCHED_KEY) as number | undefined) ?? 0;
  return now - at > GENRES_TTL;
}
