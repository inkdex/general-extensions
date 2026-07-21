/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form, Section, ToggleRow } from "@paperback/types";

const SHOW_LOCKED_KEY = "show_locked_chapters";

export const getShowLockedChapters = (): boolean => {
  return (Application.getState(SHOW_LOCKED_KEY) ?? false) as boolean;
};

export class HiveToonsSettingsForm extends Form {
  override getSections() {
    return [
      Section("chapters", [
        ToggleRow("showLocked", {
          title: "Show locked chapters",
          subtitle: "Shows paid chapters with a 🔒. Unlock them on the website before reading.",
          value: getShowLockedChapters(),
          onValueChange: Application.Selector(
            this as HiveToonsSettingsForm,
            "handleShowLockedChange",
          ),
        }),
      ]),
    ];
  }

  async handleShowLockedChange(value: boolean): Promise<void> {
    Application.setState(value, SHOW_LOCKED_KEY);
  }
}
