/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  InputRow,
  NavigationRow,
  Section,
  SelectRow,
  SelectSection,
  TriStateSelectRow,
  type FlowSectionElement,
  type FormItemElement,
  type FormSectionElement,
  type ListSectionElement,
  type SearchQuery,
} from "@paperback/types";

import { MangaDotNet } from "../main";
import { ORIGIN, STATUS, type SearchMetadata } from "../models";
import {
  defaultMetadata,
  deNormalizeId,
  getFilters,
  getShowAdultStatus,
  normalizeId,
} from "../utils";

class MangaDotNetAdvancedSearchForm extends AdvancedSearchForm {
  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }

  private searchMetadata: SearchMetadata;

  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = defaultMetadata();
    }
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", this.getGenresFilter()),
      Section("status", this.getStatusFilter()),
      Section("origin", this.getOriginFilter()),
      Section("adult", [
        SelectRow("adultToggle", {
          title: "Show Adult results",
          value: this.searchMetadata.adult ?? getShowAdultStatus(),
          options: [
            { id: "0", title: "No" },
            { id: "1", title: "Yes" },
            { id: "both", title: "Both" },
          ],
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as MangaDotNetAdvancedSearchForm, "handleAdult"),
        }),
      ]),
      Section("author", [
        NavigationRow("author_filter", {
          title: "Authors",
          subtitle: this.searchMetadata.author?.flatMap(deNormalizeId).join(", ") ?? "",
          form: new AuthorFilter(this.searchMetadata),
        }),
      ]),
      Section("artist", [
        NavigationRow("artist_filter", {
          title: "Artists",
          subtitle: this.searchMetadata.artist?.flatMap(deNormalizeId).join(", ") ?? "",
          form: new ArtistFilter(this.searchMetadata),
        }),
      ]),
    ];
  }

  getGenresFilter(): FormItemElement<unknown>[] {
    return [
      TriStateSelectRow("genres", {
        title: "Genres",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotNetAdvancedSearchForm, "handleGenres"),
        items: getFilters().genre,
        value: this.searchMetadata.genres ?? {},
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      }),
      TriStateSelectRow("demographic", {
        title: "Demographic",
        layout: "list",
        onValueChange: Application.Selector(
          this as MangaDotNetAdvancedSearchForm,
          "handleDemographic",
        ),
        items: getFilters().demographic,
        value: this.searchMetadata.demographic ?? {},
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      }),
      TriStateSelectRow("themes", {
        title: "Themes",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotNetAdvancedSearchForm, "handleThemes"),
        items: getFilters().themeAndContent,
        value: this.searchMetadata.themes ?? {},
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      }),
      TriStateSelectRow("more", {
        title: "More",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotNetAdvancedSearchForm, "handleMore"),
        items: getFilters().more,
        value: this.searchMetadata.more ?? {},
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      }),
    ];
  }

  getStatusFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("status", {
        title: "Status",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotNetAdvancedSearchForm, "handleStatus"),
        items: STATUS,
        value:
          this.searchMetadata.status && this.searchMetadata.status.length > 0
            ? this.searchMetadata.status
            : [""],
        minItemCount: 1,
        maxItemCount: 1,
        isHidden: false,
      }),
    ];
  }

  getOriginFilter(): FormItemElement<unknown>[] {
    return [
      SelectRow("origin", {
        title: "Origin",
        layout: "list",
        onValueChange: Application.Selector(this as MangaDotNetAdvancedSearchForm, "handleOrigin"),
        items: ORIGIN,
        value:
          this.searchMetadata.origin && this.searchMetadata.origin.length > 0
            ? this.searchMetadata.origin
            : [""],
        minItemCount: 1,
        maxItemCount: ORIGIN.length,
        isHidden: false,
      }),
    ];
  }

  async handleAdult(value: string[]): Promise<void> {
    this.searchMetadata.adult = value;
  }

  async handleDemographic(value: { [id: string]: "included" | "excluded" }): Promise<void> {
    this.searchMetadata.demographic = value;
  }

  async handleThemes(value: { [id: string]: "included" | "excluded" }): Promise<void> {
    this.searchMetadata.themes = value;
  }

  async handleMore(value: { [id: string]: "included" | "excluded" }): Promise<void> {
    this.searchMetadata.more = value;
  }

  async handleGenres(value: { [id: string]: "included" | "excluded" }): Promise<void> {
    this.searchMetadata.genres = value;
  }

  async handleStatus(value: string[]): Promise<void> {
    this.searchMetadata.status = value;
  }

  async handleOrigin(value: string[]): Promise<void> {
    const previous = this.searchMetadata?.origin ?? [""];
    const hadAnyBefore = previous.includes("");
    const hasAnyNow = value.includes("");
    if (hadAnyBefore && value.length > 1) {
      value = value.filter((v) => v !== "");
    } else if (!hadAnyBefore && hasAnyNow) {
      value = [""];
    }
    this.searchMetadata.origin = value;
  }
}

class AuthorFilter extends AdvancedSearchForm {
  private authorMetadata: SearchMetadata;

  constructor(authorMetadata: SearchMetadata) {
    super();
    if (authorMetadata !== undefined) {
      this.authorMetadata = authorMetadata;
    } else {
      this.authorMetadata = {
        author: [],
      };
    }
    this.savedAuthorFiltered = this.authorMetadata.author ? this.authorMetadata.author : [];
  }

  override getSearchQueryMetadata(): SearchMetadata {
    if (this.savedAuthorFiltered.length > 0) {
      this.authorMetadata.author = this.savedAuthorFiltered;
    }
    return this.authorMetadata;
  }

  override async formDidSubmit(): Promise<void> {
    if (this.savedAuthorFiltered.length > 0) {
      this.authorMetadata.author = this.savedAuthorFiltered;
    }
  }

  private authorFiltered: string[] = [];
  private savedAuthorFiltered: string[] = [];
  private searchedValue: string = "";

  override getSections(): (ListSectionElement | FlowSectionElement)[] {
    return this.getAuthorFilter();
  }

  getAuthorFilter(): (ListSectionElement | FlowSectionElement)[] {
    return [
      Section("author", [
        InputRow("author", {
          title: "Search Author",
          value: this.searchedValue,
          onValueChange: Application.Selector(this as AuthorFilter, "handleAuthorLabel"),
        }),
      ]),
      ...(this.authorFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "authorSearch",
              layout: "list",
              value: this.savedAuthorFiltered ?? [],
              items: this.authorFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.authorFiltered.length,
            }),
          ]
        : []),
      ...(this.savedAuthorFiltered && this.savedAuthorFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "selections",
              layout: "list",
              value: this.savedAuthorFiltered ?? [],
              items: this.savedAuthorFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.savedAuthorFiltered.length,
            }),
          ]
        : []),
    ];
  }

  async handleAuthorLabel(value: string): Promise<void> {
    this.searchedValue = value;
    if (value.length > 2) {
      const authors = await MangaDotNet.api.getAuthor(value);
      this.authorFiltered = authors.suggestions;
    }
  }
}

class ArtistFilter extends AdvancedSearchForm {
  private artistMetadata: SearchMetadata;

  constructor(artistMetadata: SearchMetadata) {
    super();
    if (artistMetadata !== undefined) {
      this.artistMetadata = artistMetadata;
    } else {
      this.artistMetadata = {
        artist: [],
      };
    }
    this.savedArtistFiltered = this.artistMetadata.artist ? this.artistMetadata.artist : [];
  }

  override getSearchQueryMetadata(): SearchMetadata {
    if (this.savedArtistFiltered.length > 0) {
      this.artistMetadata.artist = this.savedArtistFiltered;
    }
    return this.artistMetadata;
  }

  override async formDidSubmit(): Promise<void> {
    if (this.savedArtistFiltered.length > 0) {
      this.artistMetadata.artist = this.savedArtistFiltered;
    }
  }

  private artistsFiltered: string[] = [];
  private savedArtistFiltered: string[] = [];
  private searchedValue: string = "";

  override getSections(): (ListSectionElement | FlowSectionElement)[] {
    return this.getArtistsFilter();
  }

  getArtistsFilter(): (ListSectionElement | FlowSectionElement)[] {
    return [
      Section("artist", [
        InputRow("artist", {
          title: "Search Artist",
          value: this.searchedValue,
          onValueChange: Application.Selector(this as ArtistFilter, "handleArtistLabel"),
        }),
      ]),
      ...(this.artistsFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "artistSearch",
              layout: "list",
              value: this.savedArtistFiltered ?? [],
              items: this.artistsFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.artistsFiltered.length,
            }),
          ]
        : []),
      ...(this.savedArtistFiltered && this.savedArtistFiltered.length > 0
        ? [
            SelectSection(this, {
              id: "selections",
              layout: "list",
              value: this.savedArtistFiltered ?? [],
              items: this.savedArtistFiltered.map((elem) => ({
                id: normalizeId(elem),
                title: deNormalizeId(elem),
              })),
              minItemCount: 0,
              maxItemCount: this.savedArtistFiltered.length,
            }),
          ]
        : []),
    ];
  }

  async handleArtistLabel(value: string): Promise<void> {
    this.searchedValue = value;
    if (value.length > 2) {
      const artists = await MangaDotNet.api.getArtist(value);
      this.artistsFiltered = artists.suggestions;
    }
  }
}

export default MangaDotNetAdvancedSearchForm;
