import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "Mgeko",
  description: "Extension that pulls content from mgeko.cc.",
  version: "1.0.0-alpha.18",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
    SourceIntents.DISCOVER_SECIONS_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.SEARCH_RESULTS_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Inkdex",
      website: "https://inkdex.github.io",
      github: "https://github.com/inkdex",
    },
  ],
} satisfies ExtensionInfo;
