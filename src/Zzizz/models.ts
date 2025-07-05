// Models for Zzizz extension
// Combines type definitions and constants for better organization

import { ContentRating } from "@paperback/types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ZizMangaData {
    title: string;
    author: string;
    artist: string;
    status: string;
    rating?: number;
    genres: string[];
    synopsis: string;
    coverUrl: string;
    contentRating: ContentRating;
}

export interface ZizChapterData {
    chapterId: string;
    chapterNumber: number;
    chapterName: string;
    publishDate: Date;
}

export interface ZizSearchResult {
    mangaId: string;
    title: string;
    imageUrl: string;
}

export interface ZizDiscoverItem {
    mangaId: string;
    title: string;
    imageUrl: string;
    subtitle?: string;
}

export interface ZizTrendingData {
    works: Array<{
        title: string;
        url: string;
        cover_url: string;
        last_chapter_num?: number;
    }>;
}

export interface ZizFilterOptions {
    genres: { id: string; value: string }[];
}

export interface ZizSortingOptions {
    id: string;
    label: string;
}

export interface ZizParserContext {
    domain: string;
    language: string;
    defaultContentRating: ContentRating;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SELECTORS = {
    MANGA: {
        TITLE: "h1",
        AUTHOR: "span:contains('Author'), span:contains('Author(s)')",
        ARTIST: "span:contains('Artist'), span:contains('Artist(s)')",
        STATUS: "span:contains('Status')",
        STATUS_VALUE: "span:contains('Status')",
        RATING: "#header-rating-value",
        COVER: ".md\\:col-span-4 img, .lg\\:col-span-3 img",
        GENRES: "span.text-xs.font-semibold.bg-\\[\\#1a1a1a\\]",
        SYNOPSIS: "h2:contains('Synopsis')",
        SYNOPSIS_CONTENT: "h2:contains('Synopsis')",
    },
    CHAPTER: {
        ITEMS: ".chapter-item",
        TITLE: "h3",
        DATE: "p.text-xs.text-gray-400",
        CANVAS: ".page-canvas",
    },
    SEARCH: {
        RESULTS: ".content-grid a[href*='/manga/']",
        TITLE: "h3, .manga-title, .title",
        IMAGE: "img",
        NO_RESULTS:
            ".col-span-full .text-lg:contains('No manhua found'), .content-grid:empty",
    },
    DISCOVER: {
        LATEST_UPDATES: "#updatesGridContainer .bg-neutral-800",
        LATEST_PROJECTS: "h2:contains('Latest Projects')",
        MANGA_ITEMS: ".manga-item, .manga-card",
    },
    PAGINATION: {
        NAV: ".pagination",
        NEXT: ".pagination a[title='Next Page'], .pagination a:contains('Next')",
        NUMBERS: ".pagination .page-link",
    },
} as const;

export const STATUS_MAPPING = {
    ONGOING: ["in release", "ongoing", "publishing"],
    COMPLETED: ["completed", "finished"],
    HIATUS: ["hiatus", "on hold"],
    CANCELLED: ["cancelled", "dropped"],
} as const;

export const CONTENT_RATING_GENRES = {
    ADULT: ["harem", "harém"],
} as const;

export const API_ENDPOINTS = {
    TRENDING: "https://zzizz.xyz/ajax/get-trending-data/",
    READER_BASE: "/api/reader/page_data/",
} as const;

// ============================================================================
// FALLBACK CONSTANTS
// ============================================================================

/**
 * Fallback genre list used when dynamic parsing fails
 * These are the actual genres from the zzizz.xyz website
 */
export const FALLBACK_GENRES = [
    "Action",
    "Comedy",
    "Drama",
    "Fantasy",
    "Game",
    "Harém",
    "Invocation",
    "Magic",
    "Martial Arts",
    "Murim",
    "Pet",
    "Shounen",
    "Supernatural",
    "System",
] as const;

/**
 * Fallback sorting options used when dynamic parsing fails
 * These are the actual sorting options from the zzizz.xyz website
 */
export const FALLBACK_SORT_OPTIONS = [
    { id: "latest", label: "Most Recent" },
    { id: "popular", label: "Most Popular" },
    { id: "rating", label: "Best Rating" },
    { id: "name_asc", label: "Name (A-Z)" },
    { id: "name_desc", label: "Name (Z-A)" },
] as const;

/**
 * Default sorting options with empty option for fallback
 */
export const DEFAULT_SORT_OPTIONS = [
    { id: "", label: "Default" },
    ...FALLBACK_SORT_OPTIONS,
] as const;
