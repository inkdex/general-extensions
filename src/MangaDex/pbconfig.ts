import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaDex",
  description: "Extension that pulls content from mangadex.org.",
  version: "1.0.0-alpha.22",
  icon: "icon.png",
  languages: "multi",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.MANAGED_COLLECTION_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
    SourceIntents.PROGRESS_PROVIDING,
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
