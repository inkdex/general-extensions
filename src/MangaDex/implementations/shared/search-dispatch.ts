/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { UUID_FRAGMENT } from "./legacy";

// "author" intentionally covers both authors and artists via MangaDex's
// combined authorOrArtist field. Use the advanced filters to distinguish.
export type SearchPrefix = "id" | "ch" | "grp" | "usr" | "author" | "list";

export interface DispatchedSearch {
  prefix: SearchPrefix;
  uuid: string;
}

const URL_PATH_TO_PREFIX: Record<string, SearchPrefix> = {
  title: "id",
  chapter: "ch",
  group: "grp",
  author: "author",
  user: "usr",
  list: "list",
};

// The patterns already require a valid v4 UUID, so callers do not need
// to re-check the captured group.
const URL_PATTERN = new RegExp(
  `mangadex\\.org\\/(title|chapter|group|author|user|list)\\/(${UUID_FRAGMENT})`,
  "i",
);
const PREFIX_PATTERN = new RegExp(`^(id|ch|grp|usr|author|list):\\s*(${UUID_FRAGMENT})`, "i");
const LEGACY_URL_PATTERN = /mangadex\.org\/(title|chapter)\/(\d+)/i;
const LEGACY_PREFIX_PATTERN = /^(id|ch):\s*(\d+)\s*$/i;

export function dispatchSearch(rawTitle: string | undefined): DispatchedSearch | undefined {
  const trimmed = rawTitle?.trim();
  if (!trimmed) return undefined;

  const urlMatch = trimmed.match(URL_PATTERN);
  if (urlMatch) {
    return {
      prefix: URL_PATH_TO_PREFIX[urlMatch[1].toLowerCase()],
      uuid: urlMatch[2].toLowerCase(),
    };
  }

  const prefixMatch = trimmed.match(PREFIX_PATTERN);
  if (prefixMatch) {
    return {
      prefix: prefixMatch[1].toLowerCase() as SearchPrefix,
      uuid: prefixMatch[2].toLowerCase(),
    };
  }

  const legacyUrlMatch = trimmed.match(LEGACY_URL_PATTERN);
  if (legacyUrlMatch) {
    return {
      prefix: URL_PATH_TO_PREFIX[legacyUrlMatch[1].toLowerCase()],
      uuid: legacyUrlMatch[2],
    };
  }

  const legacyPrefixMatch = trimmed.match(LEGACY_PREFIX_PATTERN);
  if (legacyPrefixMatch) {
    return {
      prefix: legacyPrefixMatch[1].toLowerCase() as SearchPrefix,
      uuid: legacyPrefixMatch[2],
    };
  }

  return undefined;
}
