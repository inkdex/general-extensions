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

import { COUNTRY_OPTIONS, genreId, GENRE_OPTIONS, type SearchMetadata } from "../models";

const GENRE_TAGS: Tag[] = GENRE_OPTIONS.map((name) => ({
  id: genreId(name),
  title: name,
}));

const COUNTRY_TAGS: Tag[] = COUNTRY_OPTIONS.map((option) => ({
  id: option.id,
  title: option.value,
}));

export class AllMangaAdvancedSearchForm extends AdvancedSearchForm {
  private country: string[];
  private genres: Record<string, "included" | "excluded">;

  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    const meta = searchQuery.metadata ?? {};
    this.country = meta.country ?? [];
    this.genres = { ...meta.genres };
  }

  override getSections() {
    return [
      Section("country", [
        SelectRow("country", {
          title: "Country",
          layout: "flow",
          value: this.country,
          items: COUNTRY_TAGS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as AllMangaAdvancedSearchForm,
            "handleCountryChange",
          ),
        }),
      ]),
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: GENRE_TAGS,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as AllMangaAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
      ]),
    ];
  }

  async handleCountryChange(value: string[]): Promise<void> {
    this.country = value;
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = value;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (this.country.length > 0) result.country = this.country;
    if (Object.keys(this.genres).length > 0) result.genres = this.genres;
    return result;
  }
}
