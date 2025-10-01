import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Scylla Comics",
    description: "Extension that pulls content from scyllacomics.xyz.",
    version: "1.0.0-alpha.1",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.ADULT,
    capabilities: [
        SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.MANGA_SEARCH,
    ],
    badges: [],
    developers: [
        {
            name: "Lucifers Circle",
            website: "https://inkdex.github.io",
            github: "https://github.com/inkdex",
        },
    ],
} satisfies SourceInfo;
