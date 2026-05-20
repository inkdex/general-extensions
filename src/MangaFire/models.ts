/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export const DOMAIN = "https://mangafire.to";

// Chapter images come from `{prefix}.mfcdn{1,2,3}.xyz`. All prefixes serve byte-identical content
// for a given path — the API pins one per session, but the host can be swapped freely on failure.
export const CDN_PREFIXES = ["k99", "l1n", "m3z", "nw8", "o48"];
export const CDN_HOST_REGEX = /^(https?:\/\/)([a-z0-9]{3})(\.mfcdn[0-9]+\.xyz)/;
export const BROKEN_CDN_PREFIXES_KEY = "broken_cdn_prefixes";

// Cache keys
export const SEARCH_DETAILS_CACHE_KEY = "search_details_cache";
export const VRF_SEARCH_CACHE_KEY = "search_vrf_cache";
export const VRF_CHAPTER_CACHE_KEY = "chapter_vrf_cache";

// Languages
export const LANGUAGES = [
  { title: "🇬🇧 English", id: "en" },
  { title: "🇪🇸 Español", id: "es" },
  { title: "🇲🇽 Español (Latinoamérica)", id: "es-la" },
  { title: "🇫🇷 Français", id: "fr" },
  { title: "🇵🇹 Português", id: "pt" },
  { title: "🇧🇷 Português (Brasil)", id: "pt-br" },
  { title: "🇯🇵 日本語", id: "ja" },
];

export type PageMetadata = { page?: number; collectedIds?: string[] };

export interface Result {
  status: number;
  result: string | { html: string; title_format: string };
}

export interface PageResponse {
  status: number;
  result: { images: ImageData[] };
}

export type SearchOption = { id: string; label: string };

export type SearchDetails = {
  types: SearchOption[];
  genres: SearchOption[];
  status: SearchOption[];
  languages: SearchOption[];
  years: SearchOption[];
  lengths: SearchOption[];
  sorts: SearchOption[];
};

export type SearchMetadata = {
  genres?: { [id: string]: "included" | "excluded" };
  genreMode?: boolean;
  type?: string;
  status?: string;
  language?: string;
  year?: string;
  length?: string;
};

// Represents each image entry in the "images" array
// Each entry is an array where:
// - index 0 is a string (image URL)
// - index 1 is a number (possibly an identifier or category)
// - index 2 is a number (possibly a flag or status indicator)
export type ImageData = [string, number, number];
