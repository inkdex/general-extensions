/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  NavigationRow,
  OAuthButtonRow,
  Section,
  type FormItemElement,
  type ListSectionElement,
} from "@paperback/types";

import { ContentSettingsForm } from "./forms/ContentSettingsForm";
import { DiscoverSettingsForm } from "./forms/DiscoverSettingsForm";
import { GroupBlockForm } from "./forms/GroupBlockForm";
import { LibraryMangaListForm } from "./forms/LibraryMangaListForm";
import { SearchSettingsForm } from "./forms/SearchSettingsForm";
import { SessionInfoForm } from "./forms/SessionInfoForm";
import { TrackingSettingsForm } from "./forms/TrackingSettingsForm";
import { UpdateFilterSettingsForm } from "./forms/UpdateFilterSettingsForm";
import { WebsiteSettingsForm } from "./forms/WebsiteSettingsForm";
import { WebsiteStatusForm } from "./forms/WebsiteStatusForm";
import { MDImageQuality, MDLanguages, MDRatings, ROMANIZED_CODES } from "./MangaDexHelper";
import type {
  AccessToken,
  AuthError,
  AuthResponse,
  ScanlationGroupItem,
  TokenBody,
} from "./models";
import { MangaProvider } from "./providers/MangaProvider";
import { State } from "./utils/StateUtil";

// ============================
// Constants & Definitions
// ============================
export const DISCOVER_SECTIONS = {
  SEASONAL: "seasonal",
  LATEST_UPDATES: "latest_updates",
  POPULAR: "popular",
  RECENTLY_ADDED: "recently_Added",
  TAG_SECTIONS: "tag_sections",
};

export const DEFAULT_SECTION_ORDER = [
  DISCOVER_SECTIONS.SEASONAL,
  DISCOVER_SECTIONS.LATEST_UPDATES,
  DISCOVER_SECTIONS.POPULAR,
  DISCOVER_SECTIONS.RECENTLY_ADDED,
  DISCOVER_SECTIONS.TAG_SECTIONS,
];

// ============================
// Discover Section Settings
// ============================
export function getDiscoverSectionOrder(): string[] {
  const savedOrder = Application.getState("discover_section_order") as string[] | undefined;
  if (
    !savedOrder ||
    !Array.isArray(savedOrder) ||
    savedOrder.length < 5 ||
    !savedOrder.includes(DISCOVER_SECTIONS.SEASONAL) ||
    !savedOrder.includes(DISCOVER_SECTIONS.LATEST_UPDATES) ||
    !savedOrder.includes(DISCOVER_SECTIONS.POPULAR) ||
    !savedOrder.includes(DISCOVER_SECTIONS.RECENTLY_ADDED) ||
    !savedOrder.includes(DISCOVER_SECTIONS.TAG_SECTIONS)
  ) {
    return DEFAULT_SECTION_ORDER;
  }
  return savedOrder;
}

export function setDiscoverSectionOrder(order: string[]): void {
  Application.setState(order, "discover_section_order");
}

export function getSeasonalEnabled(): boolean {
  return (Application.getState("seasonal_enabled") as boolean | undefined) ?? true;
}

export function setSeasonalEnabled(enabled: boolean): void {
  Application.setState(enabled, "seasonal_enabled");
}

export function getLatestUpdatesEnabled(): boolean {
  return (Application.getState("latest_updates_enabled") as boolean | undefined) ?? true;
}

export function setLatestUpdatesEnabled(enabled: boolean): void {
  Application.setState(enabled, "latest_updates_enabled");
}

export function getPopularEnabled(): boolean {
  return (Application.getState("popular_enabled") as boolean | undefined) ?? true;
}

export function setPopularEnabled(enabled: boolean): void {
  Application.setState(enabled, "popular_enabled");
}

export function getRecentlyAddedEnabled(): boolean {
  return (Application.getState("recently_added_enabled") as boolean | undefined) ?? true;
}

export function setRecentlyAddedEnabled(enabled: boolean): void {
  Application.setState(enabled, "recently_added_enabled");
}

export function getTagSectionsEnabled(): boolean {
  return (Application.getState("tag_sections_enabled") as boolean | undefined) ?? true;
}

export function setTagSectionsEnabled(enabled: boolean): void {
  Application.setState(enabled, "tag_sections_enabled");
}

// ============================
// Content Settings
// ============================
export function getLanguages(): string[] {
  return (Application.getState("languages") as string[] | undefined) ?? MDLanguages.getDefault();
}

// ============================
// Language Priority Settings
// ============================
export function getLanguagePriority(): string[] {
  return (Application.getState("language_priority") as string[] | undefined) ?? getLanguages();
}

export function setLanguagePriority(priority: string[]): void {
  Application.setState(priority, "language_priority");
}

export function getRomanizedPriorityEnabled(): boolean {
  return (Application.getState("romanized_priority_enabled") as boolean | undefined) ?? false;
}

export function setRomanizedPriorityEnabled(enabled: boolean): void {
  Application.setState(enabled, "romanized_priority_enabled");
}

/**
 * Returns the effective language list for title/description resolution.
 * If romanized priority is enabled, prepends romanized codes (ja-ro, ko-ro, zh-ro).
 * Uses language_priority order (or falls back to getLanguages()).
 */
export function getTitleLanguages(): string[] {
  const priority = getLanguagePriority();
  if (!getRomanizedPriorityEnabled()) return priority;

  const romanized: string[] = [...ROMANIZED_CODES];
  const deduped = [...romanized, ...priority.filter((code) => !romanized.includes(code))];
  return deduped;
}

// ============================
// Native Title Display Settings
// ============================
export function getNativeTitleDisplay(): string {
  return (Application.getState("native_title_display") as string | undefined) ?? "none";
}

export function setNativeTitleDisplay(display: string): void {
  Application.setState(display, "native_title_display");
}

export function getRatings(): string[] {
  return (Application.getState("ratings") as string[] | undefined) ?? MDRatings.getDefault();
}

export function getDataSaver(): boolean {
  return (Application.getState("data_saver") as boolean | undefined) ?? false;
}

export function getForcePort443(): boolean {
  return (Application.getState("force_port_443") as boolean | undefined) ?? false;
}

export function getSkipSameChapter(): boolean {
  return (Application.getState("skip_same_chapter") as boolean | undefined) ?? false;
}

export function getUpdateBatchSize(): number {
  return (Application.getState("update_batch_size") as number | undefined) ?? 100;
}

export function setUpdateBatchSize(size: number): void {
  Application.setState(size, "update_batch_size");
}

export function getCustomCoversEnabled(): boolean {
  return (Application.getState("custom_covers_enabled") as boolean | undefined) ?? false;
}

export function setCustomCoversEnabled(enabled: boolean): void {
  Application.setState(enabled, "custom_covers_enabled");
}

export function getCoverArtworkEnabled(): boolean {
  return (Application.getState("cover_artwork_enabled") as boolean | undefined) ?? false;
}

export function setCoverArtworkEnabled(enabled: boolean): void {
  Application.setState(enabled, "cover_artwork_enabled");
}

export function getCropImagesEnabled(): boolean {
  return (Application.getState("crop_images_enabled") as boolean | undefined) ?? false;
}

export function saveCropImagesEnabled(enabled: boolean): void {
  Application.setState(enabled, "crop_images_enabled");
}

// ============================
// Authentication & User Settings
// ============================
export function getAccessToken(): AccessToken | undefined {
  const accessToken = Application.getSecureState("access_token") as string | undefined;
  const refreshToken = Application.getSecureState("refresh_token") as string | undefined;

  if (!accessToken) return undefined;

  return {
    accessToken,
    refreshToken,
    tokenBody: parseAccessToken(accessToken),
  };
}

export function saveAccessToken(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): AccessToken | undefined {
  Application.setSecureState(accessToken, "access_token");
  Application.setSecureState(refreshToken, "refresh_token");

  if (!accessToken) return undefined;

  return {
    accessToken,
    refreshToken,
    tokenBody: parseAccessToken(accessToken),
  };
}

function parseAccessToken(accessToken: string): TokenBody {
  const tokenBodyBase64 = accessToken.split(".")[1];
  if (!tokenBodyBase64) throw new Error("Invalid access token format");

  const tokenBodyJSON = Application.base64Decode(tokenBodyBase64);
  return JSON.parse(tokenBodyJSON as string) as TokenBody;
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

  if (response.status > 399) {
    throw new Error(`Request failed with status code: ${response.status}`);
  }

  const data = Application.arrayBufferToUTF8String(buffer);
  const json = JSON.parse(data) as AuthResponse | AuthError;

  if ("error" in json) {
    throw new Error(`Auth failed: ${json.error}: ${json.error_description || ""}`);
  }

  return json;
}

const authRequestCache: Record<string, Promise<AuthResponse>> = {};

export function authEndpointRequest(payload: string): Promise<AuthResponse> {
  const cacheKey = payload;
  if (!(cacheKey in authRequestCache)) {
    authRequestCache[cacheKey] = _authEndpointRequest(payload).finally(() => {
      delete authRequestCache[cacheKey];
    });
  }
  return authRequestCache[cacheKey];
}

// ============================
// Display Settings
// ============================
export function getDiscoverThumbnail(): string {
  return (
    (Application.getState("discover_thumbnail") as string | undefined) ??
    MDImageQuality.getDefault("discover")
  );
}

export function getSearchThumbnail(): string {
  return (
    (Application.getState("search_thumbnail") as string | undefined) ??
    MDImageQuality.getDefault("search")
  );
}

export function getMangaThumbnail(): string {
  return (
    (Application.getState("manga_thumbnail") as string | undefined) ??
    MDImageQuality.getDefault("manga")
  );
}

export function getShowStatusIcons(): boolean {
  return (Application.getState("show_status_icons") as boolean | undefined) ?? false;
}

export function setShowStatusIcons(enabled: boolean): void {
  Application.setState(enabled, "show_status_icons");
}

export function getShowRatingIcons(): boolean {
  return (Application.getState("show_content_rating_icons") as boolean | undefined) ?? false;
}

export function setShowRatingIcons(enabled: boolean): void {
  Application.setState(enabled, "show_content_rating_icons");
}

export function getShowVolume(): boolean {
  return (Application.getState("show_volume_in_subtitle") as boolean | undefined) ?? true;
}

export function setShowVolume(enabled: boolean): void {
  Application.setState(enabled, "show_volume_in_subtitle");
}

export function getShowChapter(): boolean {
  return (Application.getState("show_chapter_in_subtitle") as boolean | undefined) ?? true;
}

export function setShowChapter(enabled: boolean): void {
  Application.setState(enabled, "show_chapter_in_subtitle");
}

export function getShowSearchRatingInSubtitle(): boolean {
  return (Application.getState("show_search_rating_subtitle") as boolean | undefined) ?? false;
}

export function setShowSearchRatingInSubtitle(enabled: boolean): void {
  Application.setState(enabled, "show_search_rating_subtitle");
}

// ============================
// Group Blocking Settings
// ============================
export function getBlockedGroups(): Record<string, ScanlationGroupItem> {
  return (
    (Application.getState("blocked_groups") as Record<string, ScanlationGroupItem> | undefined) ??
    {}
  );
}

export function saveBlockedGroups(groups: Record<string, ScanlationGroupItem>): void {
  Application.setState(groups, "blocked_groups");
}

export function blockGroup(group: ScanlationGroupItem): void {
  const blockedGroups = getBlockedGroups();
  blockedGroups[group.id] = group;
  saveBlockedGroups(blockedGroups);
}

export function unblockGroup(groupId: string): void {
  const blockedGroups = getBlockedGroups();
  delete blockedGroups[groupId];
  saveBlockedGroups(blockedGroups);
}

export function getGroupBlockingEnabled(): boolean {
  return (Application.getState("group_blocking_enabled") as boolean | undefined) ?? false;
}

export function setGroupBlockingEnabled(enabled: boolean): void {
  Application.setState(enabled, "group_blocking_enabled");
}

export function getFuzzyBlockingEnabled(): boolean {
  return (Application.getState("fuzzy_blocking_enabled") as boolean | undefined) ?? false;
}

export function setFuzzyBlockingEnabled(enabled: boolean): void {
  Application.setState(enabled, "fuzzy_blocking_enabled");
}

// ============================
// Update & Tracking Settings
// ============================
export function getOptimizeUpdates(): boolean {
  return (Application.getState("optimize_updates") as boolean | undefined) ?? true;
}

export function setOptimizeUpdates(enabled: boolean): void {
  Application.setState(enabled, "optimize_updates");
}

export function getMetadataUpdater(): boolean {
  return (Application.getState("metadata_updater") as boolean | undefined) ?? false;
}

export function setMetadataUpdater(enabled: boolean): void {
  Application.setState(enabled, "metadata_updater");
}

export function getSkipPublicationStatus(): string[] {
  return (Application.getState("skip_publication_status") as string[] | undefined) ?? [];
}

export function setSkipPublicationStatus(status: string[]): void {
  Application.setState(status, "skip_publication_status");
}

export function getSkipNewChapters(): number {
  const value = Application.getState("skip_new_chapters");
  return typeof value === "number" ? value : 0;
}

export function setSkipNewChapters(chapterAmount: number): void {
  Application.setState(chapterAmount, "skip_new_chapters");
}

export function getSkipUnreadChapters(): number {
  const value = Application.getState("skip_unread_chapters");
  return typeof value === "number" ? value : 0;
}

export function setSkipUnreadChapters(chapterAmount: number): void {
  Application.setState(chapterAmount, "skip_unread_chapters");
}

export function getTrackingEnabled(): boolean {
  return (Application.getState("tracking_enabled") as boolean | undefined) ?? false;
}

export function setTrackingEnabled(enabled: boolean): void {
  Application.setState(enabled, "tracking_enabled");
}

export function getMangaProgressEnabled(): boolean {
  return (Application.getState("manga_progress_enabled") as boolean | undefined) ?? false;
}

export function setMangaProgressEnabled(enabled: boolean): void {
  Application.setState(enabled, "manga_progress_enabled");
}

export function getTrackingContentRatings(): string[] {
  return (
    (Application.getState("tracking_content_ratings") as string[] | undefined) ??
    MDRatings.getDefault()
  );
}

export function setTrackingContentRatings(ratings: string[]): void {
  Application.setState(ratings, "tracking_content_ratings");
}

// ============================
// Search Settings
// ============================
export function getRelevanceScoringEnabled(): boolean {
  return (Application.getState("relevance_scoring_enabled") as boolean | undefined) ?? true;
}

export function setRelevanceScoringEnabled(enabled: boolean): void {
  Application.setState(enabled, "relevance_scoring_enabled");
}

export function getChapterPreloadingEnabled(): boolean {
  return (Application.getState("chapter_preloading_enabled") as boolean | undefined) ?? false;
}

export function setChapterPreloadingEnabled(enabled: boolean): void {
  Application.setState(enabled, "chapter_preloading_enabled");
}

// ============================
// Cover Selection Settings
// ============================
export interface CustomCoverInfo {
  id: string;
  fileName: string;
}

export function getSelectedCover(mangaId: string): CustomCoverInfo | undefined {
  const covers = Application.getState("selected_covers") as
    | Record<string, CustomCoverInfo>
    | undefined;
  return covers?.[mangaId];
}

export function setSelectedCover(mangaId: string, coverId: string, fileName: string): void {
  const covers = (Application.getState("selected_covers") as Record<string, CustomCoverInfo>) || {};
  covers[mangaId] = { id: coverId, fileName: fileName };
  Application.setState(covers, "selected_covers");
}

export function removeSelectedCover(mangaId: string): void {
  const covers = (Application.getState("selected_covers") as Record<string, CustomCoverInfo>) || {};
  if (covers[mangaId]) {
    delete covers[mangaId];
    Application.setState(covers, "selected_covers");
  }
}

// ============================
// Settings Form Class
// ============================
export class MangaDexSettingsForm extends Form {
  private languagesState = new State<string[]>(this, "languages", getLanguages());
  private ratingsState = new State<string[]>(this, "ratings", getRatings());
  private dataSaverState = new State<boolean>(this, "data_saver", getDataSaver());
  private skipSameChapterState = new State<boolean>(
    this,
    "skip_same_chapter",
    getSkipSameChapter(),
  );
  private forcePortState = new State<boolean>(this, "force_port_443", getForcePort443());
  private oAuthState = new State<boolean>(this, "oauth_state", !!getAccessToken());

  private discoverThumbState = new State<string>(
    this,
    "discover_thumbnail",
    getDiscoverThumbnail(),
  );
  private searchThumbState = new State<string>(this, "search_thumbnail", getSearchThumbnail());
  private mangaThumbState = new State<string>(this, "manga_thumbnail", getMangaThumbnail());

  private resetState = new State<boolean>(this, "reset_trigger", false);

  private blockedGroupsState = new State<Record<string, ScanlationGroupItem>>(
    this,
    "blocked_groups",
    getBlockedGroups(),
  );

  public getOAuthState(): {
    value: boolean;
    updateValue: (value: boolean) => Promise<void>;
  } {
    return this.oAuthState;
  }

  override getSections() {
    const sections = [this.createMainSettingsSection()];

    if (this.oAuthState.value) {
      sections.push(
        Section("librarySection", [
          NavigationRow("library_manga", {
            title: "My Library",
            subtitle: "View and manage your MangaDex library",
            form: new LibraryMangaListForm(new MangaProvider()),
          }),
        ]),
      );
    }

    sections.push(this.createResetSection());

    return sections;
  }

  private createMainSettingsSection(): ListSectionElement {
    return Section("mainSettings", [
      NavigationRow("mangadex_settings", {
        title: "MangaDex Website Settings",
        form: this.createMangaDexSettingsForm(),
      }),
      NavigationRow("discover_settings", {
        title: "Home Settings",
        form: this.createDiscoverSettingsForm(),
      }),
      NavigationRow("content_settings", {
        title: "Content Settings",
        form: this.createDetailedContentSettingsForm(),
      }),
      NavigationRow("search_settings", {
        title: "Search Settings",
        form: this.createSearchSettingsForm(),
      }),
      NavigationRow("tracking_settings", {
        title: "Tracking Settings",
        form: this.createTrackingSettingsForm(),
      }),
      NavigationRow("update_filter_settings", {
        title: "Update Settings",
        form: this.createUpdateFilterSettingsForm(),
      }),
      NavigationRow("group_block_settings", {
        title: "Scanlation Group Block Settings",
        form: this.createGroupBlockForm(),
      }),
    ]);
  }

  private createMangaDexSettingsForm(): Form {
    return new WebsiteSettingsForm(
      this.oAuthState,
      () => this.createSessionInfoForm(),
      () => this.createLoginButton(),
      () => this.createWebsiteStatusForm(),
    );
  }

  private createDiscoverSettingsForm(): Form {
    return new DiscoverSettingsForm();
  }

  private createDetailedContentSettingsForm(): Form {
    return new ContentSettingsForm();
  }

  private createUpdateFilterSettingsForm(): Form {
    return new UpdateFilterSettingsForm();
  }

  private createSearchSettingsForm(): Form {
    return new SearchSettingsForm();
  }

  private createTrackingSettingsForm(): Form {
    return new TrackingSettingsForm();
  }

  private createGroupBlockForm(): Form {
    return new GroupBlockForm(async (groups) => {
      await this.blockedGroupsState.updateValue(groups);
    });
  }

  private createWebsiteStatusForm(): Form {
    return new WebsiteStatusForm();
  }

  private createSessionInfoForm(): Form {
    return new SessionInfoForm(this.getOAuthState());
  }

  private createLoginButton(): FormItemElement<unknown> {
    return OAuthButtonRow("oAuthButton", {
      title: "Login with MangaDex",
      authorizeEndpoint: "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/auth",
      clientId: "paperback",
      redirectUri: "paperback://mangadex-login",
      responseType: {
        type: "pkce",
        pkceCodeLength: 64,
        pkceCodeMethod: "S256",
        formEncodeGrant: true,
        tokenEndpoint: "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
      },
      onSuccess: Application.Selector(this as MangaDexSettingsForm, "handleOAuthSuccess"),
    });
  }

  private createResetSection(): ListSectionElement {
    return Section("reset_section", [
      ButtonRow("reset_settings", {
        title: "Reset to Defaults",
        onSelect: Application.Selector(this as MangaDexSettingsForm, "handleResetSettings"),
      }),
    ]);
  }

  async handleDiscoverThumbChange(value: string[]): Promise<void> {
    await this.discoverThumbState.updateValue(value[0]);
  }

  async handleSearchThumbChange(value: string[]): Promise<void> {
    await this.searchThumbState.updateValue(value[0]);
  }

  async handleMangaThumbChange(value: string[]): Promise<void> {
    await this.mangaThumbState.updateValue(value[0]);
  }

  async handleOAuthSuccess(accessToken: string, refreshToken: string): Promise<void> {
    saveAccessToken(accessToken, refreshToken);
    await this.oAuthState.updateValue(true);
    this.reloadForm();
  }

  async handleResetSettings(): Promise<void> {
    setLanguagePriority(MDLanguages.getDefault());
    setRomanizedPriorityEnabled(false);
    setNativeTitleDisplay("none");

    await Promise.all([
      this.languagesState.updateValue(MDLanguages.getDefault()),
      this.ratingsState.updateValue(MDRatings.getDefault()),
      this.dataSaverState.updateValue(false),
      this.skipSameChapterState.updateValue(false),
      this.discoverThumbState.updateValue(MDImageQuality.getDefault("discover")),
      this.searchThumbState.updateValue(MDImageQuality.getDefault("search")),
      this.mangaThumbState.updateValue(MDImageQuality.getDefault("manga")),
      this.forcePortState.updateValue(false),
      this.blockedGroupsState.updateValue({}),
    ]);

    await this.resetState.updateValue(!this.resetState.value);
  }
}
