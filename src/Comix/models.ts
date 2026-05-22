/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { JSONObject } from "@paperback/types";
export const DOMAIN = "https://comix.to";
export const API = `${DOMAIN}/api/v1`;
export const NO_IMAGE = `${DOMAIN}/images/no-poster.png`;

type FilterValue = "included" | "excluded";
export type TagMap = Record<string, FilterValue>;

export interface ApiRequestConfig {
  path: string | string[];
  query?: Record<string, string | string[]>;
}

export interface ApiResponse<T> {
  status: string;
  result: T;
}

export interface Filters {
  type: string;
  filters: string[];
}

export interface ResultManga {
  items: MangaItem[];
}

export interface ChapterPages {
  mangaId: number;
  pages: { baseUrl: string; items: { url: string }[] };
}

export interface MangaItem {
  id: number;
  hid: string;
  title: string;
  altTitles: string[];
  synopsis: string;
  poster: Poster | null;
  originalLanguage: string;
  status: string;
  latestChapter: number;
  chapterUpdatedAtFormatted: string;
  createdAtFormatted: string;
  updatedAtFormatted: string;
  ratedAvg: number;
  contentRating: string;
  type: string;
  hasChapters: boolean;
  finalChapter: number;
  finalVolume: number;
  startDate: string;
  endDate: string;
  year: number;
  rank: number;
  followsTotal: number;
  ratedCount: number;
  synopsisHtml: string;
  url: string;
  uploadUrl: string;
  editUrl: string;
  authors?: { title: string }[];
  artists?: { title: string }[];
  genres: Terms[];
  formats: Terms[];
  demographics: Terms[];
}

export interface Terms {
  id: number;
  title: string;
}

export interface Poster {
  medium?: string;
  large?: string;
}

export interface ChapterItem {
  id: number;
  mangaId: number;
  isOfficial: boolean;
  number: number;
  name: string;
  language: string;
  volume: number;
  votes: number;
  createdAtFormatted: string;
  url: string;
  group?: { name: string } | null;
}

export interface Metadata extends JSONObject {
  page: number;
}

export interface Filter {
  id: number;
  label: string;
}

export type OptionItem = {
  value: string;
  id: string;
};

export interface SearchMetadata extends JSONObject {
  genres?: TagMap;
  formats?: TagMap;
  types?: TagMap;
  demographic?: TagMap;
  status?: TagMap;
  mode?: string[];
  minChap?: number;
}
