/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, Section, SelectRow, ToggleRow } from "@paperback/types";
import { Language } from "./MangaPlusHelper";

export const getLanguages = (): string[] => {
  return (Application.getState("languages") as string[]) ?? [Language.ENGLISH];
};

export const getSplitImages = (): string => {
  return (Application.getState("split_images") as string) ?? "yes";
};

export const getResolution = (): string => {
  return (Application.getState("image_resolution") as string) ?? "high";
};

export class MangaPlusSettingForm extends Form {
  override getSections() {
    return [
      Section("content_settings", [
        SelectRow("languages", {
          title: "Languages",
          value: getLanguages(),
          minItemCount: 1,
          maxItemCount: 200,
          options: [
            { id: Language.ENGLISH, title: "English" },
            { id: Language.SPANISH, title: "Español" },
            { id: Language.FRENCH, title: "Français" },
            { id: Language.INDONESIAN, title: "Bahasa (IND)" },
            { id: Language.PORTUGUESE_BR, title: "Portugûes (BR)" },
            { id: Language.RUSSIAN, title: "Русский" },
            { id: Language.THAI, title: "ภาษาไทย" },
            { id: Language.VIETNAMESE, title: "Tiếng Việt" },
          ],
          onValueChange: Application.Selector(this as MangaPlusSettingForm, "setLanguages"),
        }),
        ToggleRow("split_images", {
          title: "Split Images",
          value: getSplitImages() === "yes",
          onValueChange: Application.Selector(this as MangaPlusSettingForm, "setSplitImages"),
        }),
        SelectRow("image_resolution", {
          title: "Image Resolution",
          value: [getResolution()],
          minItemCount: 1,
          maxItemCount: 1,
          options: [
            { id: "low", title: "Low" },
            { id: "medium", title: "Medium" },
            { id: "high", title: "High" },
            { id: "super_high", title: "Super High" },
          ],
          onValueChange: Application.Selector(this as MangaPlusSettingForm, "setResolution"),
        }),
      ]),
      Section("reset_settings", [
        ButtonRow("reset", {
          title: "Reset to Default",
          onSelect: Application.Selector(this as MangaPlusSettingForm, "resetSettings"),
        }),
      ]),
    ];
  }

  async setLanguages(value: string[]): Promise<void> {
    Application.setState(value, "languages");
  }

  async setSplitImages(value: boolean): Promise<void> {
    Application.setState(value ? "yes" : "no", "split_images");
  }

  async setResolution(value: string[]): Promise<void> {
    Application.setState(value.length > 0 ? value[0] : "high", "image_resolution");
  }

  async resetSettings(): Promise<void> {
    Application.setState([Language.ENGLISH], "languages");
    Application.setState("yes", "split_images");
    Application.setState("high", "image_resolution");
  }
}
