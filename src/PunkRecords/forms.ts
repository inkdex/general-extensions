/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  Form,
  LabelRow,
  Section,
  ToggleRow,
  type FormSectionElement,
  type SelectorID,
} from "@paperback/types";

import { PUNK_RECORDS_STATE_KEYS, getShowCatalogueOnHome } from "./models";

class FormState<T> {
  private currentValue: T;

  constructor(
    private readonly form: Form,
    initialValue: T,
  ) {
    this.currentValue = initialValue;
  }

  get value(): T {
    return this.currentValue;
  }

  get selector(): SelectorID<(value: T) => Promise<void>> {
    return Application.Selector(this as FormState<T>, "updateValue");
  }

  async updateValue(value: T): Promise<void> {
    this.currentValue = value;
    this.form.reloadForm();
  }
}

export class SettingsForm extends Form {
  showCatalogueOnHome = new FormState(this, getShowCatalogueOnHome());

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("about", [
        LabelRow("about-row", {
          title: "Punk Records",
          subtitle: "Ajustez l'affichage de l'extension dans Paperback.",
          value: "punkrecordz.com",
        }),
      ]),
      Section("browse", [
        ToggleRow("show-catalogue-on-home", {
          title: "Afficher le catalogue sur l'accueil",
          subtitle: "Desactivez-le si la page d'accueil devient trop lourde a charger.",
          value: this.showCatalogueOnHome.value,
          onValueChange: this.showCatalogueOnHome.selector,
        }),
      ]),
    ];
  }

  override async formDidSubmit(): Promise<void> {
    Application.setState(
      this.showCatalogueOnHome.value,
      PUNK_RECORDS_STATE_KEYS.showCatalogueOnHome,
    );
  }

  override get requiresExplicitSubmission(): boolean {
    return true;
  }
}
