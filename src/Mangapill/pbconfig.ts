import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Mangapill",
    description: "Extension that pulls content from mangapill.com.",
    version: "1.0.0-alpha.3",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
    ],
    badges: [],
    developers: [
        {
            name: "GabrielCWT",
            github: "https://github.com/GabrielCWT",
        },
    ],
} satisfies SourceInfo;
