/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";

export default {
  name: "ComixTo",
  description: "Shim of the Comix extension which pulls content from Comix.to.",
  version: "1.0.0-alpha.1",
  icon: "icon.png",
  language: "en",
  contentRating: ContentRating.EVERYONE,
  capabilities:
    SourceIntents.SETTINGS_FORM_PROVIDING |
    SourceIntents.DISCOVER_SECTION_PROVIDING |
    SourceIntents.SEARCH_RESULT_PROVIDING |
    SourceIntents.CHAPTER_PROVIDING |
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  badges: [],
  developers: [
    {
      name: "Celarye",
      website: "https://celarye.dev",
      github: "https://github.com/celarye",
    },
  ],
} satisfies ExtensionInfo;
