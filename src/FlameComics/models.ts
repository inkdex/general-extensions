/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// ---------------------------------------------------------------------------
// TODO: Implement BUILD_ID auto-refresh + caching in network.ts.
// ---------------------------------------------------------------------------

import type { JSONObject } from "@paperback/types";

/** Main website (used for `_next/data/…` JSON fetches and as Referer). */
export const DOMAIN = "https://flamecomics.xyz";

/**
 * CDN where all images live (covers, carousel banners, chapter pages).
 * Example image URL:
 *   https://cdn.flamecomics.xyz/uploads/images/series/{series_id}/thumbnail.png?{last_edit}
 */
export const CDN = "https://cdn.flamecomics.xyz";

/** Fallback Next.js BUILD_ID — only used if discovery fails. Will go stale; treat as a last resort. */
export const FALLBACK_BUILD_ID = "FSAQN1WFneGAAio7sG9-F";

/** Default width to request from the Next.js image optimizer for thumbnails. */
export const THUMB_WIDTH = 480;

/** Allowed widths according to the website's `next.config` image config. */
export const ALLOWED_IMAGE_WIDTHS = [384, 480, 720, 1080, 1920] as const;

/** A placeholder image — TODO: bundle a local "no-image" asset if needed. */
export const NO_IMAGE = `${DOMAIN}/favicon.ico`;

export const HEART_UNICODE = "♥"; // not sure what unicode between 🤍 and ♡ and ♥

// ---------------------------------------------------------------------------
// These interfaces mirror the exact JSON the website returns. Field names and
// casing are NOT ours to choose — they're dictated by the server.
// ---------------------------------------------------------------------------

// ---------- /_next/data/<BUILD_ID>/genre/<genre>.json (list view) -----------

/**
 * Series as it appears in the listing endpoints (genre, plus the `series` array
 * of the homepage `popularEntries` / `staffPicks` blocks).
 *
 * NOTE: list payloads vary slightly between endpoints (some include
 * `categories`, others use `tags`; latest entries include a `chapters` array).
 * Every field below is optional except the bare minimum (id + title + cover).
 */
export interface SeriesListItem {
  /** Numeric primary key — used to build CDN image URLs. */
  series_id: number;
  /** For novels only — null otherwise. */
  novel_id?: number | null;
  title: string;
  description?: string;
  language?: string;
  /** e.g. "Manhwa", "Manga", "Manhua", "Comic", "Web Novel". */
  type?: string;
  /** Genre list, either as `categories` (genre listing) or `tags` (homepage). */
  categories?: string[];
  tags?: string[];
  /** ISO country code, e.g. "KR", "JP", "CN". */
  country?: string;
  author?: string[];
  artist?: string[];
  publisher?: string[];
  year?: number;
  /** "Ongoing", "Completed", "Hiatus", "Cancelled", "Dropped", … */
  status?: string;
  likes?: number;
  /** Thumbnail filename — typically "thumbnail.png" / ".jpeg" / ".webp". */
  cover: string;
  /** Unix epoch (seconds) — used as cache-busting query string and as a "version" tag. */
  last_edit: number;

  /** Unix epoch (seconds) — for precise last chapter update, only seen on latest.json. */
  updated?: number;

  /** Unix epoch (seconds) of creation. */
  time?: number;
  /** Present on the "Latest" homepage block and in the latest api. */
  chapters?: ChapterListItem[];
}

/**
 * Slim chapter object embedded in the Latest homepage block.
 * NOT the same as the full chapter object on the series page.
 */
export interface ChapterListItem {
  series_id: number;
  /** Chapter number as a string, e.g. "131.00". */
  chapter: string;
  title?: string;
  language?: string;
  /** Unix epoch (seconds). */
  release_date: number;
  /** Hex token used in the chapter URL: `/series/<id>/<token>`. */
  token: string;
}

// interface of /api/series
// This endpoint is loaded at every pages of the website to do a fast search
// It's only usefull to us because it's the only known endpoint that has the chapter_count.

export interface SimpleSeriesListItem {
  /** Numeric primary key — used to build CDN image URLs. */
  id: number;
  title: string;
  /** "Ongoing", "Completed", "Hiatus", "Cancelled", "Dropped", … */
  status: string;
  /** Thumbnail filename — typically "thumbnail.png" / ".jpeg" / ".webp". */
  image: string;
  /** Present on the "Latest" homepage block. */
  chapter_count: string;
}

// Merged type containing all useful information for sorting and filtering

export interface SortableListItem {
  /** Numeric primary key — used to build CDN image URLs. */
  series_id: number;
  title: string;
  description: string;
  language: string;
  /** e.g. "Manhwa", "Manga", "Manhua", "Comic", "Web Novel". */
  type: string;
  /** Genre list, either as `categories` (genre listing) or `tags` (homepage). */
  categories: string[];
  /** ISO country code, e.g. "KR", "JP", "CN". */
  country: string;
  author: string[];
  artist: string[];
  publisher: string[];
  year: number;
  /** "Ongoing", "Completed", "Hiatus", "Cancelled", "Dropped", … */
  status: string;
  likes: number;
  /** Thumbnail filename — typically "thumbnail.png" / ".jpeg" / ".webp". */
  cover: string;
  /** Unix epoch (seconds) — used as cache-busting query string and as a "version" tag. */
  last_edit: number;
  /** Unix epoch (seconds) of creation. */
  time: number;
  /** Unix epoch (seconds) — for precise last chapter update, only seen on latest.json. */
  updated: number;
  /** Present on the "Latest" homepage block. */
  chapter_count: number;

  /** Present on the "Latest" homepage block. */
  chapters?: ChapterListItem[];
}

export type SelectListParam = "categories" | "tags" | "author" | "artist" | "publisher";

// ---------- /browse endpoint response

export interface SearchFiltersMeta {
  year: string[];
  search: string;
  status: string[];
  types: string[];
  order: "asc" | "desc";
}

export interface SearchPageProps {
  /** ALL series — there is no server-side pagination. */
  series: SeriesListItem[];
  initialFilters: SearchFiltersMeta;
}

export interface SearchProps {
  pageProps: SearchPageProps;
  __N_SSG?: boolean;
  cookies?: Record<string, string>;
}

// ---------- /_next/data/daQGrsf8dVsqbTg0CzROB/latest.json endpoint response

export interface LatestPageProps {
  /** ALL series — there is no server-side pagination. */
  allSeries: SeriesListItem[];
  keywordsMeta: string;
}

export interface LatestProps {
  pageProps: LatestPageProps;
  __N_SSG?: boolean;
  cookies?: Record<string, string>;
}

// ---------- /_next/data/<BUILD_ID>/index.json (homepage) --------------------

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
  /** Filename under `/uploads/images/carousel/<image>`. */
  image: string;
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

// ---------- /_next/data/<BUILD_ID>/series/<id>.json (manga detail) ----------

/** Full series object returned by the detail endpoint (richer than list items). */
export interface SeriesDetail {
  series_id: number;
  title: string;
  altTitles?: string[];
  description?: string;
  language?: string;
  type?: string;
  /** Detail endpoint uses `tags` (genres). */
  tags?: string[];
  country?: string;
  author?: string[];
  artist?: string[];
  publisher?: string[];
  year?: number;
  status?: string;
  /** Free-text schedule, e.g. "schedule" or a day name. */
  schedule?: string;
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
  /** "204.00", "131.5", etc. */
  chapter: string;
  title?: string;
  /** 0/1 — whether the chapter has a custom cover. */
  cover?: number;
  /** Unix epoch (seconds). */
  release_date: number;
  /** Hex token used to fetch chapter pages. */
  token: string;
  /** Unix epoch (seconds) — last edit, used as cache-buster for page images. */
  edit_time?: number;
}

export interface SeriesDetailPageProps {
  series: SeriesDetail;
  chapters: ChapterDetail[];
}

export interface SeriesDetailResponse {
  pageProps: SeriesDetailPageProps;
}

// ---------- /_next/data/<BUILD_ID>/series/<id>/<token>.json (reader) --------

/**
 * Single page image entry inside a chapter payload.
 *
 *   "0": { size, type: ["image/jpeg"], name, modified, width, height }
 *
 * The key is the page index (as a string), the value is this object.
 * We turn it into an ordered array at parse time.
 */
export interface ChapterImage {
  size: number;
  type: string[];
  /** Original file name, e.g. "ORV_credit_page-3.jpg". */
  name: string;
  /** ISO 8601 timestamp string. */
  modified: string;
  width: number;
  height: number;
}

export interface ChapterReaderData {
  series_id: number;
  chapter_id: number;
  chapter: string;
  chapter_title?: string;
  /** Map of page index (string) -> ChapterImage. */
  images: Record<string, ChapterImage>;
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

// ---------------------------------------------------------------------------
// Paginated section metadata used by Paperback's PagedResults<…>
// ---------------------------------------------------------------------------

export interface Metadata extends JSONObject {
  page: number;
}

// ---------------------------------------------------------------------------
// Search metadata (advanced search form values).
// FlameComics doesn't (apparently) expose a real search endpoint — see
// `flamecomics.md`. We therefore implement search client-side by aggregating
// all genre endpoints and filtering locally. SearchMetadata stores the
// user's filter choices.
// ---------------------------------------------------------------------------

export type TagState = "included" | "excluded";
export type TagMap = Record<string, TagState>;

export type SearchMetadata = {
  /** Selected genres (id => included/excluded) — ids are lowercased genre slugs e.g. "action". */
  categories?: { [id: string]: "included" | "excluded" };
  /** If the selecteds genres should be understood as inclusive or exclusive */
  categoriesMode?: "or" | "and";
  /** Selected types e.g. "Manhwa". */
  types?: string[];
  /** Possible publishers e.g. "BiliBili". */
  publisher?: { [id: string]: "included" | "excluded" };
  /** Possible statuses e.g. "Ongoing". */
  status?: string[];
  /** Possible authors e.g. "Cracker". */
  author?: { [id: string]: "included" | "excluded" };
  /** Possible artists e.g. "RK STUDIO" */
  artist?: { [id: string]: "included" | "excluded" };
  /** Possible publication years. */
  year?: string[];
  /** Possible publication language : English. */
  language?: string;
  /** Possible publication county : CN. */
  country?: string;
  /** Sort order — handled via SortingOption.id by Paperback, kept here for completeness. */
  order?: "asc" | "desc";
};

export interface Filter {
  id: number;
  label: string;
}

export type OptionItem = {
  value: string;
  id: string;
};

export interface ParamsPossibilities extends JSONObject {
  /** Possible categories, ids are lowercased genre slugs e.g. "action". */
  categories: string[];
  /** Possible types e.g. "Manhwa". */
  types: string[];
  /** Possible statuses e.g. "Ongoing". */
  status: string[];
  /** Possible publishers e.g. "BiliBili". */
  publisher: string[];
  /** Possible authors e.g. "Cracker". */
  author: string[];
  /** Possible artists e.g. "RK STUDIO" */
  artist: string[];
  /** Possible publication years. */
  year: string[];
  /** Possible publication language : English. */
  language: string[];
  /** Possible publication county : CN. */
  country: string[];
}

// Search metadata for the advanced search form

/**
 * Class with all of the filters possibilities:
 *
 * categories, types, publisher, status, author, artist, year, language, country
 */
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

/**
 * Represents parsed tristate filter data (included/excluded)
 */
export interface TristateParsed {
  hasFilters: boolean;
  requestedNames: (string | undefined)[];
  rejectedNames: (string | undefined)[];
}
