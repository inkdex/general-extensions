/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  Section,
  SelectRow,
  TriStateSelectRow,
  type SearchQuery,
  type Tag,
} from "@paperback/types";

import {
  SORT_DIRECTION_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
  type SearchMetadata,
} from "../models";

export class HiveToonsAdvancedSearchForm extends AdvancedSearchForm {
  private status: string[];
  private type: string[];
  private direction: string[];
  private genres: Record<string, "included" | "excluded">;

  private readonly genreOptions: Tag[];

  constructor(searchQuery: SearchQuery<SearchMetadata>, genreOptions: Tag[]) {
    super();
    this.genreOptions = genreOptions;

    const meta = searchQuery.metadata ?? {};
    this.status = meta.status ?? [];
    this.type = meta.type ?? [];
    this.direction = meta.direction ?? [];
    this.genres = { ...meta.genres };
  }

  override getSections() {
    const sections = [
      Section("status", [
        SelectRow("status", {
          title: "Status",
          layout: "flow",
          value: this.status,
          items: STATUS_OPTIONS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as HiveToonsAdvancedSearchForm,
            "handleStatusChange",
          ),
        }),
      ]),
      Section("type", [
        SelectRow("type", {
          title: "Type",
          layout: "flow",
          value: this.type,
          items: TYPE_OPTIONS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as HiveToonsAdvancedSearchForm,
            "handleTypeChange",
          ),
        }),
      ]),
      Section("direction", [
        SelectRow("direction", {
          title: "Sort Direction",
          layout: "flow",
          value: this.direction,
          items: SORT_DIRECTION_OPTIONS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as HiveToonsAdvancedSearchForm,
            "handleDirectionChange",
          ),
        }),
      ]),
    ];

    if (this.genreOptions.length > 0) {
      sections.push(
        Section("genres", [
          TriStateSelectRow("genres", {
            title: "Genres",
            layout: "flow",
            value: this.genres,
            items: this.genreOptions,
            allowExclusion: true,
            allowEmptySelection: true,
            onValueChange: Application.Selector(
              this as HiveToonsAdvancedSearchForm,
              "handleGenresChange",
            ),
          }),
        ]),
      );
    }

    return sections;
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.status = value;
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.type = value;
  }

  async handleDirectionChange(value: string[]): Promise<void> {
    this.direction = value;
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = value;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return {
      ...(this.status.length && { status: this.status }),
      ...(this.type.length && { type: this.type }),
      ...(this.direction.length && { direction: this.direction }),
      ...(Object.keys(this.genres).length && { genres: this.genres }),
    };
  }
}
