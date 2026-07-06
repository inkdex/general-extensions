/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SortingOption, Tag } from "@paperback/types";

export const DOMAIN = "https://mangafire.to";
export const API_URL = `${DOMAIN}/api`;

// Chapter images come from `{prefix}.mfcdn{1,2,3}.xyz`. All prefixes serve byte-identical content
// for a given path — the API pins one per session, but the host can be swapped freely on failure.
export const CDN_PREFIXES = ["k99", "l1n", "m3z", "nw8", "o48"];
export const CDN_HOST_REGEX = /^(https?:\/\/)([a-z0-9]{3})(\.mfcdn[0-9]+\.xyz)/;
export const BROKEN_CDN_PREFIXES_KEY = "broken_cdn_prefixes";

// Languages
export const LANGUAGES = [
  { title: "🇬🇧 English", id: "en" },
  { title: "🇪🇸 Español", id: "es" },
  { title: "🇲🇽 Español (Latinoamérica)", id: "es-la" },
  { title: "🇫🇷 Français", id: "fr" },
  { title: "🇵🇹 Português", id: "pt" },
  { title: "🇧🇷 Português (Brasil)", id: "pt-br" },
  { title: "🇯🇵 日本語", id: "ja" },
];

export type PageMetadata = { page?: number };

export type SearchMetadata = {
  types?: string[];
  genres?: { [id: string]: "included" | "excluded" };
  genreMode?: boolean; // true = title must have all included genres
  themes?: string[];
  demographics?: string[];
  statuses?: string[];
  yearFrom?: string;
  yearTo?: string;
  minChapters?: string;
};

export interface ApiList<T> {
  items: T[];
  meta?: { lastPage: number; hasNext: boolean };
}

interface Poster {
  small?: string;
  medium?: string;
  large?: string;
}

export interface TitleItem {
  hid: string;
  title: string;
  type?: string;
  poster?: Poster;
  latestChapter?: number;
  chapterUpdatedAt?: string;
  rank?: number;
}

export interface TitleDetails extends TitleItem {
  status?: string;
  synopsisHtml?: string;
  altTitles?: string[];
  rating?: number;
  authors?: { title: string }[];
  artists?: { title: string }[];
  genres?: { id: number; title: string }[];
  themes?: { id: number; title: string }[];
}

export interface ChapterItem {
  id: number;
  number: number;
  name?: string;
  createdAt?: number;
}

export interface ChapterPages {
  pages: { url: string }[];
}

export const STATUS_MAP: Record<string, string> = {
  releasing: "Ongoing",
  finished: "Completed",
  on_hiatus: "On Hiatus",
  discontinued: "Cancelled",
  not_yet_released: "Not Yet Released",
};

export const ADULT_GENRES = new Set(["Hentai", "Adult", "Smut"]);
export const MATURE_GENRES = new Set(["Ecchi", "Mature", "Boys Love", "Girls Love"]);

export const TYPES: Tag[] = [
  { id: "manga", title: "Manga" },
  { id: "manhwa", title: "Manhwa" },
  { id: "manhua", title: "Manhua" },
  { id: "other", title: "Other" },
];

export const STATUSES: Tag[] = [
  { id: "releasing", title: "Releasing" },
  { id: "finished", title: "Finished" },
  { id: "on_hiatus", title: "On Hiatus" },
  { id: "discontinued", title: "Discontinued" },
  { id: "not_yet_released", title: "Not Yet Released" },
];

export const DEMOGRAPHICS: Tag[] = [
  { id: "268919", title: "Josei" },
  { id: "268920", title: "Seinen" },
  { id: "268917", title: "Shoujo" },
  { id: "268918", title: "Shounen" },
];

export const GENRES: Tag[] = [
  { id: "1", title: "Action" },
  { id: "268929", title: "Adult" },
  { id: "78", title: "Adventure" },
  { id: "3", title: "Avant Garde" },
  { id: "4", title: "Boys Love" },
  { id: "5", title: "Comedy" },
  { id: "268921", title: "Crime" },
  { id: "77", title: "Demons" },
  { id: "6", title: "Drama" },
  { id: "7", title: "Ecchi" },
  { id: "79", title: "Fantasy" },
  { id: "9", title: "Girls Love" },
  { id: "10", title: "Gourmet" },
  { id: "11", title: "Harem" },
  { id: "268930", title: "Hentai" },
  { id: "268922", title: "Historical" },
  { id: "530", title: "Horror" },
  { id: "13", title: "Isekai" },
  { id: "531", title: "Iyashikei" },
  { id: "15", title: "Josei" },
  { id: "532", title: "Kids" },
  { id: "539", title: "Magic" },
  { id: "268923", title: "Magical Girls" },
  { id: "533", title: "Mahou Shoujo" },
  { id: "534", title: "Martial Arts" },
  { id: "268931", title: "Mature" },
  { id: "19", title: "Mecha" },
  { id: "268924", title: "Medical" },
  { id: "535", title: "Military" },
  { id: "21", title: "Music" },
  { id: "22", title: "Mystery" },
  { id: "23", title: "Parody" },
  { id: "268925", title: "Philosophical" },
  { id: "536", title: "Psychological" },
  { id: "25", title: "Reverse Harem" },
  { id: "26", title: "Romance" },
  { id: "73", title: "School" },
  { id: "28", title: "Sci-Fi" },
  { id: "537", title: "Seinen" },
  { id: "30", title: "Shoujo" },
  { id: "31", title: "Shounen" },
  { id: "538", title: "Slice of Life" },
  { id: "268932", title: "Smut" },
  { id: "33", title: "Space" },
  { id: "34", title: "Sports" },
  { id: "75", title: "Super Power" },
  { id: "268926", title: "Superhero" },
  { id: "76", title: "Supernatural" },
  { id: "37", title: "Suspense" },
  { id: "38", title: "Thriller" },
  { id: "268927", title: "Tragedy" },
  { id: "39", title: "Vampire" },
  { id: "268928", title: "Wuxia" },
];

export const THEMES: Tag[] = [
  { id: "268933", title: "Aliens" },
  { id: "268934", title: "Animals" },
  { id: "268935", title: "Cooking" },
  { id: "268936", title: "Crossdressing" },
  { id: "268937", title: "Delinquents" },
  { id: "268938", title: "Demons" },
  { id: "268939", title: "Genderswap" },
  { id: "268940", title: "Ghosts" },
  { id: "268941", title: "Gyaru" },
  { id: "268942", title: "Harem" },
  { id: "268943", title: "Incest" },
  { id: "268944", title: "Loli" },
  { id: "268945", title: "Mafia" },
  { id: "268946", title: "Magic" },
  { id: "268947", title: "Martial Arts" },
  { id: "268948", title: "Military" },
  { id: "268949", title: "Monster Girls" },
  { id: "268950", title: "Monsters" },
  { id: "268951", title: "Music" },
  { id: "268952", title: "Ninja" },
  { id: "268953", title: "Office Workers" },
  { id: "268954", title: "Police" },
  { id: "268955", title: "Post-Apocalyptic" },
  { id: "268956", title: "Reincarnation" },
  { id: "268957", title: "Reverse Harem" },
  { id: "268958", title: "Samurai" },
  { id: "268959", title: "School Life" },
  { id: "268960", title: "Shota" },
  { id: "268961", title: "Supernatural" },
  { id: "268962", title: "Survival" },
  { id: "268963", title: "Time Travel" },
  { id: "268964", title: "Traditional Games" },
  { id: "268965", title: "Vampires" },
  { id: "268966", title: "Video Games" },
  { id: "268967", title: "Villainess" },
  { id: "268968", title: "Virtual Reality" },
  { id: "268969", title: "Zombies" },
];

// id format is "orderKey:direction"
export const SORTS: SortingOption[] = [
  { id: "relevance:desc", label: "Best Match" },
  { id: "chapter_updated_at:desc", label: "Latest Update" },
  { id: "created_at:desc", label: "Recently Added" },
  { id: "title:asc", label: "Title (A-Z)" },
  { id: "title:desc", label: "Title (Z-A)" },
  { id: "year:desc", label: "Year (Newest)" },
  { id: "year:asc", label: "Year (Oldest)" },
  { id: "score:desc", label: "Highest Rated" },
  { id: "views_7d:desc", label: "Most Viewed (7 Days)" },
  { id: "views_30d:desc", label: "Most Viewed (30 Days)" },
  { id: "views_total:desc", label: "Most Viewed (All Time)" },
  { id: "follows_total:desc", label: "Most Followed" },
];
