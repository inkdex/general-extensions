/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type Chapter, type JSONObject } from "@paperback/types";

// Constants

export const WC_DOMAIN = "https://weebcentral.com";
export const DEFAULT_LANGUAGE_CODE = "🇬🇧";
export const EMPTY_SEARCH_METADATA: SearchMetadata = {
  genres: [],
  seriesStatuses: [],
  seriesTypes: [],
  orderIsDescending: false,
  orderIsAscending: false,
};

// Enums

export enum TagSectionId {
  Genres = "included_tag",
  SeriesStatus = "included_status",
  SeriesType = "included_type",
  Order = "order",
}

export enum TagSectionTitle {
  Genres = "Genres",
  SeriesStatus = "Series Status",
  SeriesType = "Series Type",
  Order = "Order",
}

// Interfaces

export interface WeebCentralMetadata extends JSONObject {
  page?: number; // For homepage sections
  offset?: number; // For search results
}

export interface ChapterWithMetadata extends Chapter {
  chapterType: string;
}

export interface SearchMetadata extends JSONObject {
  genres?: string[];
  seriesStatuses?: string[];
  seriesTypes?: string[];
  orderIsDescending?: boolean;
}
