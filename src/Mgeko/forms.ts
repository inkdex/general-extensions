/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  Form,
  LabelRow,
  SelectRow,
  Section,
  StepperRow,
  ToggleRow,
  TriStateSelectRow,
  type SearchQuery,
  type Tag,
  type TagSection,
} from "@paperback/types";

import type { SearchMetadata } from "./models";

const SAFE_MODE_KEY = "safe_mode";

export function getSafeMode(): boolean {
  return (Application.getState(SAFE_MODE_KEY) ?? true) as boolean;
}

export class MgekoSettingsForm extends Form {
  override getSections() {
    return [
      Section("content", [
        ToggleRow("safeMode", {
          title: "Safe Mode",
          subtitle: "Hide NSFW content in discover and search. Enabled by default.",
          value: getSafeMode(),
          onValueChange: Application.Selector(this as MgekoSettingsForm, "handleSafeModeChange"),
        }),
      ]),
    ];
  }

  async handleSafeModeChange(value: boolean): Promise<void> {
    Application.setState(value, SAFE_MODE_KEY);
  }
}

export class MgekoAdvancedSearchForm extends AdvancedSearchForm {
  private readonly genreOptions: Tag[] = [];
  private readonly statusOptions: Tag[] = [];
  private readonly typeOptions: Tag[] = [];
  private genres: Record<string, "included" | "excluded">;
  private status: string;
  private type: string;
  private isQuerySearch: boolean;
  private setChapterCount: boolean;
  private minChapters: number;
  private maxChapters: number;

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
    this.genres = { ...meta.genres };
    this.status = meta.status ?? "";
    this.type = meta.type ?? "";
    this.setChapterCount = meta.setChapterCount ?? false;
    this.minChapters = meta.minChapters ?? 0;
    this.maxChapters = meta.maxChapters ?? 9995;
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
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: this.genreOptions,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as MgekoAdvancedSearchForm,
            "handleGenresChange",
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
      Section("chapters", [
        ToggleRow("setChapterCount", {
          title: "Set Chapter Count",
          value: this.setChapterCount,
          onValueChange: Application.Selector(
            this as MgekoAdvancedSearchForm,
            "handleSetChapterCountChange",
          ),
        }),
        StepperRow("minChapters", {
          title: "Minimum Chapters",
          value: this.minChapters,
          minValue: 0,
          maxValue: 9995,
          stepValue: 10,
          loopOver: false,
          onValueChange: Application.Selector(
            this as MgekoAdvancedSearchForm,
            "handleMinChaptersChange",
          ),
          isHidden: !this.setChapterCount,
        }),
        StepperRow("maxChapters", {
          title: "Maximum Chapters",
          value: this.maxChapters,
          minValue: 0,
          maxValue: 9995,
          stepValue: 10,
          loopOver: false,
          onValueChange: Application.Selector(
            this as MgekoAdvancedSearchForm,
            "handleMaxChaptersChange",
          ),
          isHidden: !this.setChapterCount,
        }),
      ]),
    ];
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = value;
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.status = value[0] ?? "";
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.type = value[0] ?? "";
  }

  async handleSetChapterCountChange(value: boolean): Promise<void> {
    this.setChapterCount = value;
    this.reloadForm();
  }

  async handleMinChaptersChange(value: number): Promise<void> {
    this.minChapters = value;
  }

  async handleMaxChaptersChange(value: number): Promise<void> {
    this.minChapters = value;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (Object.keys(this.genres).length > 0) result.genres = this.genres;
    if (this.status) result.status = this.status;
    if (this.type) result.type = this.type;
    return result;
  }
}
