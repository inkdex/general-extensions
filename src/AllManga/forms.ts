/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  ContentRating,
  Form,
  Section,
  SelectRow,
  ToggleRow,
  TriStateSelectRow,
  type SearchQuery,
  type Tag,
} from "@paperback/types";

import {
  COUNTRY_OPTIONS,
  genreId,
  GENRE_OPTIONS,
  IMAGE_QUALITY_DEFAULT,
  IMAGE_QUALITY_KEY,
  SHOW_ADULT_KEY,
  type SearchMetadata,
} from "./models";

export function getImageQuality(): string {
  return (Application.getState(IMAGE_QUALITY_KEY) as string | undefined) ?? IMAGE_QUALITY_DEFAULT;
}

export function getShowAdult(): boolean {
  return (Application.getState(SHOW_ADULT_KEY) as boolean | undefined) ?? false;
}

export function contentRatingForAdult(): ContentRating {
  return getShowAdult() ? ContentRating.ADULT : ContentRating.MATURE;
}

export class AllMangaSettingsForm extends Form {
  override getSections() {
    return [
      Section(
        { id: "images", footer: "Wp quality servers can be slower and may occasionally fail." },
        [
          SelectRow("imageQuality", {
            title: "Image Quality",
            value: [getImageQuality()],
            minItemCount: 1,
            maxItemCount: 1,
            options: [
              { id: "original", title: "Original" },
              { id: "800", title: "Wp-800" },
              { id: "480", title: "Wp-480" },
            ],
            onValueChange: Application.Selector(
              this as AllMangaSettingsForm,
              "handleImageQualityChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "content",
          footer: "Show adult/NSFW titles across discover and search. Off by default.",
        },
        [
          ToggleRow("showAdult", {
            title: "Show Adult Content",
            value: getShowAdult(),
            onValueChange: Application.Selector(
              this as AllMangaSettingsForm,
              "handleShowAdultChange",
            ),
          }),
        ],
      ),
    ];
  }

  async handleImageQualityChange(value: string[]): Promise<void> {
    Application.setState(value[0] ?? IMAGE_QUALITY_DEFAULT, IMAGE_QUALITY_KEY);
  }

  async handleShowAdultChange(value: boolean): Promise<void> {
    Application.setState(value, SHOW_ADULT_KEY);
  }
}

const GENRE_TAGS: Tag[] = GENRE_OPTIONS.map((name) => ({
  id: genreId(name),
  title: name,
}));

const COUNTRY_TAGS: Tag[] = COUNTRY_OPTIONS.map((option) => ({
  id: option.id,
  title: option.value,
}));

export class AllMangaAdvancedSearchForm extends AdvancedSearchForm {
  private country: string[];
  private genres: Record<string, "included" | "excluded">;

  constructor(searchQuery: SearchQuery<SearchMetadata>) {
    super();
    const meta = searchQuery.metadata ?? {};
    this.country = meta.country ?? [];
    this.genres = { ...meta.genres };
  }

  override getSections() {
    return [
      Section("country", [
        SelectRow("country", {
          title: "Country",
          layout: "flow",
          value: this.country,
          items: COUNTRY_TAGS,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as AllMangaAdvancedSearchForm,
            "handleCountryChange",
          ),
        }),
      ]),
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: GENRE_TAGS,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as AllMangaAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
      ]),
    ];
  }

  async handleCountryChange(value: string[]): Promise<void> {
    this.country = value;
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = value;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (this.country.length > 0) result.country = this.country;
    if (Object.keys(this.genres).length > 0) result.genres = this.genres;
    return result;
  }
}
