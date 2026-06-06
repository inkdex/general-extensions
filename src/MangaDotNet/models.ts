/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Tag } from "@paperback/types";

export const DOMAIN = "https://mangadot.net";

export const STATUS: Tag[] = [
  {
    id: "",
    title: "Any",
  },
  {
    id: "Ongoing",
    title: "Ongoing",
  },
  {
    id: "Completed",
    title: "Completed",
  },
  {
    id: "Hiatus",
    title: "Interrupted",
  },
];

export const ORIGIN: Tag[] = [
  {
    id: "",
    title: "Any",
  },
  {
    id: "JP",
    title: "Manga",
  },
  {
    id: "KR",
    title: "Manhwa",
  },
  {
    id: "CN&TW",
    title: "Manhua",
  },
  {
    id: "ONESHOT",
    title: "Oneshot",
  },
];

export interface MangaData {
  genres: string[];
  date_added: string;
  description: string;
  banner_image: string;
  content_rating: string | null;
  alt_titles: string[] | string | null;
  authors: string[] | string | null;
  artists: string[] | string | null;
  id: number;
  title: string;
  photo: string;
  status: string;
  last_chapter_date: string;
  chapter_count: number;
  is_blurworthy: boolean;
  is_adult: boolean;
  avg_rating: number | null;
}

export interface MangaDataResponse {
  manga: MangaData;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

export interface SearchResponse {
  manga_list: MangaData[];
  pagination: { total_pages: number };
}

export interface ChapterPagesResponse {
  images: { url: string }[];
}

export interface ChapterListResponse {
  id: number;
  chapter_number: number;
  volume_number: null | number;
  chapter_title: string;
  language: string;
  uploader_upload_status: string | null;
  date_added: string;
  scanlator_name: string;
}

export interface Volumes {
  cover_url: string;
}

export type SearchMetadata = {
  genres?: { [id: string]: "included" | "excluded" };
  demographic?: { [id: string]: "included" | "excluded" };
  themes?: { [id: string]: "included" | "excluded" };
  more?: { [id: string]: "included" | "excluded" };
  origin?: string[];
  status?: string[];
  author?: string[];
  artist?: string[];
  adult?: string[];
};

export type PageMetadata = {
  page: number;
};

export type ItemInfo = {
  symbol: string;
  text: string;
};

export type ItemInfoElements = [ItemInfo] | [ItemInfo, ItemInfo];
