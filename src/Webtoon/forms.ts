/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  Section,
  SelectRow,
  SelectSection,
  type FormSectionElement,
  type SearchQuery,
  type SettingsFormProviding,
} from "@paperback/types";
import { Form, ToggleRow } from "@paperback/types";

import type { Tag } from "./models";
import {
  CANVAS_WANTED,
  getLanguagesTitle,
  Language,
  LANGUAGES,
  LanguagesOptions,
  type SearchMetadata,
} from "./models";

export class WebtoonAdvancedSearchForm extends AdvancedSearchForm {
  private metadata: SearchMetadata;
  private genres: Tag[];

  constructor(searchQuery: SearchQuery<SearchMetadata>, genres: Tag[]) {
    super();

    this.metadata = searchQuery?.metadata ?? { languages: [], genres: [] };
    this.genres = genres;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.metadata;
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      SelectSection(this, {
        id: "languages",
        header: "Languages",
        footer: "Select the language(s) to include in search results",
        layout: "list",
        value: this.metadata.languages!,
        minItemCount: 0,
        maxItemCount: Object.values(Language).length,
        items: Object.values(Language).map((lang) => ({
          id: lang,
          title: getLanguagesTitle(lang),
        })),
      }),
      SelectSection(this, {
        id: "genres",
        header: "Genres",
        footer: "Select the genre(s) to include in search results",
        layout: "flow",
        value: this.metadata.genres!,
        minItemCount: 0,
        maxItemCount: this.genres.length,
        items: this.genres,
      }),
    ];
  }
}

export abstract class WebtoonSettings implements SettingsFormProviding {
  get canvasWanted(): boolean {
    return (Application.getState(CANVAS_WANTED) ?? false) === "true";
  }

  set canvasWanted(value: boolean) {
    Application.setState(value.toString(), CANVAS_WANTED);
  }

  get languages(): Language[] {
    return (Application.getState(LANGUAGES) as Language[]) ?? [Language.ENGLISH];
  }

  set languages(value: string[]) {
    Application.setState(value, LANGUAGES);
  }

  async getSettingsForm(): Promise<Form> {
    return new WebtoonSettingForm(this);
  }
}

export class WebtoonSettingForm extends Form {
  private settings: WebtoonSettings;

  constructor(settings: WebtoonSettings) {
    super();
    this.settings = settings;
  }

  override getSections() {
    return [
      Section("settings", [
        SelectRow(LANGUAGES, {
          title: "Languages",
          value: this.settings.languages,
          minItemCount: 1,
          maxItemCount: 200,
          options: LanguagesOptions,
          onValueChange: Application.Selector(this as WebtoonSettingForm, "setLanguages"),
        }),
        ToggleRow(CANVAS_WANTED, {
          title: "Show Canvas",
          value: this.settings.canvasWanted,
          onValueChange: Application.Selector(this as WebtoonSettingForm, "setCanvasWanted"),
        }),
      ]),
    ];
  }

  async setCanvasWanted(value: boolean): Promise<void> {
    this.settings.canvasWanted = value;
    Application.invalidateDiscoverSections();
  }

  async setLanguages(value: string[]): Promise<void> {
    this.settings.languages = value;
    Application.invalidateDiscoverSections();
  }
}
