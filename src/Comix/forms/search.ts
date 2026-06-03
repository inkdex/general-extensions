/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  Section,
  SelectRow,
  SelectSection,
  StepperRow,
  TriStateSelectRow,
  type FormSectionElement,
  type SearchQuery,
} from "@paperback/types";

import type { SearchMetadata, TagMap } from "../models";
import type { ComixFilter } from "../utils/filter";

export class ComixAdvancedSearchForm extends AdvancedSearchForm {
  private searchMetadata: SearchMetadata;
  private mode?: string[];
  constructor(
    searchQuery: SearchQuery<SearchMetadata>,
    private filter: ComixFilter,
  ) {
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
    this.mode = this.searchMetadata.mode ? this.searchMetadata.mode : ["and"];
  }

  override getSearchQueryMetadata(): SearchMetadata {
    if (this.mode) {
      this.searchMetadata.mode = this.mode;
    }
    return this.searchMetadata;
  }
  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "list",
          value: this.searchMetadata.genres ?? {},
          items: this.filter.genres.map((x) => ({ id: x.id, title: x.value })),
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
          items: this.filter.demographic.map((x) => ({ id: x.id, title: x.value })),
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
          items: this.filter.publication_status.map((x) => ({ id: x.id, title: x.value })),
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
          items: this.filter.contentType.map((x) => ({ id: x.id, title: x.value })),
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
          items: this.filter.formats.map((x) => ({ id: x.id, title: x.value })),
          onValueChange: Application.Selector(
            this as ComixAdvancedSearchForm,
            "handleFormatsChange",
          ),
        }),
      ]),
      SelectSection(this, {
        id: "mode",
        layout: "flow",
        value: this.mode ?? ["and"],
        items: [
          { id: "and", title: "AND" },
          { id: "or", title: "OR" },
        ],
        minItemCount: 1,
        maxItemCount: 1,
      }),
      Section("chapter_min", [
        StepperRow("chapter_min", {
          title: "Minimum Chapters",
          value: this.searchMetadata.minChap ?? 0,
          minValue: 0,
          maxValue: 10000,
          stepValue: 1,
          loopOver: false,
          onValueChange: Application.Selector(this as ComixAdvancedSearchForm, "handleMinChapters"),
        }),
      ]),
      Section("content_rating", [
        SelectRow("content_rating", {
          title: "Content Rating",
          value: this.searchMetadata.contentRating ?? this.filter.getDefaultContentRatingSettings(),
          items: this.filter.contentRating,
          layout: "list",
          maxItemCount: 1,
          minItemCount: 1,
          onValueChange: Application.Selector(
            this as ComixAdvancedSearchForm,
            "handleContentRating",
          ),
        }),
      ]),
    ];
  }

  async handleGenresChange(value: TagMap): Promise<void> {
    this.searchMetadata.genres = value;
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
  async handleMinChapters(value: number): Promise<void> {
    this.searchMetadata.minChap = value;
  }
  async handleContentRating(value: string[]): Promise<void> {
    this.searchMetadata.contentRating = value;
  }
}
