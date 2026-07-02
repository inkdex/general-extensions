/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  Section,
  SelectRow,
  ToggleRow,
  TriStateSelectRow,
  type SearchQuery,
  type Tag,
} from "@paperback/types";

import { type SearchDetails, type SearchMetadata, type SearchOption } from "../models";

const toTags = (options: SearchOption[]): Tag[] =>
  options.map((option) => ({ id: option.id, title: option.label }));

export class MangaFireAdvancedSearchForm extends AdvancedSearchForm {
  private genres: Record<string, "included" | "excluded">;
  private genreMode: boolean;
  private type: string;
  private status: string;
  private language: string;
  private year: string;
  private length: string;

  constructor(
    searchQuery: SearchQuery<SearchMetadata>,
    private searchDetails: SearchDetails,
  ) {
    super();

    const meta = searchQuery.metadata ?? {};
    this.genres = { ...meta.genres };
    this.genreMode = meta.genreMode ?? true;
    this.type = meta.type ?? "";
    this.status = meta.status ?? "";
    this.language = meta.language ?? "";
    this.year = meta.year ?? "";
    this.length = meta.length ?? "";
  }

  override getSections() {
    const selects = [
      {
        id: "type",
        title: "Type",
        options: this.searchDetails.types,
        value: this.type,
        handler: "handleTypeChange",
      },
      {
        id: "status",
        title: "Status",
        options: this.searchDetails.status,
        value: this.status,
        handler: "handleStatusChange",
      },
      {
        id: "language",
        title: "Language",
        options: this.searchDetails.languages,
        value: this.language,
        handler: "handleLanguageChange",
      },
      {
        id: "year",
        title: "Year",
        options: this.searchDetails.years,
        value: this.year,
        handler: "handleYearChange",
      },
      {
        id: "length",
        title: "Length",
        options: this.searchDetails.lengths,
        value: this.length,
        handler: "handleLengthChange",
      },
    ] as const;

    return [
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: toTags(this.searchDetails.genres),
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
            value: value ? [value] : [],
            options: toTags(options),
            minItemCount: 0,
            maxItemCount: 1,
            onValueChange: Application.Selector(this as MangaFireAdvancedSearchForm, handler),
          }),
        ]),
      ),
    ];
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = value;
  }

  async handleGenreModeChange(value: boolean): Promise<void> {
    this.genreMode = value;
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.type = value[0] ?? "";
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.status = value[0] ?? "";
  }

  async handleLanguageChange(value: string[]): Promise<void> {
    this.language = value[0] ?? "";
  }

  async handleYearChange(value: string[]): Promise<void> {
    this.year = value[0] ?? "";
  }

  async handleLengthChange(value: string[]): Promise<void> {
    this.length = value[0] ?? "";
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (Object.keys(this.genres).length > 0) result.genres = this.genres;
    if (this.genreMode) result.genreMode = this.genreMode;
    if (this.type) result.type = this.type;
    if (this.status) result.status = this.status;
    if (this.language) result.language = this.language;
    if (this.year) result.year = this.year;
    if (this.length) result.length = this.length;
    return result;
  }
}
