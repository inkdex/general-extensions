import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "Weeb Central",
  description: "Extension that pulls content from weebcentral.com.",
  version: "1.0.0-alpha.13",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities:
    SourceIntents.CHAPTER_PROVIDING |
    SourceIntents.DISCOVER_SECIONS_PROVIDING |
    SourceIntents.SEARCH_RESULTS_PROVIDING |
    SourceIntents.SETTINGS_FORM_PROVIDING |
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  badges: [],
  developers: [
    {
      name: "GabrielCWT",
      github: "https://github.com/GabrielCWT",
    },
  ],
} satisfies ExtensionInfo;
