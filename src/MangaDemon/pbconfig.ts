// Paperback extension configuration for MangaDemon
import {
    ContentRating,
    SourceIntents,
    type SourceInfo,
} from "@paperback/types";

export default {
    name: "MangaDemon",
    description: "Extension that pulls content from demonicscans.org.",
    version: "1.0.0-alpha.2",
    icon: "icon.png",
    language: "🇺🇸",
    contentRating: ContentRating.EVERYONE,
    badges: [],
    capabilities:
        SourceIntents.MANGA_CHAPTERS |
        SourceIntents.DISCOVER_SECIONS |
        SourceIntents.SETTINGS_UI |
        SourceIntents.MANGA_SEARCH |
        SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
    developers: [
        {
            name: "samipmainali",
            github: "https://github.com/samipmainali",
        },
    ],
} satisfies SourceInfo;
