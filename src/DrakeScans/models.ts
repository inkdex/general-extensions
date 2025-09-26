// Models, selectors, and constants for DrakeScans extension
// Implementation to be added.

import { ContentRating } from "@paperback/types";

// Extension configuration constants
export const DOMAIN = "https://drakecomic.org";
export const LANGUAGE = "en";
export const DEFAULT_CONTENT_RATING = ContentRating.EVERYONE;

// Selectors and config for parsing
export const USE_POST_IDS = false;

// Discover Section IDs and Titles
export const POPULAR_TODAY_SECTION_ID = "popular_today";
export const POPULAR_TODAY_SECTION_TITLE = "Popular Today";

export const LATEST_UPDATE_SECTION_ID = "latest_update";
export const LATEST_UPDATE_SECTION_TITLE = "Latest Update";

// Popular Series subsections
export const POPULAR_SERIES_WEEK_SECTION_ID = "popular_series_week";
export const POPULAR_SERIES_WEEK_SECTION_TITLE = "Week";

export const POPULAR_SERIES_MONTH_SECTION_ID = "popular_series_month";
export const POPULAR_SERIES_MONTH_SECTION_TITLE = "Month";

export const POPULAR_SERIES_ALL_SECTION_ID = "popular_series_all";
export const POPULAR_SERIES_ALL_SECTION_TITLE = "All";

// Data models
export interface PopularTodayItem {
    mangaId: string;
    title: string;
    views: number;
    imageUrl: string;
}

export interface LatestUpdateItem {
    mangaId: string;
    title: string;
    topChapter: string;
    imageUrl: string;
}

export interface PopularSeriesItem {
    mangaId: string;
    title: string;
    views: number;
    imageUrl: string;
}

export interface SearchResultItem {
    mangaId: string;
    title: string;
    imageUrl: string;
    views: string;
}
