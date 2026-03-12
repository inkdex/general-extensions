import { ContentRating, SourceIntents, type SourceInfo } from "@paperback/types";

export default {
  name: "Mangapill",
  description: "Extension that pulls content from mangapill.com.",
  version: "1.0.0-alpha.5",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "GabrielCWT",
      github: "https://github.com/GabrielCWT",
    },
  ],
} satisfies SourceInfo;
