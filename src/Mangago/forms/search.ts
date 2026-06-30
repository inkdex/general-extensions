/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  SelectRow,
  Section,
  TriStateSelectRow,
  type SearchQuery,
} from "@paperback/types";

import {
  GENRE_OPTIONS,
  genreIdFromTitle,
  type MangagoSearchMetadata,
  STATUS_OPTIONS,
} from "../models";

function normalizeGenreSelections(
  genres: Record<string, "included" | "excluded"> | undefined,
): Record<string, "included" | "excluded"> {
  const normalized: Record<string, "included" | "excluded"> = {};
  const validIds = new Set(GENRE_OPTIONS.map((genre) => genre.id));

  for (const [idOrTitle, state] of Object.entries(genres ?? {})) {
    const id = validIds.has(idOrTitle) ? idOrTitle : genreIdFromTitle(idOrTitle);
    if (validIds.has(id)) normalized[id] = state;
  }

  return normalized;
}

export class MangagoAdvancedSearchForm extends AdvancedSearchForm {
  private genres: Record<string, "included" | "excluded">;
  private statuses: string[];

  constructor(searchQuery?: SearchQuery<MangagoSearchMetadata>) {
    super();

    this.genres = normalizeGenreSelections(searchQuery?.metadata?.genres);
    if (searchQuery?.metadata?.genre) {
      const genreId = genreIdFromTitle(searchQuery.metadata.genre);
      if (GENRE_OPTIONS.some((genre) => genre.id === genreId)) this.genres[genreId] = "included";
    }
    this.statuses = searchQuery?.metadata?.statuses ?? STATUS_OPTIONS.map((status) => status.id);
  }

  override getSections() {
    return [
      Section("genre", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: GENRE_OPTIONS,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as MangagoAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
      ]),
      Section("status", [
        SelectRow("statuses", {
          title: "Status",
          layout: "flow",
          value: this.statuses,
          items: STATUS_OPTIONS.map((status) => ({ id: status.id, title: status.label })),
          minItemCount: 1,
          maxItemCount: STATUS_OPTIONS.length,
          onValueChange: Application.Selector(
            this as MangagoAdvancedSearchForm,
            "handleStatusesChange",
          ),
        }),
      ]),
    ];
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = normalizeGenreSelections(value);
  }

  async handleStatusesChange(value: string[]): Promise<void> {
    this.statuses = value.filter((status) => STATUS_OPTIONS.some((option) => option.id === status));
  }

  override getSearchQueryMetadata(): MangagoSearchMetadata {
    const metadata: MangagoSearchMetadata = {};
    if (Object.keys(this.genres).length > 0) metadata.genres = this.genres;
    if (this.statuses.length !== STATUS_OPTIONS.length) metadata.statuses = this.statuses;
    return metadata;
  }
}
