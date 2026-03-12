import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaPlus",
  description: "Extension that pulls content from mangaplus.shueisha.co.jp.",
  version: "1.0.0-alpha.6",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
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
} satisfies ExtensionInfo;
