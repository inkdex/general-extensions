import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaKatana",
  description: "Extension that pulls content from mangakatana.com.",
  version: "1.0.0-alpha.10",
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
