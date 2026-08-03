/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { AtsuContentRating } from "./models";
import type { AtsuMangaPageResponse } from "./models";

export function parseContentRating(isAdult: boolean, rating?: AtsuContentRating): ContentRating {
  if (
    isAdult ||
    rating === AtsuContentRating.Erotica ||
    rating === AtsuContentRating.Pornographic
  ) {
    return ContentRating.ADULT;
  }
  if (rating === AtsuContentRating.Suggestive) return ContentRating.MATURE;
  return ContentRating.EVERYONE;
}

export function parseMangaPage(html: string): AtsuMangaPageResponse["mangaPage"] {
  const match = html.match(/window\.mangaPage\s*=\s*({[\s\S]*?});/);
  if (!match) {
    throw new Error("Could not find manga data in page");
  }
  return (JSON.parse(match[1]) as AtsuMangaPageResponse).mangaPage;
}
