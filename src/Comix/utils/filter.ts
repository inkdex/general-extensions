/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type OptionItem } from "../models";

export class ComixFilter {
  genres: OptionItem[] = [];
  themes: OptionItem[] = [];
  demographic: OptionItem[] = [];
  formats: OptionItem[] = [];

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

  contentRating = [
    { id: "safe", title: "Safe" },
    { id: "suggestive", title: "Suggestive" },
    { id: "erotica", title: "Erotica" },
    { id: "pornographic", title: "Pornographic" },
  ];
  getDefaultContentRatingSettings() {
    return (Application.getState("content_rating") as string[] | undefined) ?? ["suggestive"];
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

  getSectionTimesType() {
    return (Application.getState("yearTimes") as boolean | undefined) ?? true;
  }

  /**
   * @return true if horizontal, false if table
   */
  getChapterSectionDiffType() {
    return (Application.getState("chapterSection") as boolean | undefined) ?? false;
  }

  /**
   * @return true if horizontal, false if table
   */
  getTrendingSectionDiffType() {
    return (Application.getState("trendingSection") as boolean | undefined) ?? true;
  }

  /**
   * @return true if horizontal, false if table
   */
  getRecentSectionDiffType() {
    return (Application.getState("recentSection") as boolean | undefined) ?? true;
  }

  setGenreFilter(newValue: OptionItem[]) {
    this.genres = [...newValue].sort((a, b) =>
      a.value.toLowerCase().localeCompare(b.value.toLowerCase()),
    );
    Application.setState(JSON.stringify(newValue), "genre");
  }

  setDemographicFilter(newValue: OptionItem[]) {
    this.demographic = [...newValue].sort((a, b) =>
      a.value.toLowerCase().localeCompare(b.value.toLowerCase()),
    );
    Application.setState(JSON.stringify(newValue), "demographic");
  }

  setFormatsFilter(newValue: OptionItem[]) {
    this.formats = [...newValue].sort((a, b) =>
      a.value.toLowerCase().localeCompare(b.value.toLowerCase()),
    );
    Application.setState(JSON.stringify(newValue), "format");
  }
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
