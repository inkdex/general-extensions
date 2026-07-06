/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  InputRow,
  Section,
  SelectRow,
  ToggleRow,
  TriStateSelectRow,
  type SearchQuery,
} from "@paperback/types";

import { DEMOGRAPHICS, GENRES, STATUSES, THEMES, TYPES, type SearchMetadata } from "../models";

export class MangaFireAdvancedSearchForm extends AdvancedSearchForm {
  private genres: Record<string, "included" | "excluded">;
  private genreMode: boolean;
  private types: string[];
  private themes: string[];
  private demographics: string[];
  private statuses: string[];
  private yearFrom: string;
  private yearTo: string;
  private minChapters: string;

  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();

    const meta = searchQuery.metadata ?? {};
    this.genres = { ...meta.genres };
    this.genreMode = meta.genreMode ?? true;
    this.types = meta.types ?? [];
    this.themes = meta.themes ?? [];
    this.demographics = meta.demographics ?? [];
    this.statuses = meta.statuses ?? [];
    this.yearFrom = meta.yearFrom ?? "";
    this.yearTo = meta.yearTo ?? "";
    this.minChapters = meta.minChapters ?? "";
  }

  override getSections() {
    const selects = [
      {
        id: "types",
        title: "Type",
        options: TYPES,
        value: this.types,
        handler: "handleTypesChange",
      },
      {
        id: "themes",
        title: "Themes",
        options: THEMES,
        value: this.themes,
        handler: "handleThemesChange",
      },
      {
        id: "demographics",
        title: "Demographic",
        options: DEMOGRAPHICS,
        value: this.demographics,
        handler: "handleDemographicsChange",
      },
      {
        id: "statuses",
        title: "Status",
        options: STATUSES,
        value: this.statuses,
        handler: "handleStatusesChange",
      },
    ] as const;

    return [
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: GENRES,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
        ToggleRow("genre_mode", {
          title: "Genre Mode",
          subtitle: "Title must have all genres selected.",
          value: this.genreMode,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleGenreModeChange",
          ),
        }),
      ]),
      ...selects.map(({ id, title, options, value, handler }) =>
        Section(id, [
          SelectRow(id, {
            title,
            value,
            options,
            minItemCount: 0,
            maxItemCount: options.length,
            onValueChange: Application.Selector(this as MangaFireAdvancedSearchForm, handler),
          }),
        ]),
      ),
      Section("other", [
        InputRow("year_from", {
          title: "Release Year (From)",
          value: this.yearFrom,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleYearFromChange",
          ),
        }),
        InputRow("year_to", {
          title: "Release Year (To)",
          value: this.yearTo,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleYearToChange",
          ),
        }),
        InputRow("min_chapters", {
          title: "Minimum Chapters",
          value: this.minChapters,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleMinChaptersChange",
          ),
        }),
      ]),
    ];
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = value;
  }

  async handleGenreModeChange(value: boolean): Promise<void> {
    this.genreMode = value;
  }

  async handleTypesChange(value: string[]): Promise<void> {
    this.types = value;
  }

  async handleThemesChange(value: string[]): Promise<void> {
    this.themes = value;
  }

  async handleDemographicsChange(value: string[]): Promise<void> {
    this.demographics = value;
  }

  async handleStatusesChange(value: string[]): Promise<void> {
    this.statuses = value;
  }

  async handleYearFromChange(value: string): Promise<void> {
    this.yearFrom = value;
  }

  async handleYearToChange(value: string): Promise<void> {
    this.yearTo = value;
  }

  async handleMinChaptersChange(value: string): Promise<void> {
    this.minChapters = value;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (Object.keys(this.genres).length > 0) result.genres = this.genres;
    if (!this.genreMode) result.genreMode = this.genreMode;
    if (this.types.length > 0) result.types = this.types;
    if (this.themes.length > 0) result.themes = this.themes;
    if (this.demographics.length > 0) result.demographics = this.demographics;
    if (this.statuses.length > 0) result.statuses = this.statuses;
    if (this.yearFrom.trim()) result.yearFrom = this.yearFrom.trim();
    if (this.yearTo.trim()) result.yearTo = this.yearTo.trim();
    if (this.minChapters.trim()) result.minChapters = this.minChapters.trim();
    return result;
  }
}
