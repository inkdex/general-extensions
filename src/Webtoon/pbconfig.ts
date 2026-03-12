import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "Webtoon",
  description: `Extension that pulls content from webtoons.com`,
  version: "1.0.0-alpha.13",
  icon: "icon.png",
  languages: "multi",
  contentRating: ContentRating.MATURE,
  capabilities: [
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Yves Pa",
      github: "https://github.com/YvesPa",
    },
  ],
} as ExtensionInfo;
