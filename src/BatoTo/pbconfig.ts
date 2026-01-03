import {
  ContentRating,
  SourceIntents,
  type ExtensionInfo,
} from "@paperback/types";

export default {
  name: "Bato.To",
  description: "Extension that pulls content from bato.to.",
  version: "1.0.0-alpha.5",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.ADULT,
  capabilities: [
    SourceIntents.SETTINGS_FORM_PROVIDING,
    SourceIntents.DISCOVER_SECIONS_PROVIDING,
    SourceIntents.SEARCH_RESULTS_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
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
