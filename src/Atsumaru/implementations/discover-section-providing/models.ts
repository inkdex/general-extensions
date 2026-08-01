/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { HomeEndpoint, HomeTimeframe } from "../shared/models";

export interface HomeSectionDefinition {
  endpoint: HomeEndpoint;
  id: string;
  title: string;
  timeframe?: HomeTimeframe;
  usesTimeframes?: boolean;
}

export const HOME_TIMEFRAMES: Array<{ id: HomeTimeframe; title: string }> = [
  { id: "daily", title: "Daily" },
  { id: "weekly", title: "Weekly" },
  { id: "monthly", title: "Monthly" },
  { id: "all", title: "All Time" },
];

export const SPOTLIGHT_GENRES = [
  "Action",
  "Romance",
  "Fantasy",
  "Psychological",
  "Comedy",
  "Martial Arts",
  "Slice of Life",
  "Adventure",
  "Drama",
  "Sci-Fi",
  "Mystery",
  "Historical",
  "Supernatural",
  "Thriller",
  "Horror",
];

export const DISCOVER_SECTIONS: HomeSectionDefinition[] = [
  { id: "hot-updates", title: "Hot Updates", endpoint: "hotUpdates" },
  { id: "recently-updated", title: "Recently Updated", endpoint: "recentlyUpdated" },
  { id: "popular", title: "Popular", endpoint: "popular", timeframe: "daily" },
  { id: "rising", title: "Rising", endpoint: "rising" },
  { id: "hot-arrivals", title: "Hot Arrivals", endpoint: "hotArrivals" },
  {
    id: "most-bookmarked",
    title: "Most Bookmarked",
    endpoint: "mostBookmarked",
    usesTimeframes: true,
  },
  { id: "genre-spotlight", title: "Spotlight", endpoint: "genreSpotlight" },
  {
    id: "most-talked-about",
    title: "Most Talked About",
    endpoint: "mostTalkedAbout",
    usesTimeframes: true,
  },
  { id: "recently-added", title: "Recently Added", endpoint: "recentlyAdded" },
  { id: "binge-worthy", title: "Binge-Worthy", endpoint: "bingeWorthy" },
  { id: "most-polarizing", title: "Most Polarizing", endpoint: "mostPolarizing" },
  { id: "hidden-gems", title: "Hidden Gems", endpoint: "hiddenGems" },
  { id: "top-rated", title: "Top Rated", endpoint: "topRated" },
];
