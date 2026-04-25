/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  Form,
  Section,
  SelectRow,
  type FormItemElement,
  type SelectRowProps,
} from "@paperback/types";

import { getLanguage, setLanguage } from "./main";

const LANGUAGES = [
  { id: "en-US", title: "English" },
  { id: "es-ES", title: "Spanish" },
  { id: "pt-PT", title: "Portuguese" },
  { id: "fr-FR", title: "French" },
];

export class QToonSettingsForm extends Form {
  override getSections() {
    return [
      Section(
        {
          id: "language-settings",
          footer: "Changes the language for all content including genres, chapters, and images.",
        },
        [this.languageRow()],
      ),
    ];
  }

  languageRow(): FormItemElement<unknown> {
    const props: SelectRowProps = {
      title: "Language",
      options: LANGUAGES,
      value: [getLanguage()],
      minItemCount: 1,
      maxItemCount: 1,
      onValueChange: Application.Selector(this as QToonSettingsForm, "handleLanguageChange"),
    };
    return SelectRow("language", props);
  }

  async handleLanguageChange(value: string[]): Promise<void> {
    if (value[0]) {
      setLanguage(value[0]);
    }
    this.reloadForm();
  }
}
