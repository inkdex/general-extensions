import {
    ContentRating,
    SourceIntents,
    type SourceInfo,
} from "@paperback/types";

export default {
    name: "Bato.To",
    description: "Extension that pulls content from bato.to.",
    version: "1.0.0-alpha.4",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.ADULT,
    capabilities: [
        SourceIntents.SETTINGS_UI,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.MANGA_CHAPTERS,
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
