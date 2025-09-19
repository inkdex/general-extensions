import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Mangapark",
    description: "Extension that pulls content from mangapark.net.",
    version: "1.0.0-alpha.4",
    icon: "icon.png",
    language: "multi",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.SETTINGS_UI,
    ],
    badges: [],
    developers: [
        {
            name: "Karrot",
        },
    ],
} satisfies SourceInfo;
