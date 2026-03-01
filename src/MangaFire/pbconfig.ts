import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaFire",
  description: "Extension that pulls content from mangafire.to.",
  version: "1.0.0-alpha.9",
  icon: "icon.png",
  language: "multi",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.DISCOVER_SECIONS_PROVIDING,
    SourceIntents.SEARCH_RESULTS_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Karrot",
    },
    {
      name: "nyzzik",
    },
  ],
} satisfies ExtensionInfo;
