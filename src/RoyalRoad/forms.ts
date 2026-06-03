/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  Form,
  InputRow,
  Section,
  SelectRow,
  ToggleRow,
  TriStateSelectRow,
  type FormSectionElement,
  type ToggleRowProps,
  type FormItemElement,
  type SearchQuery,
} from "@paperback/types";

import {
  CONTENT_WARNINGS,
  GENRES,
  STATUSES,
  STORY_TYPES,
  TAGS,
  type SearchMetadata,
  type TriState,
} from "./models";

export class RoyalRoadAdvancedSearchForm extends AdvancedSearchForm {
  private searchMetadata: SearchMetadata;

  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    this.searchMetadata = searchQuery.metadata ?? {};
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("author", [
        InputRow("author", {
          title: "Author",
          value: this.searchMetadata.author ?? "",
          onValueChange: Application.Selector(
            this as RoyalRoadAdvancedSearchForm,
            "handleAuthorChange",
          ),
        }),
      ]),
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.searchMetadata.genres ?? {},
          items: GENRES.map((genre) => ({ id: genre.id, title: genre.title })),
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as RoyalRoadAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
      ]),
      Section("tags", [
        TriStateSelectRow("tags", {
          title: "Tags",
          layout: "flow",
          value: this.searchMetadata.tags ?? {},
          items: TAGS.map((tag) => ({ id: tag.id, title: tag.title })),
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as RoyalRoadAdvancedSearchForm,
            "handleTagsChange",
          ),
        }),
      ]),
      Section("contentWarnings", [
        SelectRow("contentWarnings", {
          title: "Content Warnings",
          layout: "flow",
          value: this.searchMetadata.contentWarnings ?? [],
          minItemCount: 0,
          maxItemCount: CONTENT_WARNINGS.length,
          items: CONTENT_WARNINGS.map((warning) => ({ id: warning.id, title: warning.title })),
          onValueChange: Application.Selector(
            this as RoyalRoadAdvancedSearchForm,
            "handleContentWarningsChange",
          ),
        }),
      ]),
      Section("status", [
        SelectRow("status", {
          title: "Status",
          layout: "list",
          value: this.searchMetadata.status ? [this.searchMetadata.status] : ["ALL"],
          minItemCount: 0,
          maxItemCount: 1,
          items: STATUSES.map((status) => ({ id: status.id, title: status.title })),
          onValueChange: Application.Selector(
            this as RoyalRoadAdvancedSearchForm,
            "handleStatusChange",
          ),
        }),
      ]),
      Section("type", [
        SelectRow("type", {
          title: "Type of Story",
          layout: "list",
          value: this.searchMetadata.type ? [this.searchMetadata.type] : ["ALL"],
          minItemCount: 0,
          maxItemCount: 1,
          items: STORY_TYPES.map((type) => ({ id: type.id, title: type.title })),
          onValueChange: Application.Selector(
            this as RoyalRoadAdvancedSearchForm,
            "handleTypeChange",
          ),
        }),
      ]),
      Section("order", [
        ToggleRow("ascending", {
          title: "Sort Ascending",
          subtitle: "Toggle on to sort in ascending order",
          value: this.searchMetadata.ascending ?? false,
          onValueChange: Application.Selector(
            this as RoyalRoadAdvancedSearchForm,
            "handleAscendingChange",
          ),
        }),
      ]),
    ];
  }

  async handleAuthorChange(value: string): Promise<void> {
    this.searchMetadata.author = value;
  }

  async handleGenresChange(value: TriState): Promise<void> {
    this.searchMetadata.genres = value;
  }

  async handleTagsChange(value: TriState): Promise<void> {
    this.searchMetadata.tags = value;
  }

  async handleContentWarningsChange(value: string[]): Promise<void> {
    this.searchMetadata.contentWarnings = value;
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.searchMetadata.status = value[0];
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.searchMetadata.type = value[0];
  }

  async handleAscendingChange(value: boolean): Promise<void> {
    this.searchMetadata.ascending = value;
  }
}

// SettingsFormProvider

export class RoyalRoadSettingsForm extends Form {
  override getSections() {
    return [
      Section(
        {
          id: "royalroad-settings",
        },
        [this.showAuthorNoteRow()],
      ),
    ];
  }

  showAuthorNoteRow(): FormItemElement<unknown> {
    const toggleProps: ToggleRowProps = {
      title: "Show Author Note",
      value: getAuthorNoteSettings(),
      onValueChange: Application.Selector(this as RoyalRoadSettingsForm, "handleAuthorNoteChange"),
    };

    return ToggleRow("show-author-note", toggleProps);
  }

  async handleAuthorNoteChange(value: boolean): Promise<void> {
    setAuthorNoteSettings(value);
    this.reloadForm();
  }
}

export function getAuthorNoteSettings(): boolean {
  return (Application.getState("royalroad-author-note") as boolean | undefined) ?? true;
}

export function setAuthorNoteSettings(value: boolean): void {
  Application.setState(value, "royalroad-author-note");
}
