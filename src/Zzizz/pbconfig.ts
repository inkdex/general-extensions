// Paperback extension configuration for Zzizz
import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Zzizz",
    description: "Extension that pulls content from zzizz.xyz.",
    version: "1.0.0-alpha.1",
    icon: "icon.png",
    language: "🇺🇸",
    contentRating: ContentRating.EVERYONE,
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
