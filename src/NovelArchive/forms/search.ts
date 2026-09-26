/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  Section,
  SelectRow,
  SelectSection,
  TriStateSelectRow,
  type SearchQuery,
  type Tag,
} from "@paperback/types";

import { GENRE_MATCH_OPTIONS, STATUS_OPTIONS, type SearchMetadata, type TriState } from "../models";

export class NovelArchiveAdvancedSearchForm extends AdvancedSearchForm {
  private status: string[];
  private genreMatch: string[];
  private genres: TriState;

  private readonly genreOptions: Tag[];

  constructor(searchQuery: SearchQuery<SearchMetadata>, genres: Tag[]) {
    super();
    const metadata = searchQuery.metadata ?? {};
    this.status = metadata.status ?? [];
    this.genreMatch = metadata.genreMatch ?? ["all"];
    this.genres = { ...metadata.genres };
    this.genreOptions = genres;
  }

  override getSections() {
    return [
      Section("status", [
        SelectRow("status", {
          title: "Status",
          layout: "flow",
          value: this.status,
          items: STATUS_OPTIONS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as NovelArchiveAdvancedSearchForm,
            "handleStatusChange",
          ),
        }),
      ]),
      Section({ id: "genres", footer: "Tap once to include, twice to exclude." }, [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: this.genreOptions,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as NovelArchiveAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
      ]),
      SelectSection(this, {
        id: "genre_match",
        header: "Genre match",
        layout: "flow",
        value: this.genreMatch,
        items: GENRE_MATCH_OPTIONS,
        minItemCount: 1,
        maxItemCount: 1,
      }),
    ];
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.status = value;
  }

  async handleGenresChange(value: TriState): Promise<void> {
    this.genres = value;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (this.status.length > 0) result.status = this.status;
    if (this.genreMatch.length > 0) result.genreMatch = this.genreMatch;
    if (Object.keys(this.genres).length > 0) result.genres = this.genres;
    return result;
  }
}
