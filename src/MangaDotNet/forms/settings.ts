/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, FormConfirmationError, Section, SelectRow } from "@paperback/types";

import { ORIGIN } from "../models";
import type { MangaDotNetApi } from "../network";
import {
  getContentTypes,
  getGenresHidden,
  getSectionContentTypes,
  getShowAdultStatus,
  updateFilters,
  getFilters,
  getThemesHidden,
  getDemographicHidden,
  getMoreHidden,
} from "../utils";

export class SettingsForm extends Form {
  api: MangaDotNetApi;
  constructor(api: MangaDotNetApi) {
    super();
    this.api = api;
  }
  override getSections() {
    const filters = getFilters();
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
            options: filters.genre,
            minItemCount: 0,
            maxItemCount: filters.genre.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideGenresStatusChange",
            ),
          }),
          SelectRow("hide_demographic", {
            title: "Hide Demographic",
            subtitle: "Default value for contents",
            value: getDemographicHidden(),
            options: filters.demographic,
            minItemCount: 0,
            maxItemCount: filters.demographic.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideDemographicStatusChange",
            ),
          }),
          SelectRow("hide_themes", {
            title: "Hide Themes",
            subtitle: "Default value for contents",
            value: getThemesHidden(),
            options: filters.themeAndContent,
            minItemCount: 0,
            maxItemCount: filters.themeAndContent.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideThemesStatusChange",
            ),
          }),
          SelectRow("hide_more", {
            title: "Hide More",
            subtitle: "Default value for contents",
            value: getMoreHidden(),
            options: filters.more,
            minItemCount: 0,
            maxItemCount: filters.more.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleHideMoreStatusChange"),
          }),
        ],
      ),
      Section(
        {
          id: "section_settings",
          header: "Sections Settings",
          footer: "This settings apply on sections only",
        },
        [
          SelectRow("section_type", {
            title: "Content Type",
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
          SelectRow("toggle_adult", {
            title: "Show Adult results",
            value: getShowAdultStatus(),
            options: [
              { id: "0", title: "No" },
              { id: "1", title: "Yes" },
              { id: "both", title: "Both" },
            ],
            minItemCount: 1,
            maxItemCount: 1,
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

  async handleShowAdultStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "show_adult_content");
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

  async handleHideDemographicStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_demographic");
  }

  async handleHideThemesStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_themes");
  }

  async handleHideMoreStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_more");
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
