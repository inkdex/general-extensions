import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "ComixTo",
  description: "Extension that pulls content from Comix.to.",
  version: "1.0.0-alpha.14",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities:
    SourceIntents.SETTINGS_FORM_PROVIDING |
    SourceIntents.DISCOVER_SECTION_PROVIDING |
    SourceIntents.SEARCH_RESULT_PROVIDING |
    SourceIntents.CHAPTER_PROVIDING |
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  badges: [],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
