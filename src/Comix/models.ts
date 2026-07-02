/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SearchResultItem } from "@paperback/types";

export const DOMAIN = "https://comix.to";
export const NO_IMAGE = `${DOMAIN}/images/no-poster.png`;

export type SectionEntry = { id: string; title: string };

export const DISCOVERY_SECTIONS: SectionEntry[] = [
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

export type TagMap = Record<string, "included" | "excluded">;

export interface ApiResponse<T> {
  status: string;
  result: T;
}

export interface ResultManga {
  items: MangaItem[];
  meta?: { hasNext: boolean };
}

export interface MangaItem {
  hid: string;
  title: string;
  altTitles: string[];
  synopsis: string;
  poster: { medium?: string; large?: string } | null;
  type: string;
  year: number;
  status: string;
  latestChapter: number;
  finalChapter: number;
  chapterUpdatedAtFormatted: string;
  ratedAvg: number;
  followsTotal: number;
  contentRating: string;
  url: string;
  authors?: { title: string }[];
  artists?: { title: string }[];
  genres: { id: number; title: string }[];
  demographics: { id: number; title: string }[];
}

// Extras beyond SearchResultItem feed FeaturedCarouselItem; other item types strip them
export type MangaListItem = SearchResultItem & {
  publishDate: Date;
  supertitle: string;
  summary: string;
  infoItems: [{ symbol: string; text: string }, { symbol: string; text: string }];
};

export interface ChapterItem {
  id: number;
  mangaId: number;
  isOfficial: boolean;
  number: number;
  name: string;
  language: string;
  volume: number;
  votes: number;
  createdAtFormatted: string;
  url: string;
  group?: { name: string } | null;
}

export interface ChapterPages {
  mangaId: number;
  pages: { baseUrl: string; items: { url: string }[] };
}

export interface OptionItem {
  id: string;
  title: string;
}

export type Metadata = {
  page: number;
};

export type SearchMetadata = {
  genres?: TagMap;
  formats?: TagMap;
  types?: TagMap;
  demographic?: TagMap;
  status?: TagMap;
  mode?: string[];
  minChap?: number;
  contentRating?: string[];
};
