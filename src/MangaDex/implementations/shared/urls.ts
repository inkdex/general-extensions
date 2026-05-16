/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { URL } from "@paperback/types";

import { MANGADEX_API } from "./models";

// URL builders return URL objects so callers can chain .setQueryItem (e.g. search tag modes).

// An empty array would otherwise serialize as a noisy "key[]=" with no value.
function setIfNonEmpty(url: URL, key: string, values: readonly string[] | undefined): void {
  if (values && values.length > 0) {
    url.setQueryItem(key, values as string[]);
  }
}

// /manga (list)

export interface MangaListUrlOptions {
  limit: number;
  offset?: number;
  ratings: readonly string[];
  // managed-collection omits this on purpose so saved manga show
  // up regardless of the user's current language settings.
  languages?: readonly string[];
  // Defaults to ["cover_art"] when omitted. Pass [] to fetch no relationships
  // (the chapter-providing update probe relies on this).
  includes?: readonly string[];
  // Omits when false. Explicit "false" would invert the filter.
  hasAvailableChapters?: boolean;
  // Full key, e.g. "order[followedCount]". Pair with orderValue.
  orderKey?: string;
  orderValue?: "asc" | "desc";
  ids?: readonly string[];
  demographics?: readonly string[];
  statuses?: readonly string[];
  originalLanguages?: readonly string[];
  year?: number;
  authorOrArtist?: string;
  group?: string;
}

export function buildMangaListUrl(opts: MangaListUrlOptions): URL {
  const url = new URL(MANGADEX_API)
    .addPathComponent("manga")
    .setQueryItem("limit", opts.limit.toString())
    .setQueryItem("contentRating[]", opts.ratings as string[]);
  setIfNonEmpty(url, "availableTranslatedLanguage[]", opts.languages);
  setIfNonEmpty(url, "includes[]", opts.includes ?? ["cover_art"]);
  setIfNonEmpty(url, "ids[]", opts.ids);
  setIfNonEmpty(url, "publicationDemographic[]", opts.demographics);
  setIfNonEmpty(url, "status[]", opts.statuses);
  setIfNonEmpty(url, "originalLanguage[]", opts.originalLanguages);
  if (opts.offset !== undefined) {
    url.setQueryItem("offset", opts.offset.toString());
  }
  if (opts.hasAvailableChapters) {
    url.setQueryItem("hasAvailableChapters", "true");
  }
  if (opts.orderKey && opts.orderValue) {
    url.setQueryItem(opts.orderKey, opts.orderValue);
  }
  if (opts.year !== undefined) {
    url.setQueryItem("year", opts.year.toString());
  }
  if (opts.authorOrArtist) {
    url.setQueryItem("authorOrArtist", opts.authorOrArtist);
  }
  if (opts.group) {
    url.setQueryItem("group", opts.group);
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
  blockedUploaders?: readonly string[];
  ratings: readonly string[];
  languages: readonly string[];
  publishAtSince: string | undefined;
  // Triggers all three include* params (isUnavailable, pages=0, externalUrl).
  includeUnavailable?: boolean;
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
    // Chapter is primary so volume-tagged chapters in feeds with mostly null volumes
    // don't drop to the bottom. MangaDex respects the order in which keys appear.
    .setQueryItem("order[chapter]", "desc")
    .setQueryItem("order[volume]", "desc")
    .setQueryItem("order[createdAt]", "desc")
    .setQueryItem("contentRating[]", opts.ratings as string[])
    .setQueryItem("translatedLanguage[]", opts.languages as string[])
    // includeFutureUpdates defaults to "1". Scheduled chapters would
    // then fail at /at-home/server/{id} on tap.
    .setQueryItem("includeFutureUpdates", "0");
  setIfNonEmpty(url, "excludedUploaders[]", opts.blockedUploaders);
  if (opts.publishAtSince) {
    url.setQueryItem("publishAtSince", opts.publishAtSince);
  }
  if (opts.includeUnavailable) {
    url.setQueryItem("includeUnavailable", "1");
    url.setQueryItem("includeEmptyPages", "1");
    url.setQueryItem("includeExternalUrl", "1");
  }
  return url;
}

// /manga/{id}/aggregate

export function buildMangaAggregateUrl(
  mangaId: string,
  translatedLanguages?: readonly string[],
): URL {
  const url = new URL(MANGADEX_API)
    .addPathComponent("manga")
    .addPathComponent(mangaId)
    .addPathComponent("aggregate");
  setIfNonEmpty(url, "translatedLanguage[]", translatedLanguages);
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
  // Omitted sends "0" to exclude chapters scheduled but not yet released.
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

// /chapter (latest by language, used by Latest Updates and uploader browse)

export interface LatestChaptersUrlOptions {
  limit: number;
  offset: number;
  languages: readonly string[];
  ratings: readonly string[];
  uploaders?: readonly string[];
  excludedUploaders?: readonly string[];
  includes?: readonly string[];
}

export function buildLatestChaptersUrl(opts: LatestChaptersUrlOptions): URL {
  const url = new URL(MANGADEX_API)
    .addPathComponent("chapter")
    .setQueryItem("limit", opts.limit.toString())
    .setQueryItem("offset", opts.offset.toString())
    .setQueryItem("translatedLanguage[]", opts.languages as string[])
    .setQueryItem("contentRating[]", opts.ratings as string[])
    .setQueryItem("order[readableAt]", "desc")
    .setQueryItem("includeFutureUpdates", "0");
  setIfNonEmpty(url, "uploader[]", opts.uploaders);
  setIfNonEmpty(url, "excludedUploaders[]", opts.excludedUploaders);
  setIfNonEmpty(url, "includes[]", opts.includes);
  return url;
}

// /chapter/{id} (single chapter fetch with optional includes)

export function buildChapterByIdUrl(chapterId: string, includes?: readonly string[]): URL {
  const url = new URL(MANGADEX_API).addPathComponent("chapter").addPathComponent(chapterId);
  setIfNonEmpty(url, "includes[]", includes);
  return url;
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

// /list/{listId}

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

// /cover

export interface CoverSearchUrlOptions {
  mangaId: string;
  limit: number;
  locales?: readonly string[];
  orderVolume?: "asc" | "desc";
}

export function buildCoverSearchUrl(opts: CoverSearchUrlOptions): URL {
  const url = new URL(MANGADEX_API)
    .addPathComponent("cover")
    .setQueryItem("manga[]", [opts.mangaId])
    .setQueryItem("limit", opts.limit.toString())
    .setQueryItem("order[volume]", opts.orderVolume ?? "asc");
  setIfNonEmpty(url, "locales[]", opts.locales);
  return url;
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
