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

import type { OptionItem, SearchMetadata, FlameFilter } from "../models";

export class FlameAdvancedSearchForm extends AdvancedSearchForm {
  private categories: Record<string, "included" | "excluded">;
  private categoriesMode: ["or" | "and"];
  private types: string[];
  private publisher: Record<string, "included" | "excluded">;
  private status: string[];
  private author: Record<string, "included" | "excluded">;
  private artist: Record<string, "included" | "excluded">;
  private year: string[];
  private language: string;
  private country: string;

  private readonly categoriesOptions: Tag[];
  private readonly typesOptions: Tag[];
  private readonly publisherOptions: Tag[];
  private readonly statusOptions: Tag[];
  private readonly authorOptions: Tag[];
  private readonly artistOptions: Tag[];
  private readonly yearOptions: Tag[];
  private readonly languageOptions: Tag[];
  private readonly countryOptions: Tag[];

  constructor(searchQuery: SearchQuery<SearchMetadata>, searchDetails: FlameFilter | undefined) {
    super();

    const toTags = (options: OptionItem[] | undefined): Tag[] =>
      (options ?? []).map((option) => ({ id: option.id, title: option.value }));

    this.categoriesOptions = toTags(searchDetails?.categories);
    this.typesOptions = toTags(searchDetails?.types);
    this.publisherOptions = toTags(searchDetails?.publisher);
    this.statusOptions = toTags(searchDetails?.status);
    this.authorOptions = toTags(searchDetails?.author);
    this.artistOptions = toTags(searchDetails?.artist);
    this.yearOptions = toTags(searchDetails?.year);
    this.languageOptions = toTags(searchDetails?.language);
    this.countryOptions = toTags(searchDetails?.country);

    const meta = searchQuery.metadata ?? {};
    this.categories = { ...meta.categories };
    this.categoriesMode = [meta.categoriesMode ?? "or"];
    this.types = meta.types ?? [];
    this.publisher = { ...meta.publisher };
    this.status = meta.status ?? [];
    this.author = { ...meta.author };
    this.artist = { ...meta.artist };
    this.year = meta.year ?? [];
    this.language = meta.language ?? "";
    this.country = meta.country ?? "";
  }

  override getSections() {
    return [
      Section("categories", [
        TriStateSelectRow("categories", {
          title: "Categories",
          layout: "flow",
          value: this.categories,
          items: this.categoriesOptions,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as FlameAdvancedSearchForm,
            "handleCategoriesChange",
          ),
        }),
      ]),
      SelectSection(this, {
        id: "categories_mode",
        layout: "flow",
        value: this.categoriesMode ?? "or",
        items: [
          { id: "and", title: "AND" },
          { id: "or", title: "OR" },
        ],
        minItemCount: 1,
        maxItemCount: 1,
      }),
      Section("types", [
        SelectRow("types", {
          title: "Types",
          value: this.types,
          options: this.typesOptions,
          minItemCount: 0,
          maxItemCount: this.typesOptions.length,
          onValueChange: Application.Selector(this as FlameAdvancedSearchForm, "handleTypesChange"),
        }),
      ]),

      Section("publisher", [
        TriStateSelectRow("publisher", {
          title: "Publisher",
          layout: "flow",
          value: this.publisher,
          items: this.publisherOptions,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as FlameAdvancedSearchForm,
            "handlePublisherChange",
          ),
        }),
      ]),

      Section("status", [
        SelectRow("status", {
          title: "Status",
          value: this.status,
          options: this.statusOptions,
          minItemCount: 0,
          maxItemCount: this.statusOptions.length,
          onValueChange: Application.Selector(
            this as FlameAdvancedSearchForm,
            "handleStatusChange",
          ),
        }),
      ]),
      Section("author", [
        TriStateSelectRow("author", {
          title: "Author",
          layout: "flow",
          value: this.author,
          items: this.authorOptions,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as FlameAdvancedSearchForm,
            "handleAuthorChange",
          ),
        }),
      ]),
      Section("artist", [
        TriStateSelectRow("artist", {
          title: "Artist",
          layout: "flow",
          value: this.artist,
          items: this.artistOptions,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as FlameAdvancedSearchForm,
            "handleArtistChange",
          ),
        }),
      ]),
      Section("year", [
        SelectRow("year", {
          title: "Year",
          value: this.year,
          options: this.yearOptions,
          minItemCount: 0,
          maxItemCount: this.yearOptions.length,
          onValueChange: Application.Selector(this as FlameAdvancedSearchForm, "handleYearChange"),
        }),
      ]),
      Section("language", [
        SelectRow("language", {
          title: "Language",
          value: this.language ? [this.language] : [],
          options: this.languageOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as FlameAdvancedSearchForm,
            "handleLanguageChange",
          ),
        }),
      ]),
      Section("country", [
        SelectRow("country", {
          title: "Country",
          value: this.country ? [this.country] : [],
          options: this.countryOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as FlameAdvancedSearchForm,
            "handleCountryChange",
          ),
        }),
      ]),
    ];
  }

  async handleCategoriesChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.categories = value;
  }
  async handleTypesChange(value: string[]): Promise<void> {
    this.types = value;
  }

  async handlePublisherChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.publisher = value;
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.status = value;
  }

  async handleAuthorChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.author = value;
  }

  async handleArtistChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.artist = value;
  }

  async handleYearChange(value: string[]): Promise<void> {
    this.year = value;
  }

  async handleLanguageChange(value: string[]): Promise<void> {
    this.language = value[0] ?? "";
  }

  async handleCountryChange(value: string[]): Promise<void> {
    this.country = value[0] ?? "";
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (Object.keys(this.categories).length > 0) result.categories = this.categories;
    if (this.categoriesMode) result.categoriesMode = this.categoriesMode[0];
    if (this.types.length > 0) result.types = this.types;
    if (Object.keys(this.publisher).length > 0) result.publisher = this.publisher;
    if (this.status.length > 0) result.status = this.status;
    if (Object.keys(this.author).length > 0) result.author = this.author;
    if (Object.keys(this.artist).length > 0) result.artist = this.artist;
    if (Object.keys(this.year).length > 0) result.year = this.year;
    if (this.language) result.language = this.language;
    if (this.country) result.country = this.country;
    return result;
  }
}
