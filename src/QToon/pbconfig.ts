import type { ExtensionInfo } from "@paperback/types";
import { ContentRating, SourceIntents } from "@paperback/types";

export default {
  name: "QToon",
  description: "Extension that pulls content from qtoon.com.",
  version: "1.0.0-alpha.1",
  icon: "icon.png",
  language: "multi",
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
