/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form, Section, SelectRow, ToggleRow } from "@paperback/types";

import type { AtsuContentRating, AtsuMangaType } from "../shared/models";
import {
  getAdultMode,
  getContentRatings,
  getContentTypes,
  setAdultMode,
  setContentRatings,
  setContentTypes,
} from "./main";
import { CONTENT_RATING_OPTIONS, CONTENT_TYPE_OPTIONS } from "./models";

export class AtsumaruSettingsForm extends Form {
  override getSections() {
    const adultMode = getAdultMode();
    const contentRatings = getContentRatings();
    const contentTypes = getContentTypes();

    return [
      Section(
        {
          id: "types",
          footer: "Choose which content types appear in Discover and Search.",
        },
        [
          SelectRow("content-types", {
            title: "Types",
            subtitle: CONTENT_TYPE_OPTIONS.filter((option) => contentTypes.includes(option.id))
              .map((option) => option.title)
              .join(", "),
            value: contentTypes,
            minItemCount: 1,
            maxItemCount: CONTENT_TYPE_OPTIONS.length,
            options: CONTENT_TYPE_OPTIONS,
            onValueChange: Application.Selector(
              this as AtsumaruSettingsForm,
              "handleContentTypesChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "content",
          footer:
            "Normal Catalog shows the selected ratings. Adult Only Catalog only shows adult content.",
        },
        [
          ToggleRow("adult-mode", {
            title: "Adult Only Catalog",
            subtitle: "Show only adult content",
            value: adultMode,
            onValueChange: Application.Selector(
              this as AtsumaruSettingsForm,
              "handleAdultModeChange",
            ),
          }),
          ...(adultMode
            ? []
            : [
                SelectRow("content-ratings", {
                  title: "Content Ratings",
                  subtitle: contentRatings.join(", "),
                  value: contentRatings,
                  minItemCount: 1,
                  maxItemCount: CONTENT_RATING_OPTIONS.length,
                  options: CONTENT_RATING_OPTIONS,
                  onValueChange: Application.Selector(
                    this as AtsumaruSettingsForm,
                    "handleContentRatingsChange",
                  ),
                }),
              ]),
        ],
      ),
    ];
  }

  async handleAdultModeChange(value: boolean): Promise<void> {
    setAdultMode(value);
    this.reloadForm();
  }

  async handleContentRatingsChange(value: string[]): Promise<void> {
    setContentRatings(value as AtsuContentRating[]);
    this.reloadForm();
  }

  async handleContentTypesChange(value: string[]): Promise<void> {
    setContentTypes(value as AtsuMangaType[]);
    this.reloadForm();
  }
}
