/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { parse } from "../main";
import { type OptionItem } from "../models";

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
export function getSectionTimesType() {
  return (Application.getState("yearTimes") as boolean | undefined) ?? true;
}

/**
 * @return true if horizontal, false if table
 */
export function getChapterSectionDiffType() {
  return (Application.getState("chapterSection") as boolean | undefined) ?? false;
}

/**
 * @return true if horizontal, false if table
 */
export function getTrendingSectionDiffType() {
  return (Application.getState("trendingSection") as boolean | undefined) ?? true;
}

/**
 * @return true if horizontal, false if table
 */
export function getRecentSectionDiffType() {
  return (Application.getState("recentSection") as boolean | undefined) ?? true;
}

export const discoverySections = [
  { id: "popular", title: "Popular" },
  { id: "follow", title: "Most Follows New Comics" },
  { id: "recent", title: "Recent Comics" },
  { id: "trending_manga", title: "Trending Manga" },
  { id: "trending_wt", title: "Trending WebToons" },
  { id: "updatesHot", title: "Latest Updates HOT" },
  { id: "updatesNew", title: "Latest Updates NEW" },
  { id: "completed", title: "Completed" },
  { id: "genresSection", title: "Best of Genres" },
];
