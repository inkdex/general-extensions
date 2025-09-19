import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Atsumaru",
    description: "Extension that pulls content from atsu.moe",
    version: "1.0.0-alpha.1",
    icon: "icon.png",
    language: "English",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.MANGA_CHAPTERS,
    ],
    badges: [],
    developers: [
        {
            name: "Karrot",
        },
    ],
} satisfies SourceInfo;
