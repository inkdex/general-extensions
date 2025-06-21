import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Webtoon",
    description: `Extension that pulls content from webtoons.com`,
    version: "1.0.0-alpha.8",
    icon: "icon.png",
    languages: "multi",
    contentRating: ContentRating.MATURE,
    capabilities: [
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.SETTINGS_UI,
        SourceIntents.MANGA_SEARCH,
    ],
    badges: [],
    developers: [
        {
            name: "Yves Pa",
            github: "https://github.com/YvesPa",
        },
    ],
} as SourceInfo;
