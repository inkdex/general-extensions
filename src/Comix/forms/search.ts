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
import {
  contentRatings,
  contentTypes,
  filters,
  getContentRating,
  publicationStatuses,
} from "../utils/filters";

export class ComixAdvancedSearchForm extends AdvancedSearchForm {
  private metadata: SearchMetadata;
  private mode: string[];

  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    this.metadata = searchQuery.metadata ?? {};
    this.mode = this.metadata.mode ?? ["and"];
  }

  override getSearchQueryMetadata(): SearchMetadata {
    this.metadata.mode = this.mode;
    return this.metadata;
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "list",
          value: this.metadata.genres ?? {},
          items: filters.genres,
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
          value: this.metadata.demographic ?? {},
          items: filters.demographic,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(this as ComixAdvancedSearchForm, "handleDemogChange"),
        }),
      ]),
      Section("status", [
        TriStateSelectRow("status", {
          title: "Status",
          layout: "list",
          value: this.metadata.status ?? {},
          items: publicationStatuses,
          allowExclusion: false,
          allowEmptySelection: true,
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
          value: this.metadata.types ?? {},
          items: contentTypes,
          allowExclusion: false,
          allowEmptySelection: true,
          onValueChange: Application.Selector(this as ComixAdvancedSearchForm, "handleTypesChange"),
        }),
      ]),
      Section("formats", [
        TriStateSelectRow("formats", {
          title: "Formats",
          layout: "list",
          value: this.metadata.formats ?? {},
          items: filters.formats,
          allowExclusion: false,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as ComixAdvancedSearchForm,
            "handleFormatsChange",
          ),
        }),
      ]),
      SelectSection(this, {
        id: "mode",
        layout: "flow",
        value: this.mode,
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
          value: this.metadata.minChap ?? 0,
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
          value: this.metadata.contentRating ?? getContentRating(),
          items: contentRatings,
          layout: "list",
          minItemCount: 1,
          maxItemCount: contentRatings.length,
          onValueChange: Application.Selector(
            this as ComixAdvancedSearchForm,
            "handleContentRating",
          ),
        }),
      ]),
    ];
  }

  async handleGenresChange(value: TagMap): Promise<void> {
    this.metadata.genres = value;
  }
  async handleDemogChange(value: TagMap): Promise<void> {
    this.metadata.demographic = value;
  }
  async handleStatusChange(value: TagMap): Promise<void> {
    this.metadata.status = value;
  }
  async handleTypesChange(value: TagMap): Promise<void> {
    this.metadata.types = value;
  }
  async handleFormatsChange(value: TagMap): Promise<void> {
    this.metadata.formats = value;
  }
  async handleMinChapters(value: number): Promise<void> {
    this.metadata.minChap = value;
  }
  async handleContentRating(value: string[]): Promise<void> {
    this.metadata.contentRating = value;
  }
}
