/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form, Section, SelectRow, ToggleRow, type FormSectionElement } from "@paperback/types";
import {
  getMetadataUpdater,
  getOptimizeUpdates,
  getSkipNewChapters,
  getSkipPublicationStatus,
  getSkipUnreadChapters,
  getUpdateBatchSize,
  setMetadataUpdater,
  setOptimizeUpdates,
  setSkipNewChapters,
  setSkipPublicationStatus,
  setSkipUnreadChapters,
  setUpdateBatchSize,
} from "../MangaDexSettings";
import { State } from "../utils/StateUtil";

/**
 * Form for configuring manga update settings
 * Controls how updates are processed and filtered
 */
export class UpdateFilterSettingsForm extends Form {
  // Settings state objects
  private optimizeUpdatesState = new State<boolean>(this, "optimize_updates", getOptimizeUpdates());
  private metadataUpdaterState = new State<boolean>(this, "metadata_updater", getMetadataUpdater());
  private skipPublicationStatusState = new State<string[]>(
    this,
    "skip_publication_status",
    getSkipPublicationStatus(),
  );
  private updateBatchSizeState = new State<number>(this, "update_batch_size", getUpdateBatchSize());
  private skipNewChaptersState = new State<number>(this, "skip_new_chapters", getSkipNewChapters());
  private skipUnreadChaptersState = new State<number>(
    this,
    "skip_unread_chapters",
    getSkipUnreadChapters(),
  );

  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "update_settings",
          footer:
            "Note: These settings do not enable automatic updates. Automatic updates are handled by Paperback itself (if implemented). These settings just affect how updates are managed when they occur.",
        },
        [
          ToggleRow("optimize_updates", {
            title: "Enable Optimized Updates",
            subtitle:
              "Highly recommended for library updates. Batch check for manga with new chapters or metadata and only update those. May miss nuked chapters (dmcad manga).",
            value: this.optimizeUpdatesState.value,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleOptimizeUpdatesChange",
            ),
          }),
          ToggleRow("metadata_updater", {
            title: "Enable Forced Metadata Updater",
            subtitle:
              "Manga details are forcefully updated during chapter updates (opening manga/library updates)",
            value: this.metadataUpdaterState.value,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleMetadataUpdaterChange",
            ),
          }),
          SelectRow("skip_new_chapters", {
            title: "Skip Manga with New Chapters",
            subtitle:
              this.skipNewChaptersState.value > 0
                ? `Skip manga with ${this.skipNewChaptersState.value === 1 ? "1+" : this.skipNewChaptersState.value + "%"} new chapters`
                : "Currently not skipping",
            value: [this.skipNewChaptersState.value.toString()],
            options: [
              { id: "0", title: "Don't Skip" },
              { id: "1", title: "1+ new chapters" },
              { id: "25", title: "25%+ of chapters" },
              { id: "50", title: "50%+ of chapters" },
              { id: "75", title: "75%+ of chapters" },
              { id: "100", title: "100% of chapters" },
            ],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleSkipNewChaptersChange",
            ),
          }),
          SelectRow("skip_unread_chapters", {
            title: "Skip Manga with Unread Chapters",
            subtitle:
              this.skipUnreadChaptersState.value > 0
                ? `Skip manga with ${this.skipUnreadChaptersState.value === 1 ? "1+" : this.skipUnreadChaptersState.value + "%"} unread chapters`
                : "Currently not skipping",
            value: [this.skipUnreadChaptersState.value.toString()],
            options: [
              { id: "0", title: "Don't Skip" },
              { id: "1", title: "1+ unread chapters" },
              { id: "25", title: "25%+ of chapters" },
              { id: "50", title: "50%+ of chapters" },
              { id: "75", title: "75%+ of chapters" },
              { id: "100", title: "100% of chapters" },
            ],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleSkipUnreadChaptersChange",
            ),
          }),
          SelectRow("skip_publication_status", {
            title: "Skip Updates on Publication Status",
            subtitle:
              this.skipPublicationStatusState.value.length > 0
                ? `Skipping: ${this.skipPublicationStatusState.value
                    .map((status) => status.charAt(0).toUpperCase() + status.slice(1))
                    .join(", ")} Manga`
                : "Manga with these publication status will be skipped during updates",
            value: this.skipPublicationStatusState.value,
            options: [
              { id: "ongoing", title: "Ongoing" },
              { id: "completed", title: "Completed" },
              { id: "hiatus", title: "Hiatus" },
              { id: "cancelled", title: "Cancelled" },
            ],
            minItemCount: 0,
            maxItemCount: 4,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleSkipPublicationStatusChange",
            ),
          }),
          SelectRow("update_batch_size", {
            title: "Update Batch Size",
            subtitle: `Processing ${this.updateBatchSizeState.value} manga per batch`,
            value: [this.updateBatchSizeState.value.toString()],
            options: [
              { id: "25", title: "25" },
              { id: "50", title: "50" },
              { id: "75", title: "75" },
              {
                id: "100",
                title: "100",
              },
            ],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleUpdateBatchSizeChange",
            ),
          }),
        ],
      ),
    ];
  }

  // Settings change handlers
  async handleOptimizeUpdatesChange(value: boolean): Promise<void> {
    await this.optimizeUpdatesState.updateValue(value);
    setOptimizeUpdates(value);
    this.reloadForm();
  }

  async handleMetadataUpdaterChange(value: boolean): Promise<void> {
    await this.metadataUpdaterState.updateValue(value);
    setMetadataUpdater(value);
    this.reloadForm();
  }

  async handleSkipPublicationStatusChange(value: string[]): Promise<void> {
    await this.skipPublicationStatusState.updateValue(value);
    setSkipPublicationStatus(value);
    this.reloadForm();
  }

  async handleUpdateBatchSizeChange(value: string[]): Promise<void> {
    const batchSize = parseInt(value[0], 10);
    await this.updateBatchSizeState.updateValue(batchSize);
    setUpdateBatchSize(batchSize);
    this.reloadForm();
  }

  async handleSkipNewChaptersChange(value: string[]): Promise<void> {
    const chapterAmount = value.length ? parseInt(value[0], 10) : 0;
    await this.skipNewChaptersState.updateValue(chapterAmount);
    setSkipNewChapters(chapterAmount);
    this.reloadForm();
  }

  async handleSkipUnreadChaptersChange(value: string[]): Promise<void> {
    const chapterAmount = value.length ? parseInt(value[0], 10) : 0;
    await this.skipUnreadChaptersState.updateValue(chapterAmount);
    setSkipUnreadChapters(chapterAmount);
    this.reloadForm();
  }
}
