/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { FormSectionElement, FormItemElement, ToggleRowProps } from "@paperback/types";
import { Form, Section, ToggleRow } from "@paperback/types";
import { getShowAdult, setShowAdult } from "./main";

export class AtsumaruSettingsForm extends Form {
  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "adult-content",
          footer:
            "Enable this to show adult/NSFW content across discover and search results. This setting is off by default.",
        },
        [this.showAdultRow()],
      ),
    ];
  }

  showAdultRow(): FormItemElement<unknown> {
    const toggleProps: ToggleRowProps = {
      title: "Show Adult Content",
      value: getShowAdult(),
      onValueChange: Application.Selector(this as AtsumaruSettingsForm, "handleShowAdultChange"),
    };

    return ToggleRow("show-adult", toggleProps);
  }

  async handleShowAdultChange(value: boolean): Promise<void> {
    setShowAdult(value);
    this.reloadForm();
  }
}
