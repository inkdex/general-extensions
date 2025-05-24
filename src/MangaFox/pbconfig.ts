import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "MangaFox",
    description: "Extension that pulls content from fanfox.net.",
    version: "1.0.0-alpha.3",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.MATURE,
    capabilities: [
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.MANGA_CHAPTERS,
    ],
    badges: [],
    developers: [
        {
            name: "Egwau",
        },
    ],
} satisfies SourceInfo;
