/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, type ExtensionInfo, SourceIntents } from "@paperback/types";

export default {
  name: "Mangaball",
  description: "Extension that pulls content from mangaball.net.",
  version: "1.0.0-alpha.6",
  icon: "icon.png",
  language: "multi",
  contentRating: ContentRating.ADULT,
  capabilities: [
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Karrot",
    },
  ],
} satisfies ExtensionInfo;
