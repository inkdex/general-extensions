/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form, Section, ToggleRow, TriStateSelectRow, type Tag } from "@paperback/types";

import { STATE_KEYS, type TriState } from "../models";

// Adult titles remain visible unless the user opts to hide them.
export const getHideAdultContent = (): boolean =>
  (Application.getState(STATE_KEYS.HIDE_ADULT) as boolean | undefined) ?? false;

export class NovelArchiveSettingsForm extends Form {
  private hideAdultContent = getHideAdultContent();
  private genres = (Application.getState(STATE_KEYS.DEFAULT_GENRES) as TriState | undefined) ?? {};

  private readonly genreOptions: Tag[];

  constructor(genres: Tag[]) {
    super();
    this.genreOptions = genres;
  }

  override getSections() {
    return [
      Section(
        {
          id: "browse",
          header: "Browse Settings",
          footer: "Default genres apply to paginated browse sections and search.",
        },
        [
          ToggleRow("hide_adult", {
            title: "Hide adult content",
            value: this.hideAdultContent,
            onValueChange: Application.Selector(
              this as NovelArchiveSettingsForm,
              "handleHideAdultChange",
            ),
          }),
          TriStateSelectRow("genres", {
            title: "Default genres",
            layout: "flow",
            value: this.genres,
            items: this.genreOptions,
            allowExclusion: true,
            allowEmptySelection: true,
            onValueChange: Application.Selector(
              this as NovelArchiveSettingsForm,
              "handleGenresChange",
            ),
          }),
        ],
      ),
    ];
  }

  async handleHideAdultChange(value: boolean): Promise<void> {
    this.hideAdultContent = value;
    Application.setState(value, STATE_KEYS.HIDE_ADULT);
    Application.invalidateDiscoverSections();
  }

  async handleGenresChange(value: TriState): Promise<void> {
    this.genres = value;
    Application.setState(value, STATE_KEYS.DEFAULT_GENRES);
    Application.invalidateDiscoverSections();
  }
}
