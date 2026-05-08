/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  type FormSectionElement,
  type SearchQuery,
  Section,
  SelectRow,
  TriStateSelectRow,
} from "@paperback/types";

import { filter } from "../main";
import type { SearchMetadata, TagMap } from "../models";

export class ComixAdvancedSearchForm extends AdvancedSearchForm {
  private searchMetadata: SearchMetadata;
  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = {
        genres: {},
        themes: {},
        types: {},
        demographic: {},
        status: {},
        formats: {},
        mode: [],
      };
    }
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }
  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "list",
          value: this.searchMetadata.genres ?? {},
          items: filter.genres.map((x) => ({ id: x.id, title: x.value })),
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as ComixAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
      ]),
      Section("demographic", [
        TriStateSelectRow("demographic", {
          title: "Demographic",
          layout: "list",
          value: this.searchMetadata.demographic ?? {},
          allowEmptySelection: true,
          allowExclusion: true,
          items: filter.demographic.map((x) => ({ id: x.id, title: x.value })),
          onValueChange: Application.Selector(this as ComixAdvancedSearchForm, "handleDemogChange"),
        }),
      ]),
      Section("status", [
        TriStateSelectRow("status", {
          title: "Status",
          layout: "list",
          value: this.searchMetadata.status ?? {},
          allowEmptySelection: true,
          allowExclusion: false,
          items: filter.publication_status.map((x) => ({ id: x.id, title: x.value })),
          onValueChange: Application.Selector(
            this as ComixAdvancedSearchForm,
            "handleStatusChange",
          ),
        }),
      ]),
      Section("types", [
        TriStateSelectRow("types", {
          title: "Types",
          layout: "list",
          value: this.searchMetadata.types ?? {},
          allowEmptySelection: true,
          allowExclusion: false,
          items: filter.contentType.map((x) => ({ id: x.id, title: x.value })),
          onValueChange: Application.Selector(this as ComixAdvancedSearchForm, "handleTypesChange"),
        }),
      ]),
      Section("formats", [
        TriStateSelectRow("formats", {
          title: "Formats",
          layout: "list",
          value: this.searchMetadata.formats ?? {},
          allowEmptySelection: true,
          allowExclusion: false,
          items: filter.formats.map((x) => ({ id: x.id, title: x.value })),
          onValueChange: Application.Selector(
            this as ComixAdvancedSearchForm,
            "handleFormatsChange",
          ),
        }),
      ]),
      Section("mode", [
        SelectRow("mode", {
          title: "Mode",
          subtitle: "Select the search mode",
          layout: "list",
          value: this.searchMetadata.mode ?? ["and"],
          items: [
            { id: "and", title: "AND" },
            { id: "or", title: "OR" },
          ],
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as ComixAdvancedSearchForm, "handleModeChange"),
        }),
      ]),
    ];
  }

  async handleGenresChange(value: TagMap): Promise<void> {
    this.searchMetadata.genres = value;
  }
  async handleThemesChange(value: TagMap): Promise<void> {
    this.searchMetadata.themes = value;
  }
  async handleDemogChange(value: TagMap): Promise<void> {
    this.searchMetadata.demographic = value;
  }
  async handleStatusChange(value: TagMap): Promise<void> {
    this.searchMetadata.status = value;
  }
  async handleTypesChange(value: TagMap): Promise<void> {
    this.searchMetadata.types = value;
  }
  async handleFormatsChange(value: TagMap): Promise<void> {
    this.searchMetadata.formats = value;
  }
  async handleModeChange(value: string[]): Promise<void> {
    this.searchMetadata.mode = value;
  }
}
