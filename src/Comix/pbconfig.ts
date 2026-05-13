/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "Comix",
  description: "Extension that pulls content from Comix.to.",
  version: "1.0.0-alpha.24",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Catta1997",
      github: "https://github.com/Catta1997",
    },
  ],
} satisfies ExtensionInfo;
