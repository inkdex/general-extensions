/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { JSONObject } from "@paperback/types";

/** Main website — `_next/data/…` JSON fetches and Referer. */
export const DOMAIN = "https://flamecomics.xyz";

/** CDN hosting all images (covers, chapter pages). */
export const CDN = "https://cdn.flamecomics.xyz";

/** Fallback Next.js BUILD_ID — only used if discovery's regex misses. Will go stale. */
export const FALLBACK_BUILD_ID = "FSAQN1WFneGAAio7sG9-F";

/** Series as it appears in listing endpoints; payloads vary (categories vs tags, latest adds chapters). */
export interface SeriesListItem {
  series_id: number;
  novel_id?: number | null;
  title: string;
  description?: string;
  language?: string;
  type?: string; // e.g. "Manhwa", "Manga", "Comic", "Web Novel"
  categories?: string[]; // genre listing uses this; homepage uses `tags`
  tags?: string[];
  country?: string; // ISO code, e.g. "KR", "JP", "CN"
  author?: string[];
  artist?: string[];
  publisher?: string[];
  year?: number;
  status?: string; // "Ongoing", "Completed", "Hiatus", "Cancelled", "Dropped", …
  likes?: number;
  cover: string;
  last_edit: number; // unix seconds — also the image cache-buster
  updated?: number; // unix seconds — precise last update, only on latest.json
  time?: number; // unix seconds — creation
  chapters?: ChapterListItem[];
}

/** Slim chapter in the Latest homepage block — not the full series-page chapter. */
export interface ChapterListItem {
  series_id: number;
  chapter: string; // number as a string, e.g. "131.00"
  title?: string;
  language?: string;
  release_date: number; // unix seconds
  token: string; // hex token in the chapter URL: /series/<id>/<token>
}

// /api/series — the only endpoint exposing chapter_count.
export interface SimpleSeriesListItem {
  id: number;
  title: string;
  status: string;
  image: string;
  chapter_count: string;
}

/** Merged, fully-populated series used for local sorting/filtering. */
export interface SortableListItem {
  series_id: number;
  title: string;
  description: string;
  language: string;
  type: string;
  categories: string[];
  country: string;
  author: string[];
  artist: string[];
  publisher: string[];
  year: number;
  status: string;
  likes: number;
  cover: string;
  last_edit: number;
  time: number;
  updated: number;
  chapter_count: number;
  chapters?: ChapterListItem[];
}

// /_next/data/<BUILD_ID>/browse.json
export interface SearchFiltersMeta {
  year: string[];
  search: string;
  status: string[];
  types: string[];
  order: "asc" | "desc";
}

export interface SearchPageProps {
  series: SeriesListItem[]; // ALL series — no server-side pagination
  initialFilters: SearchFiltersMeta;
}

export interface SearchProps {
  pageProps: SearchPageProps;
  __N_SSG?: boolean;
  cookies?: Record<string, string>;
}

// /_next/data/<BUILD_ID>/latest.json
export interface LatestPageProps {
  allSeries: SeriesListItem[]; // ALL series — no server-side pagination
  keywordsMeta: string;
}

export interface LatestProps {
  pageProps: LatestPageProps;
  __N_SSG?: boolean;
  cookies?: Record<string, string>;
}

// /_next/data/<BUILD_ID>/index.json (homepage)
export interface HomepageBlock {
  title: string;
  showChapters?: boolean;
  carousel?: boolean;
  series: SeriesListItem[];
}

export interface HomepageBlockContainer {
  blocks: HomepageBlock[];
}

export interface HomepageCarouselItem {
  id: number;
  series_id: number | null;
  novel_id: number | null;
  title: string;
  categories?: string[];
  language?: string;
  image: string; // filename under /uploads/images/carousel/<image>
  link?: string | null;
}

export interface HomepagePageProps {
  popularEntries: HomepageBlockContainer;
  latestEntries: HomepageBlockContainer;
  staffPicks: HomepageBlockContainer;
  // TODO: novels: HomepageBlockContainer;
  carousel: HomepageCarouselItem[];
  keywordsMeta?: string;
  announcements?: unknown[];
}

export interface HomepageResponse {
  pageProps: HomepagePageProps;
  __N_SSG?: boolean;
}

// /_next/data/<BUILD_ID>/series/<id>.json (manga detail)

/** Full series object returned by the detail endpoint (richer than list items). */
export interface SeriesDetail {
  series_id: number;
  title: string;
  altTitles?: string[];
  description?: string;
  language?: string;
  type?: string;
  tags?: string[]; // genres, on the detail endpoint
  country?: string;
  author?: string[];
  artist?: string[];
  publisher?: string[];
  year?: number;
  status?: string;
  schedule?: string; // free-text, e.g. "schedule" or a day name
  likes?: number;
  cover: string;
  draft?: number;
  official?: string;
  last_edit: number;
  time?: number;
}

/** Full chapter object returned by the detail endpoint. */
export interface ChapterDetail {
  chapter_id: number;
  series_id: number;
  chapter: string; // "204.00", "131.5", etc.
  title?: string;
  cover?: number; // 0/1 — has a custom cover
  release_date: number; // unix seconds
  token: string; // hex token to fetch chapter pages
  edit_time?: number; // unix seconds — cache-buster for page images
}

export interface SeriesDetailPageProps {
  series: SeriesDetail;
  chapters: ChapterDetail[];
}

export interface SeriesDetailResponse {
  pageProps: SeriesDetailPageProps;
}

// /_next/data/<BUILD_ID>/series/<id>/<token>.json (reader)

/** One page image; keyed by stringified page index in `images`. */
export interface ChapterImage {
  size: number;
  type: string[];
  name: string; // original file name, e.g. "ORV_credit_page-3.jpg"
  modified: string; // ISO 8601 timestamp
  width: number;
  height: number;
}

export interface ChapterReaderData {
  series_id: number;
  chapter_id: number;
  chapter: string;
  chapter_title?: string;
  images: Record<string, ChapterImage>; // keyed by page index (string)
  language?: string;
  draft?: number;
  hidden?: number;
  token: string;
  release_date: number;
  edit_time: number;
  unix_timestamp?: number;
  title: string;
  altTitles?: string[];
  tags?: string[];
  description?: string;
  cover: string;
}

export interface ChapterReaderResponse {
  pageProps: {
    chapter: ChapterReaderData;
    token: string;
    previous?: string | null;
    next?: string | null;
  };
}

/** Pagination cursor for Paperback's PagedResults. */
export interface Metadata extends JSONObject {
  page: number;
}

// FlameComics has no server search endpoint — search is done client-side by
// aggregating the list endpoints and filtering locally. SearchMetadata holds
// the user's advanced-search choices.

export type SearchMetadata = {
  categories?: { [id: string]: "included" | "excluded" }; // genre id (lowercased slug) → state
  categoriesMode?: "or" | "and"; // combine genres as any (OR) or all (AND)
  types?: string[];
  publisher?: { [id: string]: "included" | "excluded" };
  status?: string[];
  author?: { [id: string]: "included" | "excluded" };
  artist?: { [id: string]: "included" | "excluded" };
  year?: string[];
  language?: string;
  country?: string;
  order?: "asc" | "desc";
};

export type OptionItem = {
  value: string;
  id: string;
};

/** Available option lists for each advanced-search field. */
export class FlameFilter {
  categories: OptionItem[] = [];
  types: OptionItem[] = [];
  publisher: OptionItem[] = [];
  status: OptionItem[] = [];
  author: OptionItem[] = [];
  artist: OptionItem[] = [];
  year: OptionItem[] = [];
  language: OptionItem[] = [];
  country: OptionItem[] = [];
}

/** Parsed tristate filter (included/excluded name lists). */
export interface TristateParsed {
  hasFilters: boolean;
  requestedNames: (string | undefined)[];
  rejectedNames: (string | undefined)[];
}
