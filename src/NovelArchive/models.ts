/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ContentRating, JSONObject, SortingOption, Tag } from "@paperback/types";

export const DOMAIN = "https://novelarchive.cc";
export const API_URL = `${DOMAIN}/api`;
export const PAGE_SIZE = 24;

export const SECTIONS = {
  POPULAR: "popular",
  LATEST: "latest",
  EDITORS: "editors",
  TOP_RATED: "top-rated",
  MOST_CHAPTERS: "most-chapters",
  GENRES: "genres",
} as const;

export const STATE_KEYS = {
  DEFAULT_GENRES: "novelarchive_default_genres",
  GENRES: "novelarchive_genres",
  HIDE_ADULT: "novelarchive_hide_adult",
} as const;

export const ADULT_EXCLUSIONS = [
  "adult",
  "smut",
  "mature",
  "erotica",
  "ecchi",
  "hentai",
  "explicit",
  "sexual content",
  "nsfw",
  "r-18",
  "lewd",
  "pornographic",
];

export const MATURE_RATING_GENRES = ["mature", "ecchi"];

// The site client treats these navigation labels as non-genres.
export const NON_GENRE_VALUES = new Set([
  "browse",
  "completed novel",
  "completed novels",
  "latest novel",
  "latest novels",
  "anime & comics",
  "anime and comics",
]);

export interface PageMetadata extends JSONObject {
  page?: number;
}

export type TriState = Record<string, "included" | "excluded">;

export interface SearchMetadata extends JSONObject {
  status?: string[];
  genreMatch?: string[];
  genres?: TriState;
}

export interface GenreOption {
  value: string;
  label: string;
}

export interface GenreListResponse {
  genres: GenreOption[];
}

export interface Novel {
  id: number | string;
  title: string;
  author?: string | null;
  genres?: string | null;
  cover_url?: string | null;
  image_url?: string | null;
  novel_image?: string | null;
  associated_names?: string[] | null;
  description?: string | null;
  total_chapters?: string | number | null;
  views?: string | number | null;
  views_number?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  release_status?: string | null;
  ongoing?: string | null;
  updated_at?: string | null;
  chapter_names?: string[] | null;
}

export interface NovelDetailResponse {
  novel: Novel;
}

export interface NovelListItem {
  mangaId: string;
  title: string;
  imageUrl: string;
  contentRating: ContentRating;
  genres: string[];
  author?: string;
  summary?: string;
  rating?: number;
  views?: number;
  chapterCount: number;
  publishDate?: Date;
}

export interface NovelListResponse {
  novels: Novel[];
  pagination?: { has_next?: boolean };
}

export interface ChapterDetailResponse {
  chapter?: { content?: string | null };
  content?: string | null;
}

export interface NovelSource {
  id: string;
  label?: string | null;
}

export interface NovelSourceListResponse {
  sources: NovelSource[];
}

export interface SourceChapter {
  number: number | string;
  title?: string | null;
}

export interface SourceChapterListResponse {
  chapters: SourceChapter[];
}

export interface SourceChapterDetailResponse {
  content_html?: string | null;
  content?: string | null;
  chapter?: { content_html?: string | null; content?: string | null } | null;
}

export const SORT_OPTIONS: SortingOption[] = [
  { id: "recent", label: "Recent" },
  { id: "popular", label: "Popular" },
  { id: "rating", label: "Top Rated" },
  { id: "chapters", label: "Chapters" },
];

export const STATUS_OPTIONS: Tag[] = [
  { id: "all", title: "All" },
  { id: "ongoing", title: "Ongoing" },
  { id: "completed", title: "Completed" },
  { id: "hiatus", title: "Hiatus" },
];

export const GENRE_MATCH_OPTIONS: Tag[] = [
  { id: "all", title: "AND" },
  { id: "any", title: "OR" },
];
