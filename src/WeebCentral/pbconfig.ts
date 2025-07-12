import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Weeb Central",
    description: "Extension that pulls content from weebcentral.com.",
    version: "1.0.0-alpha.4",
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
            name: "Inkdex",
            website: "https://inkdex.github.io",
            github: "https://github.com/inkdex",
        },
    ],
} satisfies SourceInfo;
