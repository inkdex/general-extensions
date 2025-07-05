// Centralized constants for Zzizz extension
// All selectors and configuration values in one place for easy maintenance

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
