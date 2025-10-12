import {
    ContentRating,
    SourceIntents,
    type SourceInfo,
} from "@paperback/types";

export default {
    name: "MangaKatana",
    description: "Extension that pulls content from mangakatana.com.",
    version: "1.0.0-alpha.5",
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
