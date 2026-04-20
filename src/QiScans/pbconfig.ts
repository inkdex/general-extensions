/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ExtensionInfo } from "@paperback/types";
import { ContentRating, SourceIntents } from "@paperback/types";

export default {
  name: "QiScans",
  description: "Extension that pulls content from qimanhwa.com.",
  version: "1.0.0-alpha.12",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities: [
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
    SourceIntents.DISCOVER_SECTION_PROVIDING,
    SourceIntents.CHAPTER_PROVIDING,
    SourceIntents.SEARCH_RESULT_PROVIDING,
  ],
  badges: [],
  developers: [
    {
      name: "Lucifers Circle",
    },
  ],
} satisfies ExtensionInfo;
