/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  FormConfirmationError,
  Section,
  SelectRow,
  ToggleRow,
} from "@paperback/types";

import { ORIGIN } from "../models";
import type { MangaDotApi } from "../network";
import {
  getContentTypes,
  getGenresHidden,
  getSectionContentTypes,
  getShowAdultStatus,
  getGenres,
  updateFilters,
} from "../utils";

export class SettingsForm extends Form {
  api: MangaDotApi;
  constructor(api: MangaDotApi) {
    super();
    this.api = api;
  }
  override getSections() {
    const genres = getGenres();
    return [
      Section(
        {
          id: "update_settings",
          header: "Default Search Filter",
        },
        [
          SelectRow("type", {
            title: "Content Type",
            subtitle: "This settings only as default search filter",
            value: getContentTypes(),
            options: ORIGIN,
            minItemCount: 0,
            maxItemCount: ORIGIN.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleTypeStatusChange"),
          }),
          SelectRow("hide_genres", {
            title: "Hide Genres",
            subtitle: "Default value for contents",
            value: getGenresHidden(),
            options: genres,
            minItemCount: 0,
            maxItemCount: genres.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideGenresStatusChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "section_settings",
          header: "Sections Settings",
        },
        [
          SelectRow("section_type", {
            title: "Content Type",
            subtitle: "This settings apply on sections only",
            value: getSectionContentTypes(),
            options: ORIGIN,
            minItemCount: 1,
            maxItemCount: ORIGIN.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleSectionTypeStatusChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "global_settings",
          header: "Global Settings",
        },
        [
          ToggleRow("toggle_adult", {
            title: "Show Adult results",
            value: getShowAdultStatus(),
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleShowAdultStatusChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "reset_settings",
          footer: "Filters",
        },
        [
          ButtonRow("reload_genres", {
            title: "Refresh genres filters",
            onSelect: Application.Selector(this as SettingsForm, "resetFiltersDialog"),
          }),
        ],
      ),
    ];
  }

  async updateValue<T>(value: T, filter: string): Promise<void> {
    Application.setState(value, filter);
    this.reloadForm();
  }

  async handleShowAdultStatusChange(value: boolean): Promise<void> {
    await this.updateValue(value, "show_adult");
  }

  async handleTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "content_type");
  }

  async handleSectionTypeStatusChange(value: string[]): Promise<void> {
    const previous = getSectionContentTypes();

    const hadAnyBefore = previous.includes("");
    const hasAnyNow = value.includes("");

    if (hadAnyBefore && value.length > 1) {
      value = value.filter((v) => v !== "");
    } else if (!hadAnyBefore && hasAnyNow) {
      value = [""];
    }

    await this.updateValue(value, "section_content_type");
  }

  async handleHideGenresStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_genres");
  }

  async resetFiltersDialog() {
    throw new FormConfirmationError(
      Application.Selector(this as SettingsForm, "resetFilters"),
      "Do you want to refresh genres filters?",
    );
  }

  async resetFilters() {
    await updateFilters(true, this.api);
  }
}
