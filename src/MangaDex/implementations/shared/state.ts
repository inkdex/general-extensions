/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { MDLanguages } from "./languages";
import { getDefaultImageQuality, getDefaultRatings, ROMANIZED_CODES } from "./lookups";
import type {
  AccessToken,
  AuthError,
  AuthResponse,
  ScanlationGroupItem,
  TokenBody,
} from "./models";
import { parseJSONBody } from "./utils";

export const DISCOVER_SECTIONS = {
  POPULAR: "popular",
  LATEST_UPDATES: "latest_updates",
  RECOMMENDED: "recommended",
  SELF_PUBLISHED: "self_published",
  SEASONAL: "seasonal",
  RECENTLY_ADDED: "recently_added",
};

// Order mirrors the MangaDex website homepage.
export const DEFAULT_SECTION_ORDER = [
  DISCOVER_SECTIONS.POPULAR,
  DISCOVER_SECTIONS.LATEST_UPDATES,
  DISCOVER_SECTIONS.RECOMMENDED,
  DISCOVER_SECTIONS.SELF_PUBLISHED,
  DISCOVER_SECTIONS.SEASONAL,
  DISCOVER_SECTIONS.RECENTLY_ADDED,
];

// Ensures old orders and settings get reset if a new one is added
const DISCOVER_SECTION_ORDER_SCHEMA = 2;
const THUMBNAIL_QUALITY_SCHEMA = 1;

// getState returns the persisted reference, so copy and callers that
// splice or push cannot mutate stored state.
function readStringArray(key: string, fallback: () => string[]): string[] {
  const stored = Application.getState(key) as unknown;
  return Array.isArray(stored) ? (stored as string[]).slice() : fallback();
}

function getBool(key: string, defaultValue: boolean): boolean {
  return (Application.getState(key) as boolean | undefined) ?? defaultValue;
}
function getString(key: string, defaultValue: string): string {
  return (Application.getState(key) as string | undefined) ?? defaultValue;
}
function getNumber(key: string, defaultValue: number): number {
  const value = Application.getState(key);
  return typeof value === "number" ? value : defaultValue;
}
function setKey<T>(key: string, value: T): void {
  Application.setState(value, key);
}

export function getDiscoverSectionOrder(): string[] {
  const savedSchema = Application.getState("discover_section_order_schema") as number | undefined;
  if (savedSchema !== DISCOVER_SECTION_ORDER_SCHEMA) {
    Application.setState(undefined, "discover_section_order");
    Application.setState(DISCOVER_SECTION_ORDER_SCHEMA, "discover_section_order_schema");
    return DEFAULT_SECTION_ORDER.slice();
  }

  const rawOrder = Application.getState("discover_section_order") as string[] | undefined;
  if (!rawOrder || !Array.isArray(rawOrder)) {
    return DEFAULT_SECTION_ORDER.slice();
  }

  // Drop unknown ids and append any newly added sections
  const validIds = new Set(DEFAULT_SECTION_ORDER);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of rawOrder) {
    if (validIds.has(id) && !seen.has(id)) {
      result.push(id);
      seen.add(id);
    }
  }
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!seen.has(id)) result.push(id);
  }

  const changed = result.length !== rawOrder.length || result.some((id, i) => id !== rawOrder[i]);
  if (changed) {
    Application.setState(result, "discover_section_order");
  }
  return result;
}

export function setDiscoverSectionOrder(order: string[]): void {
  Application.setState(order, "discover_section_order");
  Application.setState(DISCOVER_SECTION_ORDER_SCHEMA, "discover_section_order_schema");
}

export const getSeasonalEnabled = (): boolean => getBool("seasonal_enabled", true);
export const setSeasonalEnabled = (v: boolean): void => setKey("seasonal_enabled", v);
export const getLatestUpdatesEnabled = (): boolean => getBool("latest_updates_enabled", true);
export const setLatestUpdatesEnabled = (v: boolean): void => setKey("latest_updates_enabled", v);
export const getPopularEnabled = (): boolean => getBool("popular_enabled", true);
export const setPopularEnabled = (v: boolean): void => setKey("popular_enabled", v);
export const getRecentlyAddedEnabled = (): boolean => getBool("recently_added_enabled", true);
export const setRecentlyAddedEnabled = (v: boolean): void => setKey("recently_added_enabled", v);
export const getRecommendedEnabled = (): boolean => getBool("recommended_enabled", true);
export const setRecommendedEnabled = (v: boolean): void => setKey("recommended_enabled", v);
export const getSelfPublishedEnabled = (): boolean => getBool("self_published_enabled", true);
export const setSelfPublishedEnabled = (v: boolean): void => setKey("self_published_enabled", v);

export const getLanguages = (): string[] =>
  readStringArray("languages", () => MDLanguages.getDefault());
export const setLanguages = (v: string[]): void => setKey("languages", v);
export const getLanguagePriority = (): string[] =>
  readStringArray("language_priority", getLanguages);
export const setLanguagePriority = (v: string[]): void => setKey("language_priority", v);
export const getRomanizedPriorityEnabled = (): boolean =>
  getBool("romanized_priority_enabled", false);
export const setRomanizedPriorityEnabled = (v: boolean): void =>
  setKey("romanized_priority_enabled", v);

// Language list for title and description resolution. Prepends the
// romanized codes when the user has romanized priority enabled.
export function getTitleLanguages(): string[] {
  const priority = getLanguagePriority();
  if (!getRomanizedPriorityEnabled()) return priority;
  const romanized = new Set<string>(ROMANIZED_CODES);
  return [...ROMANIZED_CODES, ...priority.filter((code) => !romanized.has(code))];
}

export const getNativeTitleDisplay = (): string => getString("native_title_display", "none");
export const setNativeTitleDisplay = (v: string): void => setKey("native_title_display", v);
export const getRatings = (): string[] => readStringArray("ratings", () => getDefaultRatings());
export const setRatings = (v: string[]): void => setKey("ratings", v);
export const getDataSaver = (): boolean => getBool("data_saver", false);
export const setDataSaver = (v: boolean): void => setKey("data_saver", v);
export const getForcePort443 = (): boolean => getBool("force_port_443", false);
export const setForcePort443 = (v: boolean): void => setKey("force_port_443", v);
export const getSkipSameChapter = (): boolean => getBool("skip_same_chapter", false);
export const setSkipSameChapter = (v: boolean): void => setKey("skip_same_chapter", v);

export function getUpdateBatchSize(): number {
  // Default 100. Reject any value that is not a positive integer. An older typeof check
  // let NaN through and produced limit=NaN on the wire.
  const stored = Application.getState("update_batch_size") as unknown;
  if (typeof stored !== "number" || !Number.isInteger(stored) || stored < 1) return 100;
  return Math.min(stored, 100);
}

export function setUpdateBatchSize(size: number): void {
  // Clamp at the write boundary. The getter's clamp is then just a
  // safety net since the UI only exposes 25, 50, 75, and 100.
  const clamped = !Number.isInteger(size) || size < 1 ? 100 : Math.min(size, 100);
  Application.setState(clamped, "update_batch_size");
}

// setCropImagesEnabled is the sole writer.
let cropImagesEnabledCache: boolean | undefined;
export function getCropImagesEnabled(): boolean {
  if (cropImagesEnabledCache !== undefined) return cropImagesEnabledCache;
  const value = (Application.getState("crop_images_enabled") as boolean | undefined) ?? false;
  cropImagesEnabledCache = value;
  return value;
}

export function setCropImagesEnabled(enabled: boolean): void {
  Application.setState(enabled, "crop_images_enabled");
  cropImagesEnabledCache = enabled;
}

// cacheValid distinguishes "cached logout" from "uninitialized".
let cachedTokenResult: AccessToken | undefined = undefined;
let cacheValid = false;

// JWT bodies are base64url, but Application.base64Decode wants standard base64.
function canonicalizeBase64Url(s: string): string {
  let canonical = s.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (canonical.length % 4)) % 4;
  if (padLen > 0) canonical += "=".repeat(padLen);
  return canonical;
}

function tryParseAccessToken(accessToken: string): TokenBody | null {
  try {
    const tokenBodyBase64 = accessToken.split(".")[1];
    if (!tokenBodyBase64) return null;
    const tokenBodyJSON = Application.base64Decode(canonicalizeBase64Url(tokenBodyBase64));
    if (typeof tokenBodyJSON !== "string" || tokenBodyJSON.trimStart().charAt(0) !== "{") {
      return null;
    }
    return JSON.parse(tokenBodyJSON) as TokenBody;
  } catch {
    return null;
  }
}

export function getAccessToken(): AccessToken | undefined {
  // Cache hit. saveAccessToken keeps secure state and the cache
  // consistent because it is the only writer to either.
  if (cacheValid) return cachedTokenResult;

  // The orphan refresh probe heals secure state that the host left half cleared after a crash.
  const accessToken = Application.getSecureState("access_token") as string | undefined;
  if (!accessToken) {
    const orphan = Application.getSecureState("refresh_token") as string | undefined;
    if (orphan) Application.setSecureState(undefined, "refresh_token");
    cachedTokenResult = undefined;
    cacheValid = true;
    return undefined;
  }

  const refreshToken = Application.getSecureState("refresh_token") as string | undefined;
  const parsed = tryParseAccessToken(accessToken);
  if (!parsed) {
    // Stored token is unparseable. Clear and treat as logged out
    // rather than throwing on every call site.
    return saveAccessToken(undefined, undefined);
  }
  if (parsed.typ === "Refresh" && refreshToken) {
    return saveAccessToken(refreshToken, accessToken);
  }
  cachedTokenResult = { accessToken, refreshToken, tokenBody: parsed };
  cacheValid = true;
  return cachedTokenResult;
}

export function saveAccessToken(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): AccessToken | undefined {
  // Parse before persisting. An unparseable save would desync cache from secure state.
  if (!accessToken) {
    Application.setSecureState(undefined, "access_token");
    Application.setSecureState(undefined, "refresh_token");
    cachedTokenResult = undefined;
    cacheValid = true;
    return undefined;
  }

  const parsed = tryParseAccessToken(accessToken);
  if (!parsed) {
    Application.setSecureState(undefined, "access_token");
    Application.setSecureState(undefined, "refresh_token");
    cachedTokenResult = undefined;
    cacheValid = true;
    return undefined;
  }
  Application.setSecureState(accessToken, "access_token");
  Application.setSecureState(refreshToken, "refresh_token");
  cachedTokenResult = { accessToken, refreshToken, tokenBody: parsed };
  cacheValid = true;
  return cachedTokenResult;
}

async function _authEndpointRequest(payload: string): Promise<AuthResponse> {
  const [response, buffer] = await Application.scheduleRequest({
    method: "POST",
    url: `https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token`,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: {
      refresh_token: payload,
      client_id: "paperback",
      grant_type: "refresh_token",
    },
  });

  // Parse even on 4xx so Keycloak's invalid_grant/invalid_token surface to callers.
  const data = Application.arrayBufferToUTF8String(buffer);
  let json: AuthResponse | AuthError | undefined;
  try {
    json = parseJSONBody<AuthResponse | AuthError>(data, response.status);
  } catch {
    // Non JSON body (HTML 5xx or CDN block). The status branch
    // handles it.
  }

  if (response.status >= 400) {
    if (json && "error" in json) {
      throw new Error(
        `Auth failed: ${json.error}: ${json.error_description || ""} (status code: ${response.status})`,
      );
    }
    throw new Error(`Request failed with status code: ${response.status}`);
  }

  if (!json) {
    throw new Error(`Unexpected non JSON auth response (status ${response.status})`);
  }

  if ("error" in json) {
    throw new Error(`Auth failed: ${json.error}: ${json.error_description || ""}`);
  }

  return json;
}

const authRequestCache: Record<string, Promise<AuthResponse>> = {};

export function authEndpointRequest(payload: string): Promise<AuthResponse> {
  if (!(payload in authRequestCache)) {
    authRequestCache[payload] = _authEndpointRequest(payload).finally(() => {
      delete authRequestCache[payload];
    });
  }
  return authRequestCache[payload];
}

let thumbnailQualityMigrated = false;
function migrateThumbnailQualityIfNeeded(): void {
  if (thumbnailQualityMigrated) return;
  const schema = Application.getState("thumbnail_quality_schema") as number | undefined;
  if (schema !== THUMBNAIL_QUALITY_SCHEMA) {
    for (const key of ["discover_thumbnail", "search_thumbnail"]) {
      if (Application.getState(key) === "source") {
        Application.setState(undefined, key);
      }
    }
    Application.setState(THUMBNAIL_QUALITY_SCHEMA, "thumbnail_quality_schema");
  }
  thumbnailQualityMigrated = true;
}

export const getDiscoverThumbnail = (): string => {
  migrateThumbnailQualityIfNeeded();
  return getString("discover_thumbnail", getDefaultImageQuality("discover"));
};
export const setDiscoverThumbnail = (v: string): void => setKey("discover_thumbnail", v);
export const getSearchThumbnail = (): string => {
  migrateThumbnailQualityIfNeeded();
  return getString("search_thumbnail", getDefaultImageQuality("search"));
};
export const setSearchThumbnail = (v: string): void => setKey("search_thumbnail", v);
export const getMangaThumbnail = (): string =>
  getString("manga_thumbnail", getDefaultImageQuality("manga"));
export const setMangaThumbnail = (v: string): void => setKey("manga_thumbnail", v);
export const getShowStatusIcons = (): boolean => getBool("show_status_icons", false);
export const setShowStatusIcons = (v: boolean): void => setKey("show_status_icons", v);
export const getShowRatingIcons = (): boolean => getBool("show_content_rating_icons", false);
export const setShowRatingIcons = (v: boolean): void => setKey("show_content_rating_icons", v);
export const getShowVolume = (): boolean => getBool("show_volume_in_subtitle", true);
export const setShowVolume = (v: boolean): void => setKey("show_volume_in_subtitle", v);
export const getShowChapter = (): boolean => getBool("show_chapter_in_subtitle", true);
export const setShowChapter = (v: boolean): void => setKey("show_chapter_in_subtitle", v);
export const getShowSearchRatingInSubtitle = (): boolean =>
  getBool("show_search_rating_subtitle", false);
export const setShowSearchRatingInSubtitle = (v: boolean): void =>
  setKey("show_search_rating_subtitle", v);

export function getBlockedGroups(): Record<string, ScanlationGroupItem> {
  const stored = Application.getState("blocked_groups") as unknown;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return {};
  }
  // Shallow copy so form handlers cannot mutate persisted state
  // through a shared reference.
  return { ...(stored as Record<string, ScanlationGroupItem>) };
}

export const saveBlockedGroups = (v: Record<string, ScanlationGroupItem>): void =>
  setKey("blocked_groups", v);
export const getGroupBlockingEnabled = (): boolean => getBool("group_blocking_enabled", false);
export const setGroupBlockingEnabled = (v: boolean): void => setKey("group_blocking_enabled", v);
export const getFuzzyBlockingEnabled = (): boolean => getBool("fuzzy_blocking_enabled", false);
export const setFuzzyBlockingEnabled = (v: boolean): void => setKey("fuzzy_blocking_enabled", v);
export const getOptimizeUpdates = (): boolean => getBool("optimize_updates", true);
export const setOptimizeUpdates = (v: boolean): void => setKey("optimize_updates", v);
export const getMetadataUpdater = (): boolean => getBool("metadata_updater", false);
export const setMetadataUpdater = (v: boolean): void => setKey("metadata_updater", v);
export const getSkipPublicationStatus = (): string[] =>
  readStringArray("skip_publication_status", () => []);
export const setSkipPublicationStatus = (v: string[]): void => setKey("skip_publication_status", v);
export const getSkipNewChapters = (): number => getNumber("skip_new_chapters", 0);
export const setSkipNewChapters = (v: number): void => setKey("skip_new_chapters", v);
export const getSkipUnreadChapters = (): number => getNumber("skip_unread_chapters", 0);
export const setSkipUnreadChapters = (v: number): void => setKey("skip_unread_chapters", v);
export const getRelevanceScoringEnabled = (): boolean => getBool("relevance_scoring_enabled", true);
export const setRelevanceScoringEnabled = (v: boolean): void =>
  setKey("relevance_scoring_enabled", v);
