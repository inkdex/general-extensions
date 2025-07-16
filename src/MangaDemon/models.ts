// Models, selectors, and constants for MangaDemon extension
// Implementation to be added.

import { ContentRating } from "@paperback/types";

// Extension configuration constants
export const DOMAIN = "https://demonicscans.org";
export const LANGUAGE = "en";
export const DEFAULT_CONTENT_RATING = ContentRating.MATURE;

// Selectors and config for parsing (to be refined as needed)
export const MOST_VIEWED_SELECTOR = "h1, h2, h3, h4, h5, h6";
export const USE_POST_IDS = false;

export interface MostViewedItem {
    mangaId: string;
    title: string;
    views: number;
    imageUrl: string;
}

export const MOST_VIEWED_SECTION_ID = "most_viewed_today";
export const MOST_VIEWED_SECTION_TITLE = "Most Viewed Today";

export interface LatestTranslationItem {
    mangaId: string;
    title: string;
    topChapter: string;
    imageUrl: string;
}

export const LATEST_TRANSLATION_SECTION_ID = "latest_translation";
export const LATEST_TRANSLATION_SECTION_TITLE = "Latest Translation";

export interface LatestTranslationMetadata {
    page: number;
    hasNextPage: boolean;
}

export const LATEST_UPDATES_SECTION_ID = "latest_updates";
export const LATEST_UPDATES_SECTION_TITLE = "Latest Updates";

export const NEW_TITLES_SECTION_ID = "new_titles";
export const NEW_TITLES_SECTION_TITLE = "New Titles";

export const LATEST_NOVEL_SECTION_ID = "latest_novel";
export const LATEST_NOVEL_SECTION_TITLE = "Latest Novel";

export interface SearchResultItem {
    mangaId: string;
    title: string;
    imageUrl: string;
    views: string;
}
