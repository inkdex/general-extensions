import { ContentRating, SourceIntents, type SourceInfo } from "@paperback/types";

export default {
  name: "MangaPlus",
  description: "Extension that pulls content from mangaplus.shueisha.co.jp.",
  version: "1.0.0-alpha.3",
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
      name: "Yves Pa",
      github: "https://github.com/YvesPa",
    },
  ],
} satisfies SourceInfo;
