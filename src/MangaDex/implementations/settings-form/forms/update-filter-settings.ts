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
} from "../../shared/state";

const parseSelectInt = (value: string[], fallback: number): number => {
  const parsed = value.length ? parseInt(value[0], 10) : NaN;
  return isNaN(parsed) ? fallback : parsed;
};

const skipCountSubtitle = (count: number, label: string): string =>
  count > 0 ? `Skipping ${count === 1 ? "1+" : count + "%+"} ${label}` : "Off";

export class UpdateFilterSettingsForm extends Form {
  override getSections(): FormSectionElement<unknown>[] {
    const skipNewChapters = getSkipNewChapters();
    const skipUnreadChapters = getSkipUnreadChapters();
    const skipPublicationStatus = getSkipPublicationStatus();
    const updateBatchSize = getUpdateBatchSize();

    return [
      Section(
        {
          id: "update_settings",
          footer: "Affects how Paperback's library updates behave",
        },
        [
          ToggleRow("optimize_updates", {
            title: "Optimized Updates",
            subtitle: "Batch check, only fetch manga with new chapters",
            value: getOptimizeUpdates(),
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleOptimizeUpdatesChange",
            ),
          }),
          ToggleRow("metadata_updater", {
            title: "Auto-Update Metadata",
            subtitle: "Refresh details on open but adds API calls",
            value: getMetadataUpdater(),
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleMetadataUpdaterChange",
            ),
          }),
          SelectRow("skip_new_chapters", {
            title: "Skip by New Chapters",
            subtitle: skipCountSubtitle(skipNewChapters, "new"),
            value: [skipNewChapters.toString()],
            options: [
              { id: "0", title: "Don't Skip" },
              { id: "1", title: "1+ new" },
              { id: "25", title: "25%+" },
              { id: "50", title: "50%+" },
              { id: "75", title: "75%+" },
              { id: "100", title: "100%" },
            ],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleSkipNewChaptersChange",
            ),
          }),
          SelectRow("skip_unread_chapters", {
            title: "Skip by Unread Chapters",
            subtitle: skipCountSubtitle(skipUnreadChapters, "unread"),
            value: [skipUnreadChapters.toString()],
            options: [
              { id: "0", title: "Don't Skip" },
              { id: "1", title: "1+ unread" },
              { id: "25", title: "25%+" },
              { id: "50", title: "50%+" },
              { id: "75", title: "75%+" },
              { id: "100", title: "100%" },
            ],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
              this as UpdateFilterSettingsForm,
              "handleSkipUnreadChaptersChange",
            ),
          }),
          SelectRow("skip_publication_status", {
            title: "Skip by Status",
            subtitle:
              skipPublicationStatus.length > 0
                ? `Skipping: ${skipPublicationStatus
                    .map((status) => status.charAt(0).toUpperCase() + status.slice(1))
                    .join(", ")}`
                : "Pick statuses to skip",
            value: skipPublicationStatus,
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
            title: "Batch Size",
            subtitle: `${updateBatchSize} per batch`,
            value: [updateBatchSize.toString()],
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

  async handleOptimizeUpdatesChange(value: boolean): Promise<void> {
    setOptimizeUpdates(value);
  }

  async handleMetadataUpdaterChange(value: boolean): Promise<void> {
    setMetadataUpdater(value);
  }

  async handleSkipPublicationStatusChange(value: string[]): Promise<void> {
    setSkipPublicationStatus(value);
    this.reloadForm();
  }

  async handleUpdateBatchSizeChange(value: string[]): Promise<void> {
    const parsed = parseSelectInt(value, 100);
    setUpdateBatchSize(parsed > 0 ? parsed : 100);
    this.reloadForm();
  }

  async handleSkipNewChaptersChange(value: string[]): Promise<void> {
    setSkipNewChapters(parseSelectInt(value, 0));
    this.reloadForm();
  }

  async handleSkipUnreadChaptersChange(value: string[]): Promise<void> {
    setSkipUnreadChapters(parseSelectInt(value, 0));
    this.reloadForm();
  }
}
