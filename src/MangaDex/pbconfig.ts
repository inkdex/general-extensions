import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaDex",
  description: "Extension that pulls content from mangadex.org.",
  version: "1.0.0-alpha.20",
  icon: "icon.png",
  languages: "multi",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.MANAGED_COLLECTION_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECIONS_PROVIDING,
    SourceIntents.SEARCH_RESULTS_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
    SourceIntents.MANGA_PROGRESS_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Inkdex",
      website: "https://inkdex.github.io",
      github: "https://github.com/inkdex",
    },
  ],
} as ExtensionInfo;
