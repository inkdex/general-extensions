import type { ExtensionInfo } from "@paperback/types";
import { ContentRating, SourceIntents } from "@paperback/types";

export default {
    name: "QiScans",
    description: "Extension that pulls content from qiscans.org.",
    version: "1.0.0-alpha.12",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
        SourceIntents.DISCOVER_SECIONS_PROVIDING,
        SourceIntents.CHAPTER_PROVIDING,
        SourceIntents.SEARCH_RESULTS_PROVIDING,
    ],
    badges: [],
    developers: [
        {
            name: "Lucifers Circle",
        },
    ],
} satisfies ExtensionInfo;
