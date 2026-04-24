/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  LabelRow,
  SelectRow,
  Section,
  type SearchQuery,
  type Tag,
  type TagSection,
} from "@paperback/types";

import type { SearchMetadata } from "./models";

export class MgekoAdvancedSearchForm extends AdvancedSearchForm {
  private readonly genreOptions: Tag[] = [];
  private readonly statusOptions: Tag[] = [];
  private readonly typeOptions: Tag[] = [];
  private genreIncluded: string[];
  private genreExcluded: string[];
  private status: string;
  private type: string;
  private isQuerySearch: boolean;

  constructor(searchQuery: SearchQuery<SearchMetadata>, tagSections: TagSection[]) {
    super();
    for (const section of tagSections) {
      switch (section.id) {
        case "genres":
          this.genreOptions = section.tags;
          break;
        case "status":
          this.statusOptions = section.tags;
          break;
        case "type":
          this.typeOptions = section.tags;
          break;
      }
    }

    this.isQuerySearch = (searchQuery.title?.trim().length ?? 0) !== 0;

    const meta = searchQuery.metadata ?? {};
    const genres = meta.genres ?? {};
    this.genreIncluded = Object.entries(genres)
      .filter(([, v]) => v === "included")
      .map(([k]) => k);
    this.genreExcluded = Object.entries(genres)
      .filter(([, v]) => v === "excluded")
      .map(([k]) => k);
    this.status = meta.status ?? "";
    this.type = meta.type ?? "";
  }

  override getSections() {
    if (this.isQuerySearch) {
      return [
        Section("info", [
          LabelRow("queryFilteringUnsupported", {
            title: "Filters Unavailable",
            subtitle:
              "Filtering is not supported when searching by title. Clear the search text to use filters.",
          }),
        ]),
      ];
    }
    return [
      Section("genres", [
        SelectRow("genre_included", {
          title: "Include Genres",
          value: this.genreIncluded,
          options: this.genreOptions,
          minItemCount: 0,
          maxItemCount: this.genreOptions.length,
          onValueChange: Application.Selector(
            this as MgekoAdvancedSearchForm,
            "handleGenreIncludedChange",
          ),
        }),
        SelectRow("genre_excluded", {
          title: "Exclude Genres",
          value: this.genreExcluded,
          options: this.genreOptions,
          minItemCount: 0,
          maxItemCount: this.genreOptions.length,
          onValueChange: Application.Selector(
            this as MgekoAdvancedSearchForm,
            "handleGenreExcludedChange",
          ),
        }),
      ]),
      Section("status", [
        SelectRow("status", {
          title: "Status",
          value: this.status ? [this.status] : [],
          options: this.statusOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as MgekoAdvancedSearchForm,
            "handleStatusChange",
          ),
        }),
      ]),
      Section("type", [
        SelectRow("type", {
          title: "Type",
          value: this.type ? [this.type] : [],
          options: this.typeOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as MgekoAdvancedSearchForm, "handleTypeChange"),
        }),
      ]),
    ];
  }

  async handleGenreIncludedChange(value: string[]): Promise<void> {
    this.genreIncluded = value;
  }

  async handleGenreExcludedChange(value: string[]): Promise<void> {
    this.genreExcluded = value;
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.status = value[0] ?? "";
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.type = value[0] ?? "";
  }

  override async formDidSubmit(): Promise<void> {
    const overlap = this.genreIncluded.filter((id) => this.genreExcluded.includes(id));
    if (overlap.length > 0) {
      throw new Error("A genre cannot be both included and excluded");
    }
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const genres: { [id: string]: "included" | "excluded" } = {};
    for (const id of this.genreIncluded) genres[id] = "included";
    for (const id of this.genreExcluded) genres[id] = "excluded";
    const result: SearchMetadata = {};
    if (Object.keys(genres).length > 0) result.genres = genres;
    if (this.status) result.status = this.status;
    if (this.type) result.type = this.type;
    return result;
  }
}
