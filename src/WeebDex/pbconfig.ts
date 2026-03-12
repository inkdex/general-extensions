import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "WeebDex",
  description: "Extension that pulls content from weebdex.org.",
  version: "1.0.0-alpha.7",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.MATURE,
  capabilities: [
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Lucifers Circle",
    },
  ],
} satisfies ExtensionInfo;
