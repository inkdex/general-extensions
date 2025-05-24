import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Mgeko",
    description: "Extension that pulls content from mgeko.cc.",
    version: "1.0.0-alpha.7",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_CHAPTERS,
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
