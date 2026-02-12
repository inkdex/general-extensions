export interface ApiResponse<T> {
  status: number;
  result: T;
}

export interface ResultManga {
  items: MangaItem[];
}

export interface ResultChapter {
  items: ChapterItem[];
  pagination: { last_page: number };
}

export interface ChapterPages {
  manga_id: number;
  images: { url: string }[];
}

export interface MangaItem {
  manga_id: number;
  hash_id: string;
  title: string;
  alt_titles: string[];
  synopsis: string;
  slug: string;
  poster: Poster;
  original_language: string;
  status: string;
  latest_chapter: number;
  chapter_updated_at: number;
  created_at: number;
  updated_at: number;
  rated_avg: number;
  is_nsfw: boolean;
  author?: { title: string }[];
  artist?: { title: string }[];
  genre: Terms[];
  theme: Terms[];
  demographic: Terms[];
}

export interface Terms {
  term_id: number;
  title: string;
}

export interface Poster {
  small: string;
  medium: string;
  large: string;
}

export interface ChapterItem {
  chapter_id: number;
  manga_id: number;
  is_official: number;
  number: number;
  name: string;
  language: string;
  volume: number;
  votes: number;
  created_at: number;
  updated_at: number;
  scanlation_group?: { name: string } | null;
}

export interface Metadata {
  page: number;
}

export interface ResultFilter {
  items: Filter[];
  pagination: { last_page: number };
}

export interface Filter {
  term_id: number;
  title: string;
}

export type OptionItem = {
  value: string;
  id: string;
};
