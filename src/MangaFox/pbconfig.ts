import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaFox",
  description: "Extension that pulls content from fanfox.net.",
  version: "1.0.0-alpha.8",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.MATURE,
  capabilities: [
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Egwau",
    },
  ],
} satisfies ExtensionInfo;
