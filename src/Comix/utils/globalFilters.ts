/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type SearchFilter } from "@paperback/types";

import { parse } from "../main";
import { type OptionItem, type TagMap } from "../models";

export class globalFilters {
  genres: OptionItem[] = [];
  themes: OptionItem[] = [];
  demographic: OptionItem[] = [];
  formats: OptionItem[] = [];

  async checkFilters(): Promise<void> {
    if (
      this.demographic.length === 0 ||
      this.formats.length === 0 ||
      this.themes.length === 0 ||
      this.genres.length === 0
    ) {
      await this.updateFilters(true);
    }
  }
  contentType = [
    { id: "manga", value: "Manga" },
    { id: "manhwa", value: "Manhwa" },
    { id: "manhua", value: "Manhua" },
    { id: "other", value: "Other" },
  ];

  publication_status = [
    { id: "finished", value: "Finished" },
    { id: "releasing", value: "Releasing" },
    { id: "on_hiatus", value: "On Hiatus" },
    { id: "discontinued", value: "Discontinued" },
    { id: "not_yet_released", value: "Not Yet Released" },
  ];

  sectionLimit = [
    { id: "1", value: "Day" },
    { id: "7", value: "Week" },
    { id: "30", value: "1 Month" },
    { id: "90", value: "3 Month" },
    { id: "180", value: "6 Month" },
    { id: "365", value: "1 Year" },
  ];

  async getFilters() {
    const filters: SearchFilter[] = [];
    await this.updateFilters(false);
    const genresHidden = this.getHiddenGenresSettings();
    const getExcludedGenreObject = Object.fromEntries(
      this.genres
        .filter((option) => genresHidden.includes(option.id))
        .map((item) => [item.id, "excluded" as const]),
    ) as TagMap;
    const themesHidden = this.getHiddenThemesSettings();
    const getExcludedThemesObject = Object.fromEntries(
      this.genres
        .filter((option) => themesHidden.includes(option.id))
        .map((item) => [item.id, "excluded" as const]),
    ) as TagMap;
    const showOnly = this.getShowOnlySettings();
    const getShowOnlyObject = Object.fromEntries(
      this.contentType
        .filter((option) => showOnly.includes(option.id))
        .map((item) => [item.id, "included" as const]),
    ) as TagMap;

    filters.push({
      type: "multiselect",
      id: "genres",
      title: "Genres",
      options: this.genres,
      value: getExcludedGenreObject,
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: this.genres.length,
    });
    filters.push({
      type: "multiselect",
      id: "themes",
      title: "Themes",
      options: this.themes,
      value: getExcludedThemesObject,
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: this.themes.length,
    });
    filters.push({
      type: "multiselect",
      id: "formats",
      title: "Formats",
      options: this.formats,
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: this.formats.length,
    });
    filters.push({
      type: "dropdown",
      id: "filter_mode",
      title: "Filter Mode",
      value: "and",
      options: [
        { id: "and", value: "AND" },
        { id: "or", value: "OR" },
      ],
    });
    filters.push({
      type: "multiselect",
      id: "types",
      title: "Types",
      options: this.contentType,
      value: getShowOnlyObject,
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: this.contentType.length,
    });
    filters.push({
      type: "multiselect",
      id: "demographic",
      title: "Demographic",
      options: this.demographic,
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: this.demographic.length,
    });
    filters.push({
      type: "multiselect",
      id: "status",
      title: "Status",
      options: this.publication_status,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: this.publication_status.length,
    });
    return filters;
  }

  getHiddenGenresSettings() {
    return (Application.getState("hide_genres") as string[] | undefined) ?? [];
  }

  getHiddenThemesSettings() {
    return (Application.getState("hide_themes") as string[] | undefined) ?? [];
  }

  getHiddenDemogSettings() {
    return (Application.getState("hide_demog") as string[] | undefined) ?? [];
  }

  getShowOnlySettings() {
    return (Application.getState("show_only") as string[] | undefined) ?? [];
  }

  getLimitSettings() {
    return (Application.getState("limit") as string[] | undefined) ?? ["7"];
  }

  getYearSettings() {
    return (
      (Application.getState("year_settings") as number | undefined) ?? new Date().getFullYear() - 1
    );
  }

  async updateFilters(force: boolean) {
    const lastFilterFetch = Number(Application.getState("last-filter-fetch") ?? 0);
    const cached = lastFilterFetch + 172800 > new Date().valueOf() / 1000;
    if (cached && !force) {
      const keys = ["genre", "demographic", "theme", "format"] as const;
      const values = keys.map((k) => Application.getState(`${k}`) as string | undefined);
      const [genres, demographic, themes, formats] = values;
      if (
        genres === undefined ||
        demographic === undefined ||
        themes === undefined ||
        formats === undefined
      ) {
        await this.updateFilters(true);
        return;
      }

      this.setGenreFilter(JSON.parse(genres) as OptionItem[]);
      this.setDemographicFilter(JSON.parse(demographic) as OptionItem[]);
      this.setThemesFilter(JSON.parse(themes) as OptionItem[]);
      this.setFormatsFilter(JSON.parse(formats) as OptionItem[]);
      await this.checkFilters();
    } else {
      this.genres = await parse.parseFilterUpdate("genre");
      this.demographic = await parse.parseFilterUpdate("demographic");
      this.themes = await parse.parseFilterUpdate("theme");
      this.formats = await parse.parseFilterUpdate("format");
      Application.setState(String(new Date().valueOf() / 1000), "last-filter-fetch");
    }
  }
  private setGenreFilter(newValue: OptionItem[]) {
    this.genres = newValue;
    Application.setState(JSON.stringify(newValue), "genre");
  }
  private setDemographicFilter(newValue: OptionItem[]) {
    this.demographic = newValue;
    Application.setState(JSON.stringify(newValue), "demographic");
  }
  private setThemesFilter(newValue: OptionItem[]) {
    this.themes = newValue;
    Application.setState(JSON.stringify(newValue), "theme");
  }
  private setFormatsFilter(newValue: OptionItem[]) {
    this.formats = newValue;
    Application.setState(JSON.stringify(newValue), "format");
  }
}
