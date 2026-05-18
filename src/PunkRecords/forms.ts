/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form, LabelRow, Section, ToggleRow, type FormSectionElement } from "@paperback/types";

import { PUNK_RECORDS_STATE_KEYS } from "./models";

export class PunkRecordsSettingsForm extends Form {
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
          value: Application.getState(PUNK_RECORDS_STATE_KEYS.ShowCatalogueOnHome) !== false,
          onValueChange: Application.Selector(
            this as PunkRecordsSettingsForm,
            "handleShowCatalogueOnHomeChange",
          ),
        }),
      ]),
    ];
  }

  async handleShowCatalogueOnHomeChange(value: boolean): Promise<void> {
    Application.setState(value, PUNK_RECORDS_STATE_KEYS.ShowCatalogueOnHome);
    Application.invalidateDiscoverSections();
  }
}
