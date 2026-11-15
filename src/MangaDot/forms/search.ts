/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  InputRow,
  MenuRow,
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

import { MangaDot, MangaDotFilters } from "../main";
import {
  ADULT_FILTER,
  CHAPTERS_NUM,
  CONTENT_RATING,
  IN_LIBRARY,
  ORIGIN,
  RATING,
  type SearchMetadata,
  STATUS,
  type TagItem,
  VOLUME,
} from "../models";
import type { LogInManager } from "../network";
import {
  defaultMetadata,
  deNormalizeId,
  generateTagElement,
  getShowAdultStatus,
  normalizeId,
} from "../utils";
const PROXY_HANDLERS = {
  handle_: "onHandleDynamicTag",
} as const;

function matchProxyHandler(p: string | symbol) {
  if (typeof p !== "string") return undefined;
  for (const [prefix, method] of Object.entries(PROXY_HANDLERS)) {
    if (p.startsWith(prefix)) return { method, rowId: p.slice(prefix.length) };
  }
  return undefined;
}
class MangaDotAdvancedSearchForm extends AdvancedSearchForm {
  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }

  private searchMetadata: SearchMetadata;
  private origin: string[] = [""];
  private login: LogInManager;
  constructor(searchQuery: SearchQuery<SearchMetadata>, login: LogInManager) {
    super();
    this.login = login;
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = defaultMetadata();
    }
    this.origin =
      this.searchMetadata.origin && this.searchMetadata.origin.length > 0
        ? this.searchMetadata.origin
        : [""];
  }

  override async formDidSubmit(): Promise<void> {
    this.searchMetadata.origin = this.origin;
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section({ id: "tags", header: "Tags" }, this.getTagsFilter()),
      SelectSection(this, {
        header: "Origin",
        id: "origin",
        layout: "list",
        value: this.origin ?? [""],
        items: ORIGIN,
        minItemCount: 1,
        maxItemCount: ORIGIN.length,
      }),
      Section("filters", [
        MenuRow("status", {
          title: "Status",
          items: STATUS,
          value:
            this.searchMetadata.status && this.searchMetadata.status.length > 0
              ? this.searchMetadata.status
              : "",
          onSelect: Application.Selector(this as MangaDotAdvancedSearchForm, "handleStatus"),
        }),
        MenuRow("adult_filter", {
          title: "Adult Filter",
          value: this.searchMetadata.adult ? this.searchMetadata.adult : getShowAdultStatus(),
          items: ADULT_FILTER,
          onSelect: Application.Selector(this as MangaDotAdvancedSearchForm, "handleAdult"),
        }),
        MenuRow("content_rating", {
          title: "Content Rating",
          value: this.searchMetadata.contentRating ? this.searchMetadata.contentRating : "any",
          items: CONTENT_RATING,
          onSelect: Application.Selector(this as MangaDotAdvancedSearchForm, "handleContentRating"),
        }),
        MenuRow("has_volume", {
          title: "Has Volume",
          value: this.searchMetadata.volume ? this.searchMetadata.volume : "any",
          items: VOLUME,
          onSelect: Application.Selector(this as MangaDotAdvancedSearchForm, "handleVolume"),
        }),
        MenuRow("chap_number", {
          title: "Chapter Number",
          value: this.searchMetadata.chapters ? this.searchMetadata.chapters : "any",
          items: CHAPTERS_NUM,
          onSelect: Application.Selector(this as MangaDotAdvancedSearchForm, "handleMinChapters"),
        }),
        MenuRow("minimum_rating", {
          title: "Minimum Rating",
          value: this.searchMetadata.rating ? this.searchMetadata.rating : "any",
          items: RATING,
          onSelect: Application.Selector(this as MangaDotAdvancedSearchForm, "handleMinRating"),
        }),
        ...(this.login.isLoggedIn()
          ? [
              MenuRow("stat", {
                title: "In Library",
                value: this.searchMetadata.library ? this.searchMetadata.library : "any",
                items: IN_LIBRARY,
                onSelect: Application.Selector(this as MangaDotAdvancedSearchForm, "handleLibrary"),
              }),
            ]
          : []),
        SelectRow("language", {
          title: "Language",
          value: this.searchMetadata.language ?? [""],
          options: MangaDotFilters.getFilters().language,
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as MangaDotAdvancedSearchForm, "handleLanguage"),
        }),
      ]),
      Section({ id: "author_artist", header: "Author & Artist" }, [
        NavigationRow("author_filter", {
          title: "Authors",
          subtitle: this.searchMetadata.author?.flatMap(deNormalizeId).join(", ") ?? "",
          form: new AuthorFilter(this.searchMetadata),
        }),
        NavigationRow("artist_filter", {
          title: "Artists",
          subtitle: this.searchMetadata.artist?.flatMap(deNormalizeId).join(", ") ?? "",
          form: new ArtistFilter(this.searchMetadata),
        }),
      ]),
    ];
  }

  getTagsFilter(): FormItemElement<unknown>[] {
    return Object.entries(MangaDotFilters.getTags()).map(([categoryName, tags]) => {
      const rowId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const itemsArray = tags.map((tag: TagItem) => ({
        id: normalizeId(tag.name),
        title: tag.name,
      }));
      let rowInitialValue: Record<string, "included" | "excluded"> = {};
      if (this.searchMetadata.genres && rowId === "genres") {
        rowInitialValue = this.searchMetadata.genres;
      } else if (this.searchMetadata.tag) {
        for (const tag of tags) {
          const index = normalizeId(tag.name);
          if (this.searchMetadata.tag[index]) {
            rowInitialValue[index] = this.searchMetadata.tag[index];
          }
        }
      }
      return TriStateSelectRow(rowId, {
        title: categoryName,
        layout: "list",
        onValueChange: this.proxySel(`handle_${rowId}`),
        items: itemsArray,
        value: rowInitialValue,
        allowEmptySelection: true,
        allowExclusion: true,
        isHidden: false,
      });
    });
  }

  private rowStates: Record<string, Record<string, "included" | "excluded">> = {};

  onValueChangeLabelProxy = new Proxy(this, {
    has(target, p) {
      return matchProxyHandler(p) !== undefined ? true : Object.hasOwn(target, p);
    },
    get(target, p) {
      const handler = matchProxyHandler(p);
      if (handler) {
        const fn = target[handler.method] as (rowId: string, value?: any) => Promise<void>;
        return async (value?: any) => {
          await fn.call(target, handler.rowId, value);
        };
      }
      // @ts-ignore
      return target[p];
    },
  });

  private proxySel(name: string): any {
    // @ts-expect-error dynamic selector
    return Application.Selector(this.onValueChangeLabelProxy, name);
  }

  async onHandleDynamicTag(
    rowId: string,
    value: { [id: string]: "included" | "excluded" },
  ): Promise<void> {
    if (rowId === "genres") {
      this.searchMetadata.genres = value;
    } else {
      this.rowStates[rowId] = value;
      const mergedTags: Record<string, "included" | "excluded"> = {};
      for (const rowState of Object.values(this.rowStates)) {
        Object.assign(mergedTags, rowState);
      }
      this.searchMetadata.tag = mergedTags;
    }
  }

  async handleLanguage(value: string[]): Promise<void> {
    this.searchMetadata.language = value;
  }

  async handleStatus(value: string): Promise<void> {
    this.searchMetadata.status = value;
  }

  async handleAdult(value: string): Promise<void> {
    this.searchMetadata.adult = value;
  }
  async handleContentRating(value: string): Promise<void> {
    this.searchMetadata.contentRating = value;
  }
  async handleMinChapters(value: string): Promise<void> {
    this.searchMetadata.chapters = value;
  }
  async handleVolume(value: string): Promise<void> {
    this.searchMetadata.volume = value;
  }
  async handleMinRating(value: string): Promise<void> {
    this.searchMetadata.rating = value;
  }
  async handleLibrary(value: string): Promise<void> {
    this.searchMetadata.library = value;
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
              items: this.authorFiltered.map((elem) => generateTagElement(elem)),
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
              items: this.savedAuthorFiltered.map((elem) => generateTagElement(elem)),
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
              items: this.artistsFiltered.map((elem) => generateTagElement(elem)),
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
              items: this.savedArtistFiltered.map((elem) => generateTagElement(elem)),
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
