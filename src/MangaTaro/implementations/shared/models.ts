export const DOMAIN = "https://mangataro.org";

// years, genres, types, statuses are JSON-stringified arrays, not real arrays
export interface MangaTaroLoadRequest {
  page: number;
  search: string;
  years: string;
  genres: string;
  types: string;
  statuses: string;
  sort: string;
  genreMatchMode: string;
}

export interface MangaTaroLoadItem {
  id: string;
  title: string;
  url: string;
  cover: string;
  score: string;
  votes: number;
  status: string;
  year: string;
  type: string;
  description: string;
}

export interface MangaTaroSchemaOrg {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  description?: string;
  image?: string;
  inLanguage?: string;
  author?: { "@type": string; name: string };
  genre?: string;
  status?: string;
  datePublished?: string;
  numberOfEpisodes?: number;
}

export interface MangaTaroTag {
  id: string;
  name: string;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface MangaTaroChapter {
  id: string;
  chapter: string;
  title: string;
  date: string;
  chapter_type: string;
  group_id: string;
  group_name: string;
  group_avatar: string;
  language: string;
  likes: string;
  url: string;
}

export interface MangaTaroChaptersResponse {
  success: boolean;
  chapters: MangaTaroChapter[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface MangaTaroChapterContentResponse {
  success: boolean;
  chapter_id: number;
  chapter_type: string;
  images: string[];
  total: number;
}

export interface MangaTaroPopularChapter {
  chapter_id: number;
  chapter_number: string;
  chapter_title: string;
  read_count: number;
  manga_id: number;
  manga_title: string;
  manga_slug: string;
  cover: string;
  manga_type: string;
  chapter_url: string;
  manga_url: string;
}
export interface MangaTaroPopularChaptersResponse {
  success: boolean;
  period: string;
  chapters: MangaTaroPopularChapter[];
}

export interface MangaTaroStatusMangaItem {
  manga_id: number;
  title: string;
  slug: string;
  cover: string;
  manga_type: string;
  status_count: number;
  status: string;
  permalink: string;
}
export interface MangaTaroStatusSliderResponse {
  success: boolean;
  status: string;
  manga: MangaTaroStatusMangaItem[];
}

export interface MangaTaroFollowedMangaItem {
  manga_id: number;
  title: string;
  slug: string;
  cover: string;
  manga_type: string;
  bookmark_count: number;
  permalink: string;
}
export interface MangaTaroFollowedMangaResponse {
  success: boolean;
  period: string;
  manga: MangaTaroFollowedMangaItem[];
}

export interface MangaTaroPopularMangaItem {
  cover: string;
  title: string;
  permalink: string;
  manga_type: string;
}
