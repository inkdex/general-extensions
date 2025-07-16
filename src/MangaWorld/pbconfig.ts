import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    version: "1.2.2",
    name: "MangaWorld",
    description: "Extension that pulls manga from MangaWorld.",
    icon: "MangaWorldIcon.png",
    language: "it",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.SETTINGS_UI,
    ],
    badges: [
        {
            label: "Italian",
            textColor: "#ffffff",
            backgroundColor: "#53c2ae",
        },
    ],
    developers: [
        {
            name: "Catta1997",
            website: "https://github.com/Catta1997",
        },
    ],
} satisfies SourceInfo;
