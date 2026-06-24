/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { OptionItem, SearchFiltersMeta, SortableListItem, FlameFilter } from "../models";

/**
 * Converts any UTF-8 string into a valid ID.
 *
 * Allowed characters:
 * A-Z a-z 0-9 . _ - @ ( ) [ ] % ? # + = / & :
 *
 * Examples:
 *   "action"        -> "action"
 *   "hello world"   -> "hello%20world"
 *   "école"         -> "%C3%A9cole"
 *   "你好"           -> "%E4%BD%A0%E5%A5%BD"
 */
export function textToId(text: string): string {
  return encodeURIComponent(text).replace(
    /[!'()*~]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

/**
 * Restores the original UTF-8 text.
 */
export function idToText(id: string): string {
  return decodeURIComponent(id);
}

export function textToOptionItem(text: string): OptionItem {
  return {
    id: textToId(text),
    value: text,
  };
}

export function generateSearchTagsLists(
  searchCandidates: SortableListItem[],
  initialFilters: SearchFiltersMeta,
): FlameFilter {
  let categoriesSet = new Set<string>([]);
  let publisherSet = new Set<string>([]);
  let authorSet = new Set<string>([]);
  let artistSet = new Set<string>([]);
  let languageSet = new Set<string>([]);
  let countrySet = new Set<string>([]);

  searchCandidates.forEach((candidat) => {
    if (candidat.categories?.length > 0) {
      candidat.categories.forEach((c) => categoriesSet.add(c));
    }
    if (candidat.publisher?.length > 0) {
      candidat.publisher.forEach((p) => publisherSet.add(p));
    }
    if (candidat.author?.length > 0) {
      candidat.author.forEach((a) => authorSet.add(a));
    }
    if (candidat.artist?.length > 0) {
      candidat.artist.forEach((a) => artistSet.add(a));
    }
    if (candidat.language?.length > 0) {
      languageSet.add(candidat.language);
    }
    if (candidat.country?.length > 0) {
      countrySet.add(candidat.country);
    }
  });

  return {
    categories: [...categoriesSet].map(textToOptionItem),
    types: initialFilters?.types.filter((t) => t != "all").map(textToOptionItem),
    publisher: [...publisherSet].map(textToOptionItem),
    status: initialFilters?.status.filter((t) => t != "all").map(textToOptionItem),
    author: [...authorSet].map(textToOptionItem),
    artist: [...artistSet].map(textToOptionItem),
    year: initialFilters?.year.filter((t) => t != "all").map(textToOptionItem),
    language: [...languageSet].map(textToOptionItem),
    country: [...countrySet].map(textToOptionItem),
  };
}
