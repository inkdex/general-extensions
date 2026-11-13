/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type Tag } from "@paperback/types";

export const DOMAIN = "https://mangadot.net";

export const STATUS: Tag[] = [
  {
    id: "",
    title: "Any",
  },
  {
    id: "Ongoing",
    title: "Ongoing",
  },
  {
    id: "Completed",
    title: "Completed",
  },
  {
    id: "Hiatus",
    title: "Interrupted",
  },
];

export const RANGE: Tag[] = [
  {
    id: "daily",
    title: "Day",
  },
  {
    id: "weekly",
    title: "Week",
  },
  {
    id: "monthly",
    title: "Month",
  },
];

export const ORIGIN: Tag[] = [
  {
    id: "",
    title: "Any",
  },
  {
    id: "JP",
    title: "Manga",
  },
  {
    id: "KR",
    title: "Manhwa",
  },
  {
    id: "CN&TW",
    title: "Manhua",
  },
  {
    id: "ONESHOT",
    title: "Oneshot",
  },
];

export const ADULT_FILTER = [
  {
    id: "0",
    title: "No",
  },
  {
    id: "1",
    title: "Yes",
  },
  {
    id: "both",
    title: "Both",
  },
];

export const CONTENT_RATING = [
  {
    id: "any",
    title: "Any",
  },
  {
    id: "safe",
    title: "Safe",
  },
  {
    id: "suggestive",
    title: "Suggestive",
  },
  {
    id: "erotica",
    title: "Erotica",
  },
  {
    id: "pornographic",
    title: "Pornographic",
  },
];

export const RATING = [
  {
    id: "any",
    title: "Any",
  },
  {
    id: "5",
    title: "5+",
  },
  {
    id: "6",
    title: "6+",
  },
  {
    id: "7",
    title: "7+",
  },
  {
    id: "8",
    title: "8+",
  },
  {
    id: "9",
    title: "9+",
  },
];

export const VOLUME = [
  {
    id: "any",
    title: "Any",
  },
  {
    id: "with",
    title: "Has Volume",
  },
  {
    id: "without",
    title: "No Volumes",
  },
];

export const CHAPTERS_NUM = [
  {
    id: "any",
    title: "Any",
  },
  {
    id: "10",
    title: "10+",
  },
  {
    id: "25",
    title: "25+",
  },
  {
    id: "50",
    title: "50+",
  },
  {
    id: "100",
    title: "100+",
  },
];

export const IN_LIBRARY = [
  {
    id: "any",
    title: "Any",
  },
  {
    id: "in",
    title: "In Library",
  },
  {
    id: "out",
    title: "Not in Library",
  },
];

export interface MangaData extends MangaSectionItem {
  genres: string[];
  date_added: string;
  description: string;
  banner_image: string;
  content_rating: string | null;
  alt_titles: string[] | string | null;
  authors: string[] | string | null;
  artists: string[] | string | null;
  is_adult: boolean;
  is_longstrip: boolean | null;
}

export interface MangaSectionItem {
  id: number;
  title: string;
  photo: string;
  status: string;
  hiatus: string;
  country_of_origin: string;
  chapter_count: number;
  view_count: number;
  tracked_count: number;
  avg_rating: number | null;
  rating_count: number;
  last_chapter_date: string;
  latest_chapter_number: string | null;
  is_blurworthy: number;
}

export interface MangaSection {
  items: MangaSectionItem[];
}

export interface MangaDataResponse {
  manga: MangaData;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

export interface SearchResponse {
  manga_list: MangaData[];
  pagination: { total_pages: number };
}

export interface ChapterPagesResponse {
  images: { url: string }[];
}

export interface ChapterListResponse {
  id: number;
  chapter_number: number;
  volume_number: null | number;
  chapter_title: string;
  language: string;
  uploader_upload_status: string | null;
  date_added: string;
  scanlator_name: string;
  group_name: string;
}

export interface Volumes {
  cover_url: string;
}

export interface Languages {
  languages: { code: string; name: string }[];
}

export interface Profile {
  profile: {
    username: string;
  };
}

export type SearchMetadata = {
  genres?: { [id: string]: "included" | "excluded" };
  demographic?: { [id: string]: "included" | "excluded" };
  themes?: { [id: string]: "included" | "excluded" };
  more?: { [id: string]: "included" | "excluded" };
  tag?: { [id: string]: "included" | "excluded" };
  origin?: string[];
  status?: string[];
  author?: string[];
  artist?: string[];
  adult?: string[];
  range?: string;
  contentRating?: string[];
  rating?: string[];
  language?: string[];
  library?: string[];
  volume?: string[];
  chapters?: string[];
  sectionName?: string;
  [key: string]: any;
};

export type PageMetadata = {
  page: number;
};

export type ItemInfo = {
  symbol: string;
  text: string;
};

export type ItemInfoElements = [ItemInfo] | [ItemInfo, ItemInfo];

export interface ApiRequestConfig {
  path: string | string[];
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
}

export const discoverySections = [
  { id: "most_viewed", title: "Most Viewed" },
  { id: "top_rated", title: "Top Rated" },
  { id: "most_tracked", title: "Most Tracked Comics" },
  { id: "latest_updates", title: "Latest updates" },
  { id: "recently_added", title: "Recently Added" },
  { id: "genres", title: "Genres" },
  { id: "themes", title: "Themes" },
  { id: "demographics", title: "Demographics" },
  { id: "for_you", title: "For You" },
];

export interface TagItem {
  name: string;
  series_count: number;
  is_adult: boolean;
}

export interface CategoryGroup {
  category: string;
  tags: TagItem[];
}

export interface ProfileSettings {
  hidden_terms: string[];
}

export type TagTermTuple = [number, string, number, number, number, number];

export interface TagsRequest {
  v: number;
  categories: string[];
  terms: TagTermTuple[];
}

export type CategorizedTagsMap = Record<string, TagItem[]>;
