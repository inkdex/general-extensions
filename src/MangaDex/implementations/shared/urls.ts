/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { URL } from "@paperback/types";

import { MANGADEX_API } from "./models";

// URL builders return URL objects so callers can chain .setQueryItem (e.g. search tag modes).

// /manga (list)

export interface MangaListUrlOptions {
  limit: number;
  offset?: number;
  ratings: readonly string[];
  // managed-collection omits this on purpose so saved manga show
  // up regardless of the user's current language settings.
  languages?: readonly string[];
  includes?: readonly string[];
  hasAvailableChapters?: boolean;
  // Full key, e.g. "order[followedCount]". Pair with orderValue.
  orderKey?: string;
  orderValue?: "asc" | "desc";
  ids?: readonly string[];
}

export function buildMangaListUrl(opts: MangaListUrlOptions): URL {
  const url = new URL(MANGADEX_API)
    .addPathComponent("manga")
    .setQueryItem("limit", opts.limit.toString())
    .setQueryItem("contentRating[]", opts.ratings as string[]);
  if (opts.languages && opts.languages.length > 0) {
    url.setQueryItem("availableTranslatedLanguage[]", opts.languages as string[]);
  }
  if (opts.offset !== undefined) {
    url.setQueryItem("offset", opts.offset.toString());
  }
  if (opts.includes && opts.includes.length > 0) {
    url.setQueryItem("includes[]", opts.includes as string[]);
  }
  if (opts.hasAvailableChapters) {
    url.setQueryItem("hasAvailableChapters", "true");
  }
  if (opts.orderKey && opts.orderValue) {
    url.setQueryItem(opts.orderKey, opts.orderValue);
  }
  if (opts.ids && opts.ids.length > 0) {
    url.setQueryItem("ids[]", opts.ids as string[]);
  }
  return url;
}

// /manga/{id}

export function buildMangaByIdUrl(mangaId: string, includes?: readonly string[]): URL {
  const url = new URL(MANGADEX_API).addPathComponent("manga").addPathComponent(mangaId);
  if (includes && includes.length > 0) {
    url.setQueryItem("includes[]", includes as string[]);
  }
  return url;
}

// /manga/{id}/feed

export interface MangaFeedUrlOptions {
  mangaId: string;
  offset: number;
  includes: readonly string[];
  blockedGroups: readonly string[];
  ratings: readonly string[];
  languages: readonly string[];
  publishAtSince: string | undefined;
}

// limit=500 matches MangaDex's page cap. Order and
// includeFutureUpdates=0 are fixed.
export function buildMangaFeedUrl(opts: MangaFeedUrlOptions): URL {
  const url = new URL(MANGADEX_API)
    .addPathComponent("manga")
    .addPathComponent(opts.mangaId)
    .addPathComponent("feed")
    .setQueryItem("limit", "500")
    .setQueryItem("offset", opts.offset.toString())
    .setQueryItem("includes[]", opts.includes as string[])
    .setQueryItem("excludedGroups[]", opts.blockedGroups as string[])
    .setQueryItem("order[volume]", "desc")
    .setQueryItem("order[chapter]", "desc")
    .setQueryItem("order[createdAt]", "desc")
    .setQueryItem("contentRating[]", opts.ratings as string[])
    .setQueryItem("translatedLanguage[]", opts.languages as string[])
    // includeFutureUpdates defaults to "1". Scheduled chapters would
    // then fail at /at-home/server/{id} on tap.
    .setQueryItem("includeFutureUpdates", "0");
  if (opts.publishAtSince) {
    url.setQueryItem("publishAtSince", opts.publishAtSince);
  }
  return url;
}

// /manga/status (read) and /manga/{id}/status (write)

export function buildMangaStatusListUrl(): URL {
  return new URL(MANGADEX_API).addPathComponent("manga").addPathComponent("status");
}

export function buildMangaStatusWriteUrl(mangaId: string): URL {
  return new URL(MANGADEX_API)
    .addPathComponent("manga")
    .addPathComponent(mangaId)
    .addPathComponent("status");
}

// /chapter (batch by id)

export interface ChapterBatchUrlOptions {
  chapterIds: readonly string[];
  languages: readonly string[];
  ratings: readonly string[];
  // Defaults to "1". Subtitle callers pass "0" to exclude chapters scheduled but not yet released.
  includeFutureUpdates?: boolean;
}

export function buildChapterBatchUrl(opts: ChapterBatchUrlOptions): URL {
  return new URL(MANGADEX_API)
    .addPathComponent("chapter")
    .setQueryItem("ids[]", opts.chapterIds as string[])
    .setQueryItem("limit", opts.chapterIds.length.toString())
    .setQueryItem("translatedLanguage[]", opts.languages as string[])
    .setQueryItem("contentRating[]", opts.ratings as string[])
    .setQueryItem("includeFutureUpdates", opts.includeFutureUpdates ? "1" : "0");
}

// /chapter (latest by language, used by Latest Updates)

export interface LatestChaptersUrlOptions {
  limit: number;
  offset: number;
  languages: readonly string[];
  ratings: readonly string[];
}

export function buildLatestChaptersUrl(opts: LatestChaptersUrlOptions): URL {
  return new URL(MANGADEX_API)
    .addPathComponent("chapter")
    .setQueryItem("limit", opts.limit.toString())
    .setQueryItem("offset", opts.offset.toString())
    .setQueryItem("translatedLanguage[]", opts.languages as string[])
    .setQueryItem("contentRating[]", opts.ratings as string[])
    .setQueryItem("order[readableAt]", "desc")
    .setQueryItem("includeFutureUpdates", "0");
}

// /at-home/server/{chapterId}

// Returns a string instead of a URL so the optional forcePort443
// query parameter can be appended as a raw template segment.
export function buildAtHomeServerUrl(chapterId: string, forcePort443?: boolean): string {
  return `${MANGADEX_API}/at-home/server/${chapterId}${forcePort443 ? "?forcePort443=true" : ""}`;
}

// /statistics/manga

export function buildStatisticsForMangaUrl(mangaId: string): URL {
  return new URL(MANGADEX_API)
    .addPathComponent("statistics")
    .addPathComponent("manga")
    .addPathComponent(mangaId);
}

export function buildStatisticsBatchUrl(mangaIds: readonly string[]): URL {
  return new URL(MANGADEX_API)
    .addPathComponent("statistics")
    .addPathComponent("manga")
    .setQueryItem("manga[]", mangaIds as string[]);
}

// /list/{listId}-

export function buildCustomListUrl(listId: string): string {
  return `${MANGADEX_API}/list/${listId}`;
}

// /user/{userId}/list

export function buildUserListsUrl(userId: string, limit: number): URL {
  return new URL(MANGADEX_API)
    .addPathComponent("user")
    .addPathComponent(userId)
    .addPathComponent("list")
    .setQueryItem("limit", limit.toString());
}

// /legacy/mapping (POST)

export function buildLegacyMappingUrl(): string {
  return `${MANGADEX_API}/legacy/mapping`;
}

// /manga/tag

export function buildTagListUrl(): string {
  return `${MANGADEX_API}/manga/tag`;
}

// /group (search)

export interface GroupSearchUrlOptions {
  limit: number;
  offset: number;
  name?: string;
}

export function buildGroupSearchUrl(opts: GroupSearchUrlOptions): URL {
  const url = new URL(MANGADEX_API)
    .addPathComponent("group")
    .setQueryItem("limit", opts.limit.toString())
    .setQueryItem("offset", opts.offset.toString())
    .setQueryItem("order[name]", "asc");
  if (opts.name && opts.name.trim() !== "") {
    url.setQueryItem("name", opts.name.trim());
  }
  return url;
}
