/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  NavigationRow,
  Section,
  type FormSectionElement,
  type ListSectionElement,
} from "@paperback/types";

import { MDLanguages } from "../../shared/languages";
import { getDefaultImageQuality, getDefaultRatings } from "../../shared/lookups";
import {
  DEFAULT_SECTION_ORDER,
  saveBlockedGroups,
  setCropImagesEnabled,
  setDataSaver,
  setDiscoverSectionOrder,
  setDiscoverThumbnail,
  setForcePort443,
  setFuzzyBlockingEnabled,
  setGroupBlockingEnabled,
  setLanguagePriority,
  setLanguages,
  setLatestUpdatesEnabled,
  setMangaThumbnail,
  setMetadataUpdater,
  setNativeTitleDisplay,
  setOptimizeUpdates,
  setPopularEnabled,
  setRatings,
  setRecentlyAddedEnabled,
  setRecommendedEnabled,
  setRelevanceScoringEnabled,
  setRomanizedPriorityEnabled,
  setSearchThumbnail,
  setSeasonalEnabled,
  setSelfPublishedEnabled,
  setShowChapter,
  setShowRatingIcons,
  setShowSearchRatingInSubtitle,
  setShowStatusIcons,
  setShowVolume,
  setSkipNewChapters,
  setSkipPublicationStatus,
  setSkipSameChapter,
  setSkipUnreadChapters,
  setUpdateBatchSize,
} from "../../shared/state";
import { resetTagCache } from "../../shared/tags";
import { ContentSettingsForm } from "./content-settings";
import { DiscoverSettingsForm } from "./discover-settings";
import { GroupBlockForm } from "./group-block";
import { SearchSettingsForm } from "./search-settings";
import { UpdateFilterSettingsForm } from "./update-filter-settings";
import { WebsiteSettingsForm } from "./website-settings";

export class MangaDexSettingsForm extends Form {
  override getSections(): FormSectionElement<unknown>[] {
    return [this.createMainSettingsSection(), this.createResetSection()];
  }

  private createMainSettingsSection(): ListSectionElement {
    return Section("mainSettings", [
      NavigationRow("mangadex_settings", {
        title: "Account & Status",
        form: new WebsiteSettingsForm(),
      }),
      NavigationRow("discover_settings", {
        title: "Home",
        form: new DiscoverSettingsForm(),
      }),
      NavigationRow("content_settings", {
        title: "Content",
        form: new ContentSettingsForm(),
      }),
      NavigationRow("search_settings", {
        title: "Search",
        form: new SearchSettingsForm(),
      }),
      NavigationRow("update_filter_settings", {
        title: "Updates",
        form: new UpdateFilterSettingsForm(),
      }),
      NavigationRow("group_block_settings", {
        title: "Blocked Groups",
        form: new GroupBlockForm(),
      }),
    ]);
  }

  private createResetSection(): ListSectionElement {
    return Section("reset_section", [
      ButtonRow("reset_settings", {
        title: "Reset All Settings",
        onSelect: Application.Selector(this as MangaDexSettingsForm, "handleResetSettings"),
      }),
    ]);
  }

  async handleResetSettings(): Promise<void> {
    // Content settings
    setLanguages(MDLanguages.getDefault());
    setLanguagePriority(MDLanguages.getDefault());
    setRomanizedPriorityEnabled(false);
    setNativeTitleDisplay("none");
    setRatings(getDefaultRatings());
    setDataSaver(false);
    setSkipSameChapter(false);
    setForcePort443(false);
    setCropImagesEnabled(false);
    setDiscoverThumbnail(getDefaultImageQuality("discover"));
    setSearchThumbnail(getDefaultImageQuality("search"));
    setMangaThumbnail(getDefaultImageQuality("manga"));

    // Search subtitle settings
    setShowVolume(true);
    setShowChapter(true);
    setShowSearchRatingInSubtitle(false);
    setShowStatusIcons(false);
    setShowRatingIcons(false);
    setRelevanceScoringEnabled(true);

    // Discover section order and section visibility
    setDiscoverSectionOrder([...DEFAULT_SECTION_ORDER]);
    setPopularEnabled(true);
    setLatestUpdatesEnabled(true);
    setRecommendedEnabled(true);
    setSelfPublishedEnabled(true);
    setSeasonalEnabled(true);
    setRecentlyAddedEnabled(true);

    // Update flow settings
    setOptimizeUpdates(true);
    setMetadataUpdater(false);
    setSkipPublicationStatus([]);
    setSkipNewChapters(0);
    setSkipUnreadChapters(0);
    setUpdateBatchSize(100);

    // Group blocking
    setGroupBlockingEnabled(false);
    setFuzzyBlockingEnabled(false);
    saveBlockedGroups({});

    // Derived caches. Clearing the tag cache here prevents a user who
    // reset because tags looked broken from waiting 30 days.
    resetTagCache();
    Application.invalidateDiscoverSections();

    this.reloadForm();
  }
}
