/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, Section, ToggleRow, type FormSectionElement } from "@paperback/types";

import { RATINGS, STATUSES } from "../../shared/lookups";
import {
  getRelevanceScoringEnabled,
  getShowChapter,
  getShowRatingIcons,
  getShowSearchRatingInSubtitle,
  getShowStatusIcons,
  getShowVolume,
  setRelevanceScoringEnabled,
  setShowChapter,
  setShowRatingIcons,
  setShowSearchRatingInSubtitle,
  setShowStatusIcons,
  setShowVolume,
} from "../../shared/state";
import { forceRefreshTags } from "../../shared/tags";

const STATUS_ICON_LEGEND = STATUSES.filter((s) => s.searchable)
  .map((s) => `${s.icon} ${s.name}`)
  .join(", ");
const RATING_ICON_LEGEND = RATINGS.map((r) => `${r.icon} ${r.shortName}`).join(", ");

export class SearchSettingsForm extends Form {
  private refreshStatus: string = "";
  private isRefreshing: boolean = false;

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section(
        {
          id: "tag_cache",
          footer: this.refreshStatus,
        },
        [
          ButtonRow("refresh_tags", {
            title: "Refresh Tags",
            onSelect: Application.Selector(this as SearchSettingsForm, "handleRefreshTags"),
          }),
        ],
      ),
      Section("sorting", [
        ToggleRow("relevance_scoring_enabled", {
          title: "Relevance Scoring",
          subtitle: "Sort results by smarter title match",
          value: getRelevanceScoringEnabled(),
          onValueChange: Application.Selector(
            this as SearchSettingsForm,
            "handleRelevanceScoringChange",
          ),
        }),
      ]),
      Section("subtitle_content", [
        ToggleRow("show_volume_in_subtitle", {
          title: "Show Volume",
          subtitle: "May be inaccurate",
          value: getShowVolume(),
          onValueChange: Application.Selector(this as SearchSettingsForm, "handleVolumeChange"),
        }),
        ToggleRow("show_chapter_in_subtitle", {
          title: "Show Chapter",
          subtitle: "May be inaccurate",
          value: getShowChapter(),
          onValueChange: Application.Selector(this as SearchSettingsForm, "handleChapterChange"),
        }),
        ToggleRow("show_search_rating_subtitle", {
          title: "Show Rating",
          subtitle: "Adds average rating but slower loading",
          value: getShowSearchRatingInSubtitle(),
          onValueChange: Application.Selector(
            this as SearchSettingsForm,
            "handleShowSearchRatingSubtitleChange",
          ),
        }),
      ]),
      Section("subtitle_icons", [
        ToggleRow("show_status_icons", {
          title: "Show Status Icons",
          subtitle: STATUS_ICON_LEGEND,
          value: getShowStatusIcons(),
          onValueChange: Application.Selector(
            this as SearchSettingsForm,
            "handleStatusIconsChange",
          ),
        }),
        ToggleRow("show_content_rating_icons", {
          title: "Show Rating Icons",
          subtitle: RATING_ICON_LEGEND,
          value: getShowRatingIcons(),
          onValueChange: Application.Selector(
            this as SearchSettingsForm,
            "handleRatingIconsChange",
          ),
        }),
      ]),
    ];
  }

  async handleVolumeChange(value: boolean): Promise<void> {
    setShowVolume(value);
  }

  async handleChapterChange(value: boolean): Promise<void> {
    setShowChapter(value);
  }

  async handleStatusIconsChange(value: boolean): Promise<void> {
    setShowStatusIcons(value);
  }

  async handleRatingIconsChange(value: boolean): Promise<void> {
    setShowRatingIcons(value);
  }

  async handleRelevanceScoringChange(value: boolean): Promise<void> {
    setRelevanceScoringEnabled(value);
  }

  async handleShowSearchRatingSubtitleChange(value: boolean): Promise<void> {
    setShowSearchRatingInSubtitle(value);
  }

  async handleRefreshTags(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.refreshStatus = "Refreshing...";
    this.reloadForm();
    try {
      const cache = await forceRefreshTags();
      this.refreshStatus = `Refreshed ${cache.tags.length} tags`;
      // Refresh discover so the tag based rows rebuild from the new cache.
      Application.invalidateDiscoverSections();
    } catch (error) {
      this.refreshStatus = `Refresh failed: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      this.isRefreshing = false;
      this.reloadForm();
    }
  }
}
