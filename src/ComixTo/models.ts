export interface ApiResponseMangaInfo {
  status: number;
  result: MangaItem;
}

export interface ApiResponseManga {
  status: number;
  result: ResultManga;
}

export interface ApiResponseChapter {
  status: number;
  result: ResultChapter;
}

interface pagination {
  last_page: number;
}

export interface ResultManga {
  items: MangaItem[];
}

export interface ResultChapter {
  items: ChapterItem[];
  pagination: pagination;
}

export interface ApiResponseChapterPages {
  status: number;
  result: ChapterPages;
}

export interface ChapterPages {
  manga_id: number;
  images: Images[];
}

export interface Images {
  url: string;
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
  author?: Author[];
  artist?: Artist[];
  term_ids: number[];
}

export interface Author {
  title: string;
}

export interface Artist {
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
  number: number;
  name: string;
  language: string;
  volume: number;
  created_at: number;
  updated_at: number;
  scanlation_group?: ScanlationGroup | null;
}

export interface ScanlationGroup {
  name: string;
}

export interface Metadata {
  page: number;
}

export interface ApiResponseFilter {
  status: number;
  result: ResultFilter;
}

export interface ResultFilter {
  items: Filter[];
  pagination: pagination;
}

export interface Filter {
  term_id: number;
  title: string;
}

export type OptionItem = {
  value: string;
  id: string;
};
