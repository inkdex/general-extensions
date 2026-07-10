/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form, Section, SelectRow, ToggleRow } from "@paperback/types";

import { IMAGE_QUALITY_DEFAULT, IMAGE_QUALITY_KEY, SHOW_ADULT_KEY } from "../models";

export function getImageQuality(): string {
  return (Application.getState(IMAGE_QUALITY_KEY) as string | undefined) ?? IMAGE_QUALITY_DEFAULT;
}

export function getShowAdult(): boolean {
  return (Application.getState(SHOW_ADULT_KEY) as boolean | undefined) ?? false;
}

export class AllMangaSettingsForm extends Form {
  override getSections() {
    return [
      Section(
        { id: "images", footer: "Wp quality servers can be slower and may occasionally fail." },
        [
          SelectRow("imageQuality", {
            title: "Image Quality",
            value: [getImageQuality()],
            minItemCount: 1,
            maxItemCount: 1,
            options: [
              { id: "original", title: "Original" },
              { id: "800", title: "Wp-800" },
              { id: "480", title: "Wp-480" },
            ],
            onValueChange: Application.Selector(
              this as AllMangaSettingsForm,
              "handleImageQualityChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "content",
          footer: "Show adult/NSFW titles across discover and search. Off by default.",
        },
        [
          ToggleRow("showAdult", {
            title: "Show Adult Content",
            value: getShowAdult(),
            onValueChange: Application.Selector(
              this as AllMangaSettingsForm,
              "handleShowAdultChange",
            ),
          }),
        ],
      ),
    ];
  }

  async handleImageQualityChange(value: string[]): Promise<void> {
    Application.setState(value[0] ?? IMAGE_QUALITY_DEFAULT, IMAGE_QUALITY_KEY);
  }

  async handleShowAdultChange(value: boolean): Promise<void> {
    Application.setState(value, SHOW_ADULT_KEY);
  }
}
