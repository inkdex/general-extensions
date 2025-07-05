// Paperback extension configuration for Zzizz
import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

const getVersion = (): string => {
    return "1.0.0";
};

export const DOMAIN = "https://zzizz.xyz";
export const LANGUAGE = "en";
export const DEFAULT_CONTENT_RATING = ContentRating.MATURE;

// Selectors and config for parsing
export const SEARCH_MANGA_SELECTOR = ".content-grid a[href*='/manga/']";
export const USE_POST_IDS = false;

// API endpoints
export const READER_API_BASE = "/api/reader/page_data/";

export default {
    name: "Zzizz",
    description: "Extension that pulls content from zzizz.xyz.",
    version: getVersion(),
    icon: "icon.png",
    language: "🇺🇸",
    contentRating: ContentRating.MATURE,
    badges: [],
    capabilities:
        SourceIntents.MANGA_CHAPTERS |
        SourceIntents.DISCOVER_SECIONS |
        SourceIntents.SETTINGS_UI |
        SourceIntents.MANGA_SEARCH,
    developers: [
        {
            name: "samipmainali",
            github: "https://github.com/samipmainali",
        },
    ],
} satisfies SourceInfo;
