import {
    ContentRating,
    SourceIntents,
    type ExtensionInfo,
} from "@paperback/types";

export default {
    name: "Asura Scans",
    description: "Extension that pulls content from asuracomic.net.",
    version: "1.0.0-alpha.9",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.CHAPTER_PROVIDING,
        SourceIntents.DISCOVER_SECIONS_PROVIDING,
        SourceIntents.SETTINGS_FORM_PROVIDING,
        SourceIntents.SEARCH_RESULTS_PROVIDING,
    ],
    badges: [],
    developers: [
        {
            name: "nyzzik",
            github: "https://github.com/nyzzik",
        },
        {
            name: "Saw_6",
        },
    ],
} satisfies ExtensionInfo;
