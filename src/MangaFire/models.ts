/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export const DOMAIN = "https://mangafire.to";

// Cache keys
export const SEARCH_DETAILS_CACHE_KEY = "search_details_cache";
export const VRF_SEARCH_CACHE_KEY = "search_vrf_cache";
export const VRF_CHAPTER_CACHE_KEY = "chapter_vrf_cache";

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
