import {
    ContentRating,
    SourceIntents,
    type SourceInfo,
} from "@paperback/types";

export default {
    name: "Weeb Central",
    description: "Extension that pulls content from weebcentral.com.",
    version: "1.0.0-alpha.8",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.SETTINGS_UI,
    ],
    badges: [],
    developers: [
        {
            name: "GabrielCWT",
            github: "https://github.com/GabrielCWT",
        },
    ],
} satisfies SourceInfo;
