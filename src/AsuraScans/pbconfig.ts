import { ContentRating, SourceIntents, type SourceInfo } from "@paperback/types";

export default {
  name: "Asura Scans",
  description: "Extension that pulls content from asuracomic.net.",
  version: "1.0.0-alpha.8",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.MANGA_CHAPTERS,
    SourceIntents.DISCOVER_SECIONS,
    SourceIntents.SETTINGS_UI,
    SourceIntents.MANGA_SEARCH,
  ],
  badges: [],
  developers: [
    {
      name: "nyzzik",
      github: "https://github.com/nyzzik",
    },
  ],
} satisfies SourceInfo;
