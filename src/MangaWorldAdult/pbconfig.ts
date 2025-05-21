import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    version: "1.2",
    name: "MangaWorldAdult",
    description: "Extension that pulls manga from MangaWorldAdult (0.9).",
    icon: "MangaWorldAdultIcon.png",
    language: "it",
    contentRating: ContentRating.ADULT,
    capabilities: [
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.SETTINGS_UI,
    ],
    badges: [
        {
            label: "Italian",
            textColor: "#186180",
            backgroundColor: "#c2ecd8",
        },
    ],
    developers: [
        {
            name: "Catta1997",
            website: "https://github.com/Catta1997",
        },
    ],
} satisfies SourceInfo;
