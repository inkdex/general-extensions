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
  ToggleRow,
  type FlowSectionElement,
  type FormItemElement,
  type FormSectionElement,
  type ListSectionElement,
  type SearchQuery,
} from "@paperback/types";

import { MangaDot } from "../main";
import { ORIGIN, STATUS, type SearchMetadata } from "../models";
import { defaultMetadata, deNormalizeId, getGenres, normalizeId } from "../utils";

class MangaDotAdvancedSearchForm extends AdvancedSearchForm {
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
        ToggleRow("adultToggle", {
          title: "Show Adult results",
          value: this.searchMetadata.adult ?? false,
          onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleAdult"),
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
        onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleGenres"),
        items: getGenres(),
        value: this.searchMetadata.genres ?? {},
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
        onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleStatus"),
        items: STATUS,
        value: this.searchMetadata.status ?? [""],
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
        onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleOrigin"),
        items: ORIGIN,
        value: this.searchMetadata.origin ?? [""],
        minItemCount: 1,
        maxItemCount: ORIGIN.length,
        isHidden: false,
      }),
    ];
  }

  async handleAdult(value: boolean): Promise<void> {
    this.searchMetadata.adult = value;
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
      const authors = await MangaDot.api.getAuthor(value);
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
      const artists = await MangaDot.api.getArtist(value);
      this.artistsFiltered = artists.suggestions;
    }
  }
}

export default MangaDotAdvancedSearchForm;
