/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "MangaDex",
  description: "Extension that pulls content from mangadex.org.",
  version: "1.0.0-alpha.25",
  icon: "icon.png",
  languages: "multi",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.MANAGED_COLLECTION_PROVIDING,
    SourceIntents.PROGRESS_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Inkdex",
      website: "https://inkdex.github.io",
      github: "https://github.com/inkdex",
    },
  ],
} as ExtensionInfo;
