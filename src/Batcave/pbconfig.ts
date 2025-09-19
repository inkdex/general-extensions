import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Batcave",
    description: "Extension that pulls content from batcave.biz.",
    version: "1.0.0-alpha.6",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.EVERYONE,
    badges: [],
    capabilities: [
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.MANGA_CHAPTERS,
    ],
    developers: [
        {
            name: "Karrot",
        },
    ],
} satisfies SourceInfo;
