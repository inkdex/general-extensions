/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  ButtonRow,
  Form,
  Section,
  SelectRow,
  ToggleRow,
  type FormItemElement,
  type FormSectionElement,
  type SearchQuery,
  type TagSection,
} from "@paperback/types";

import { getTagFromTagStore } from "./helpers";
import { EMPTY_SEARCH_METADATA, TagSectionId, type SearchMetadata } from "./models";

export class SettingsForm extends Form {
  override getSections() {
    return [
      Section("tags", [
        ButtonRow("clearTags", {
          title: "Clear Cached Search Tags",
          onSelect: Application.Selector(this as SettingsForm, "clearTags"),
        }),
      ]),
    ];
  }

  async clearTags(): Promise<void> {
    Application.setState(undefined, "tags");
  }
}

export class WeebCentralAdvancedSearchForm extends AdvancedSearchForm {
  private searchMetadata: SearchMetadata;
  private tags: TagSection[];
  constructor(searchQuery: SearchQuery<SearchMetadata>, tags: TagSection[]) {
    super();
    this.searchMetadata = searchQuery.metadata ?? EMPTY_SEARCH_METADATA;
    this.tags = tags;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", this.getGenresFilter(this.tags)),
      Section("seriesStatus", this.getSeriesStatusFilter(this.tags)),
      Section("seriesType", this.getSeriesTypesFilter(this.tags)),
      Section("order", this.getOrderFilter()),
    ];
  }

  getGenresFilter(tags: TagSection[]): FormItemElement<unknown>[] {
    const tag = getTagFromTagStore(TagSectionId.Genres, tags);
    return [
      SelectRow("genres", {
        title: tag.title,
        subtitle: "Select the genre(s) to include in search results",
        value: this.searchMetadata.genres ?? [],
        minItemCount: 0,
        maxItemCount: tag.tags.length,
        options: tag.tags.map((x) => ({ id: x.id, title: x.title })),
        onValueChange: Application.Selector(
          this as WeebCentralAdvancedSearchForm,
          "handleGenresChange",
        ),
      }),
    ];
  }

  async handleGenresChange(value: string[]): Promise<void> {
    this.searchMetadata.genres = value;
  }

  getSeriesStatusFilter(tags: TagSection[]): FormItemElement<unknown>[] {
    const tag = getTagFromTagStore(TagSectionId.SeriesStatus, tags);
    return [
      SelectRow("seriesStatus", {
        title: tag.title,
        subtitle: "Select the series status(es) to include in search results",
        value: this.searchMetadata.seriesStatuses ?? [],
        minItemCount: 0,
        maxItemCount: tag.tags.length,
        options: tag.tags.map((x) => ({ id: x.id, title: x.title })),
        onValueChange: Application.Selector(
          this as WeebCentralAdvancedSearchForm,
          "handleSeriesStatusChange",
        ),
      }),
    ];
  }

  async handleSeriesStatusChange(value: string[]): Promise<void> {
    this.searchMetadata.seriesStatuses = value;
  }

  getSeriesTypesFilter(tags: TagSection[]): FormItemElement<unknown>[] {
    const tag = getTagFromTagStore(TagSectionId.SeriesType, tags);
    return [
      SelectRow("seriesType", {
        title: "Series Type",
        subtitle: "Select the series type(s) to include in search results",
        value: this.searchMetadata.seriesTypes ?? [],
        minItemCount: 0,
        maxItemCount: tag.tags.length,
        options: tag.tags.map((x) => ({ id: x.id, title: x.title })),
        onValueChange: Application.Selector(
          this as WeebCentralAdvancedSearchForm,
          "handleSeriesTypeChange",
        ),
      }),
    ];
  }

  async handleSeriesTypeChange(value: string[]): Promise<void> {
    this.searchMetadata.seriesTypes = value;
  }

  getOrderFilter(): FormItemElement<unknown>[] {
    return [
      ToggleRow("order", {
        title: "Order Descending",
        subtitle: "Toggle on to sort in descending order",
        value: this.searchMetadata.orderIsDescending ?? false,
        onValueChange: Application.Selector(
          this as WeebCentralAdvancedSearchForm,
          "handleOrderChange",
        ),
      }),
    ];
  }

  async handleOrderChange(value: boolean): Promise<void> {
    this.searchMetadata.orderIsDescending = value;
  }
}
