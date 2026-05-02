/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "Punk Records",
  description: "Extension that pulls content from punkrecordz.com.",
  version: "1.0.0-alpha.1",
  icon: "icon.png",
  language: "fr",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
    SourceIntents.SETTINGS_FORM_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Finebouche",
      github: "https://github.com/Finebouche",
    },
  ],
} satisfies ExtensionInfo;
