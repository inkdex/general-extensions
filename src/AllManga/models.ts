/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type SortingOption } from "@paperback/types";

export const DOMAIN = "https://allmanga.to";
export const API_URL = "https://api.allanime.day/api";

export const THUMBNAIL_CDN = "https://wp.youtube-anime.com/aln.youtube-anime.com/";
export const IMAGE_CDN = "https://wp.youtube-anime.com";
export const DEFAULT_IMAGE_SERVER = "https://ytimgf.youtube-anime.com/";

export const LIMIT = 20;

export const IMAGE_QUALITY_KEY = "allmanga-image-quality";
export const SHOW_ADULT_KEY = "allmanga-show-adult";
export const IMAGE_QUALITY_DEFAULT = "original";

export const SECTION_POPULAR = "popular";
export const SECTION_POPULAR_WEEK = "popular_week";
export const SECTION_POPULAR_MONTH = "popular_month";
export const SECTION_LATEST = "latest";
export const SECTION_RECOMMENDED = "recommended";
export const SECTION_GENRES = "genres";

export type PageMetadata = {
  page?: number;
};

export type SearchMetadata = {
  country?: string[];
  genres?: Record<string, "included" | "excluded">;
};

export type OptionItem = {
  id: string;
  value: string;
};

export const POPULAR_QUERY = `query($type: VaildPopularTypeEnumType!, $size: Int!, $page: Int, $dateRange: Int, $allowAdult: Boolean, $allowUnknown: Boolean) {
  queryPopular(type: $type, size: $size, dateRange: $dateRange, page: $page, allowAdult: $allowAdult, allowUnknown: $allowUnknown) {
    recommendations {
      anyCard { _id name thumbnail englishName nativeName score availableChapters }
      pageStatus { views }
    }
  }
}`;

export const RANDOM_QUERY = `query($format: String!, $allowAdult: Boolean) {
  queryRandomRecommendation(format: $format, allowAdult: $allowAdult) {
    _id name thumbnail englishName
  }
}`;

export const SEARCH_QUERY = `query($search: SearchInput, $size: Int, $page: Int, $translationType: VaildTranslationTypeMangaEnumType, $countryOrigin: VaildCountryOriginEnumType) {
  mangas(search: $search, limit: $size, page: $page, translationType: $translationType, countryOrigin: $countryOrigin) {
    edges { _id name thumbnail englishName }
  }
}`;

export const LATEST_QUERY = `query($search: SearchInput, $size: Int, $page: Int, $translationType: VaildTranslationTypeMangaEnumType, $countryOrigin: VaildCountryOriginEnumType) {
  mangas(search: $search, limit: $size, page: $page, translationType: $translationType, countryOrigin: $countryOrigin) {
    edges { _id name thumbnail englishName availableChapters lastChapterDate }
  }
}`;

export const DETAILS_QUERY = `query($id: String!) {
  manga(_id: $id) { _id name thumbnail description authors genres tags status altNames englishName }
}`;

export const CHAPTERS_QUERY = `query($id: String!, $showId: String!) {
  manga(_id: $id) { _id name availableChaptersDetail }
  episodeInfos(showId: $showId, episodeNumStart: 0, episodeNumEnd: 9999) { episodeIdNum notes uploadDates }
}`;

export const PAGES_QUERY = `query($mangaId: String!, $translationType: VaildTranslationTypeMangaEnumType!, $chapterString: String!) {
  chapterPages(mangaId: $mangaId, translationType: $translationType, chapterString: $chapterString) {
    edges { pictureUrlHead pictureUrls }
  }
}`;

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export interface DateParts {
  year?: number | null;
  month?: number | null;
  date?: number | null;
  hour?: number | null;
  minute?: number | null;
  second?: number | null;
}

export interface MangaCard {
  _id: string;
  name: string;
  thumbnail?: string | null;
  englishName?: string | null;
  nativeName?: string | null;
  score?: number | null;
  availableChapters?: { sub?: number | null } | null;
  lastChapterDate?: { sub?: DateParts | null } | null;
}

export interface PopularData {
  queryPopular: {
    recommendations: {
      anyCard?: MangaCard | null;
      pageStatus?: { views?: string | null } | null;
    }[];
  };
}

export interface SearchData {
  mangas: { edges: MangaCard[] };
}

export interface RandomData {
  queryRandomRecommendation?: MangaCard[] | null;
}

export interface MangaDetail {
  _id: string;
  name: string;
  thumbnail?: string | null;
  description?: string | null;
  authors?: string[] | null;
  genres?: string[] | null;
  tags?: string[] | null;
  status?: string | null;
  altNames?: string[] | null;
  englishName?: string | null;
}

export interface DetailsData {
  manga: MangaDetail;
}

export interface AvailableChaptersDetail {
  sub?: string[];
}

export interface EpisodeInfo {
  episodeIdNum: number | string;
  notes?: string | null;
  uploadDates?: { sub?: string | null } | null;
}

export interface ChaptersData {
  manga: {
    _id: string;
    name: string;
    availableChaptersDetail?: AvailableChaptersDetail | null;
  };
  episodeInfos?: EpisodeInfo[] | null;
}

export type PictureUrl = string | { url?: string | null };

export interface ChapterPageEdge {
  pictureUrlHead?: string | null;
  pictureUrls?: PictureUrl[] | null;
}

export interface PagesData {
  chapterPages?: { edges: ChapterPageEdge[] } | null;
}

export const SORTING_OPTIONS: SortingOption[] = [
  { id: "", label: "Update" },
  { id: "Name_ASC", label: "Name Ascending" },
  { id: "Name_DESC", label: "Name Descending" },
];

export const COUNTRY_OPTIONS: OptionItem[] = [
  { id: "ALL", value: "All" },
  { id: "JP", value: "Japan" },
  { id: "CN", value: "China" },
  { id: "KR", value: "Korea" },
];

export const GENRE_OPTIONS: string[] = [
  "4 Koma",
  "Action",
  "Adult",
  "Adventure",
  "Cars",
  "Comedy",
  "Cooking",
  "Crossdressing",
  "Dementia",
  "Demons",
  "Doujinshi",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Game",
  "Gender Bender",
  "Gyaru",
  "Harem",
  "Historical",
  "Horror",
  "Isekai",
  "Josei",
  "Kids",
  "Loli",
  "Magic",
  "Manhua",
  "Manhwa",
  "Martial Arts",
  "Mature",
  "Mecha",
  "Medical",
  "Military",
  "Monster Girls",
  "Music",
  "Mystery",
  "One Shot",
  "Parody",
  "Police",
  "Post Apocalyptic",
  "Psychological",
  "Reincarnation",
  "Reverse Harem",
  "Romance",
  "Samurai",
  "School",
  "Sci-Fi",
  "Seinen",
  "Shota",
  "Shoujo",
  "Shoujo Ai",
  "Shounen",
  "Shounen Ai",
  "Slice of Life",
  "Smut",
  "Space",
  "Sports",
  "Super Power",
  "Supernatural",
  "Suspense",
  "Thriller",
  "Tragedy",
  "Unknown",
  "Vampire",
  "Webtoons",
  "Yaoi",
  "Youkai",
  "Yuri",
  "Zombies",
];

export function genreId(name: string): string {
  return name.replace(/[^A-Za-z0-9]+/g, "_");
}

export const GENRE_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  GENRE_OPTIONS.map((name) => [genreId(name), name]),
);
