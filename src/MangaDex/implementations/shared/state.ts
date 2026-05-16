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
import { MANGADEX_AUTH_TOKEN_URL } from "./models";
import { parseJSONBody } from "./utils";

// ===== Constants =====

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

// Bump when adding a new section so old saved orders reset.
const DISCOVER_SECTION_ORDER_SCHEMA = 2;
const THUMBNAIL_QUALITY_SCHEMA = 1;

// ===== Generic state helpers =====

// Copy so callers that splice or push cannot mutate persisted state.
function readStringArray(key: string, fallback: () => string[]): string[] {
  const stored = Application.getState(key) as unknown;
  return Array.isArray(stored) ? (stored as string[]).slice() : fallback();
}

function getKey<T extends boolean | string | number>(key: string, defaultValue: T): T {
  const value = Application.getState(key);
  if (typeof value !== typeof defaultValue) return defaultValue;
  if (typeof defaultValue === "number" && !Number.isFinite(value)) return defaultValue;
  return value as T;
}
function setKey<T>(key: string, value: T): void {
  Application.setState(value, key);
}

// ===== Discover sections =====

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

  // Drop unknown ids and append any newly added sections.
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

export const getPopularEnabled = (): boolean => getKey("popular_enabled", true);
export const setPopularEnabled = (v: boolean): void => setKey("popular_enabled", v);
export const getLatestUpdatesEnabled = (): boolean => getKey("latest_updates_enabled", true);
export const setLatestUpdatesEnabled = (v: boolean): void => setKey("latest_updates_enabled", v);
export const getRecommendedEnabled = (): boolean => getKey("recommended_enabled", true);
export const setRecommendedEnabled = (v: boolean): void => setKey("recommended_enabled", v);
export const getSelfPublishedEnabled = (): boolean => getKey("self_published_enabled", true);
export const setSelfPublishedEnabled = (v: boolean): void => setKey("self_published_enabled", v);
export const getSeasonalEnabled = (): boolean => getKey("seasonal_enabled", true);
export const setSeasonalEnabled = (v: boolean): void => setKey("seasonal_enabled", v);
export const getRecentlyAddedEnabled = (): boolean => getKey("recently_added_enabled", true);
export const setRecentlyAddedEnabled = (v: boolean): void => setKey("recently_added_enabled", v);

// Carousel type values are kept as the strings the Paperback runtime expects
// instead of importing DiscoverSectionType here
export interface DiscoverSectionDefinition {
  id: string;
  title: string;
  type: "prominentCarousel" | "chapterUpdates" | "simpleCarousel" | "featured";
  getEnabled: () => boolean;
  setEnabled: (value: boolean) => void;
}

// Single source of truth for the six discover sections. Used by the
// discover provider (titles + types) and the settings form (titles + toggles).
export const SECTION_DEFINITIONS: readonly DiscoverSectionDefinition[] = [
  {
    id: DISCOVER_SECTIONS.POPULAR,
    title: "Popular New Titles",
    type: "prominentCarousel",
    getEnabled: getPopularEnabled,
    setEnabled: setPopularEnabled,
  },
  {
    id: DISCOVER_SECTIONS.LATEST_UPDATES,
    title: "Latest Updates",
    type: "chapterUpdates",
    getEnabled: getLatestUpdatesEnabled,
    setEnabled: setLatestUpdatesEnabled,
  },
  {
    id: DISCOVER_SECTIONS.RECOMMENDED,
    title: "Recommended",
    type: "simpleCarousel",
    getEnabled: getRecommendedEnabled,
    setEnabled: setRecommendedEnabled,
  },
  {
    id: DISCOVER_SECTIONS.SELF_PUBLISHED,
    title: "Self-Published",
    type: "simpleCarousel",
    getEnabled: getSelfPublishedEnabled,
    setEnabled: setSelfPublishedEnabled,
  },
  {
    id: DISCOVER_SECTIONS.SEASONAL,
    title: "Seasonal",
    type: "featured",
    getEnabled: getSeasonalEnabled,
    setEnabled: setSeasonalEnabled,
  },
  {
    id: DISCOVER_SECTIONS.RECENTLY_ADDED,
    title: "Recently Added",
    type: "simpleCarousel",
    getEnabled: getRecentlyAddedEnabled,
    setEnabled: setRecentlyAddedEnabled,
  },
];

// ===== Languages and title display =====

export const getLanguages = (): string[] =>
  readStringArray("languages", () => MDLanguages.getDefault());
export const setLanguages = (v: string[]): void => setKey("languages", v);
export const getLanguagePriority = (): string[] =>
  readStringArray("language_priority", getLanguages);
export const setLanguagePriority = (v: string[]): void => setKey("language_priority", v);
export const getRomanizedPriorityEnabled = (): boolean =>
  getKey("romanized_priority_enabled", false);
export const setRomanizedPriorityEnabled = (v: boolean): void =>
  setKey("romanized_priority_enabled", v);

// Prepends the romanized codes when romanized priority is enabled.
export function getTitleLanguages(): string[] {
  const priority = getLanguagePriority();
  if (!getRomanizedPriorityEnabled()) return priority;
  const romanized = new Set<string>(ROMANIZED_CODES);
  return [...ROMANIZED_CODES, ...priority.filter((code) => !romanized.has(code))];
}

export const getNativeTitleDisplay = (): string => getKey("native_title_display", "none");
export const setNativeTitleDisplay = (v: string): void => setKey("native_title_display", v);

// ===== Content rating and chapter behavior =====

export const getRatings = (): string[] => readStringArray("ratings", () => getDefaultRatings());
export const setRatings = (v: string[]): void => setKey("ratings", v);
export const getDataSaver = (): boolean => getKey("data_saver", false);
export const setDataSaver = (v: boolean): void => setKey("data_saver", v);
export const getForcePort443 = (): boolean => getKey("force_port_443", false);
export const setForcePort443 = (v: boolean): void => setKey("force_port_443", v);
export const getSkipSameChapter = (): boolean => getKey("skip_same_chapter", false);
export const setSkipSameChapter = (v: boolean): void => setKey("skip_same_chapter", v);
export const getIncludeUnavailable = (): boolean => getKey("include_unavailable", false);
export const setIncludeUnavailable = (v: boolean): void => setKey("include_unavailable", v);

// ===== Synopsis and cover preferences =====

export const getShowAltTitlesInSynopsis = (): boolean =>
  getKey("show_alt_titles_in_synopsis", false);
export const setShowAltTitlesInSynopsis = (v: boolean): void =>
  setKey("show_alt_titles_in_synopsis", v);
export const getShowFinalChapterInSynopsis = (): boolean =>
  getKey("show_final_chapter_in_synopsis", false);
export const setShowFinalChapterInSynopsis = (v: boolean): void =>
  setKey("show_final_chapter_in_synopsis", v);
export const getTryFirstVolumeCover = (): boolean => getKey("try_first_volume_cover", false);
export const setTryFirstVolumeCover = (v: boolean): void => setKey("try_first_volume_cover", v);

// ===== Thumbnail quality =====

let stateMigrationsRan = false;

// Called once from initialise() so thumbnail getters do not pay the
// per call schema check on every search/discover render.
export function runStateMigrations(): void {
  if (stateMigrationsRan) return;
  const schema = Application.getState("thumbnail_quality_schema") as number | undefined;
  if (schema !== THUMBNAIL_QUALITY_SCHEMA) {
    for (const key of ["discover_thumbnail", "search_thumbnail"]) {
      if (Application.getState(key) === "source") {
        Application.setState(undefined, key);
      }
    }
    Application.setState(THUMBNAIL_QUALITY_SCHEMA, "thumbnail_quality_schema");
  }
  stateMigrationsRan = true;
}

export const getDiscoverThumbnail = (): string =>
  getKey("discover_thumbnail", getDefaultImageQuality("discover"));
export const setDiscoverThumbnail = (v: string): void => setKey("discover_thumbnail", v);
export const getSearchThumbnail = (): string =>
  getKey("search_thumbnail", getDefaultImageQuality("search"));
export const setSearchThumbnail = (v: string): void => setKey("search_thumbnail", v);
export const getMangaThumbnail = (): string =>
  getKey("manga_thumbnail", getDefaultImageQuality("manga"));
export const setMangaThumbnail = (v: string): void => setKey("manga_thumbnail", v);

// ===== Search subtitle display =====

export const getShowStatusIcons = (): boolean => getKey("show_status_icons", false);
export const setShowStatusIcons = (v: boolean): void => setKey("show_status_icons", v);
export const getShowRatingIcons = (): boolean => getKey("show_content_rating_icons", false);
export const setShowRatingIcons = (v: boolean): void => setKey("show_content_rating_icons", v);
export const getShowVolume = (): boolean => getKey("show_volume_in_subtitle", true);
export const setShowVolume = (v: boolean): void => setKey("show_volume_in_subtitle", v);
export const getShowChapter = (): boolean => getKey("show_chapter_in_subtitle", true);
export const setShowChapter = (v: boolean): void => setKey("show_chapter_in_subtitle", v);
export const getShowSearchRatingInSubtitle = (): boolean =>
  getKey("show_search_rating_subtitle", false);
export const setShowSearchRatingInSubtitle = (v: boolean): void =>
  setKey("show_search_rating_subtitle", v);
export const getRelevanceScoringEnabled = (): boolean => getKey("relevance_scoring_enabled", true);
export const setRelevanceScoringEnabled = (v: boolean): void =>
  setKey("relevance_scoring_enabled", v);

// ===== Scanlation group and uploader blocking =====

export function getBlockedGroups(): Record<string, ScanlationGroupItem> {
  const stored = Application.getState("blocked_groups") as unknown;
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    return {};
  }
  // Shallow copy so form handlers cannot mutate persisted state.
  return { ...(stored as Record<string, ScanlationGroupItem>) };
}

export const saveBlockedGroups = (v: Record<string, ScanlationGroupItem>): void =>
  setKey("blocked_groups", v);
export const getGroupBlockingEnabled = (): boolean => getKey("group_blocking_enabled", false);
export const setGroupBlockingEnabled = (v: boolean): void => setKey("group_blocking_enabled", v);
export const getFuzzyBlockingEnabled = (): boolean => getKey("fuzzy_blocking_enabled", false);
export const setFuzzyBlockingEnabled = (v: boolean): void => setKey("fuzzy_blocking_enabled", v);
export const getBlockedUploaders = (): string[] => readStringArray("blocked_uploaders", () => []);
export const setBlockedUploaders = (v: string[]): void => setKey("blocked_uploaders", v);

// ===== Library update behavior =====

export function getUpdateBatchSize(): number {
  // Default 100. Reject any value that is not a positive integer. An older typeof check
  // let NaN through and produced limit=NaN on the wire.
  const stored = Application.getState("update_batch_size") as unknown;
  if (typeof stored !== "number" || !Number.isInteger(stored) || stored < 1) return 100;
  return Math.min(stored, 100);
}

export function setUpdateBatchSize(size: number): void {
  // Clamp at the write boundary. The getter's clamp is a safety net
  // since the UI only exposes 25, 50, 75, and 100.
  const clamped = !Number.isInteger(size) || size < 1 ? 100 : Math.min(size, 100);
  Application.setState(clamped, "update_batch_size");
}

export const getOptimizeUpdates = (): boolean => getKey("optimize_updates", true);
export const setOptimizeUpdates = (v: boolean): void => setKey("optimize_updates", v);
export const getMetadataUpdater = (): boolean => getKey("metadata_updater", false);
export const setMetadataUpdater = (v: boolean): void => setKey("metadata_updater", v);
export const getSkipPublicationStatus = (): string[] =>
  readStringArray("skip_publication_status", () => []);
export const setSkipPublicationStatus = (v: string[]): void => setKey("skip_publication_status", v);
export const getSkipNewChapters = (): number => getKey("skip_new_chapters", 0);
export const setSkipNewChapters = (v: number): void => setKey("skip_new_chapters", v);
export const getSkipUnreadChapters = (): number => getKey("skip_unread_chapters", 0);
export const setSkipUnreadChapters = (v: number): void => setKey("skip_unread_chapters", v);

// ===== Reset =====

// Every owned settings key. Reset clears these so the getter fallbacks above
// become the single source of truth for default values. Auth tokens, schema
// markers, and the tag cache are excluded (they reset via their own paths).
const SETTINGS_KEYS: readonly string[] = [
  "discover_section_order",
  "popular_enabled",
  "latest_updates_enabled",
  "recommended_enabled",
  "self_published_enabled",
  "seasonal_enabled",
  "recently_added_enabled",
  "languages",
  "language_priority",
  "romanized_priority_enabled",
  "native_title_display",
  "ratings",
  "data_saver",
  "force_port_443",
  "skip_same_chapter",
  "include_unavailable",
  "show_alt_titles_in_synopsis",
  "show_final_chapter_in_synopsis",
  "try_first_volume_cover",
  "discover_thumbnail",
  "search_thumbnail",
  "manga_thumbnail",
  "show_status_icons",
  "show_content_rating_icons",
  "show_volume_in_subtitle",
  "show_chapter_in_subtitle",
  "show_search_rating_subtitle",
  "relevance_scoring_enabled",
  "blocked_groups",
  "group_blocking_enabled",
  "fuzzy_blocking_enabled",
  "blocked_uploaders",
  "update_batch_size",
  "optimize_updates",
  "metadata_updater",
  "skip_publication_status",
  "skip_new_chapters",
  "skip_unread_chapters",
];

export function resetAllSettings(): void {
  for (const key of SETTINGS_KEYS) {
    Application.setState(undefined, key);
  }
}

// ===== OAuth tokens and auth requests =====

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

// Decode segment 2 of a JWT into its body claims. Returns null on any
// shape error so callers do not have to wrap every read in try/catch.
export function readJwtBody(token: string): TokenBody | null {
  try {
    const tokenBodyBase64 = token.split(".")[1];
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

// MangaDex/Keycloak invalidation shapes. Force-logout decisions must
// agree across the interceptor and the session-info form
export function isAuthInvalidError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /status code: 40[01]/.test(msg) || /invalid_grant|invalid_token/i.test(msg);
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
  const parsed = readJwtBody(accessToken);
  if (!parsed) {
    // Stored token is unparseable. Clear and treat as logged out
    // rather than throwing on every call site.
    return saveAccessToken(undefined, undefined);
  }
  if (parsed.typ === "Refresh") {
    // The slots are swapped: the access slot holds a Refresh JWT
    const refreshParsed = refreshToken ? readJwtBody(refreshToken) : null;
    if (refreshParsed && refreshParsed.typ !== "Refresh") {
      return saveAccessToken(refreshToken, accessToken);
    }
    return saveAccessToken(undefined, undefined);
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

  const parsed = readJwtBody(accessToken);
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

const authRequestCache: Record<string, Promise<AuthResponse>> = {};

async function _authEndpointRequest(payload: string): Promise<AuthResponse> {
  const [response, buffer] = await Application.scheduleRequest({
    method: "POST",
    url: MANGADEX_AUTH_TOKEN_URL,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: [
      `refresh_token=${encodeURIComponent(payload)}`,
      "client_id=paperback",
      "grant_type=refresh_token",
    ].join("&"),
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

export function authEndpointRequest(payload: string): Promise<AuthResponse> {
  if (!(payload in authRequestCache)) {
    authRequestCache[payload] = _authEndpointRequest(payload).finally(() => {
      delete authRequestCache[payload];
    });
  }
  return authRequestCache[payload];
}

export type RefreshOutcome =
  | { kind: "rotated"; token: AccessToken }
  | { kind: "racedRotation"; token: AccessToken }
  | { kind: "racedLogout" }
  | { kind: "loggedOut" }
  | { kind: "transient"; message: string };

// Refresh against MangaDex's auth endpoint, handle parallel rotation /
// logout, persist the new tokens, and force-logout only on real 4xx auth failures
export async function refreshSession(originalRefreshToken: string): Promise<RefreshOutcome> {
  try {
    const response = await authEndpointRequest(originalRefreshToken);
    const currentTokens = getAccessToken();
    if (currentTokens?.refreshToken !== originalRefreshToken) {
      if (!currentTokens) return { kind: "racedLogout" };
      return { kind: "racedRotation", token: currentTokens };
    }
    const saved = saveAccessToken(response.access_token, response.refresh_token);
    if (!saved) {
      // Malformed body. saveAccessToken already cleared the session.
      return { kind: "loggedOut" };
    }
    return { kind: "rotated", token: saved };
  } catch (e: unknown) {
    const currentTokens = getAccessToken();
    if (currentTokens?.refreshToken !== originalRefreshToken) {
      if (!currentTokens) return { kind: "racedLogout" };
      return { kind: "racedRotation", token: currentTokens };
    }
    if (isAuthInvalidError(e)) {
      saveAccessToken(undefined, undefined);
      return { kind: "loggedOut" };
    }
    return { kind: "transient", message: e instanceof Error ? e.message : String(e) };
  }
}
