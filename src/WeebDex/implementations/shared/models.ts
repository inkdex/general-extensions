export interface WeebDexMangaListResponse {
  total: number;
  limit: number;
  page: number;
  data: WeebDexManga[];
}

export interface WeebDexManga {
  id: string;
  created_at: string;
  updated_at: string;
  state: string;
  title: string;
  alt_titles?: Record<string, string[]>;
  description: string;
  year?: number;
  language: string;
  demographic?: string;
  status: string;
  content_rating: string;
  last_volume?: string;
  last_chapter?: string;
  version: number;
  relationships: WeebDexRelationships;
}

export interface WeebDexRelationships {
  available_languages?: string[];
  cover?: WeebDexCover;
  tags?: WeebDexTag[];
  authors?: WeebDexPerson[];
  artists?: WeebDexPerson[];
  links?: Record<string, string>;
  stats?: WeebDexStats;
}

export interface WeebDexCover {
  id: string;
  ext: string;
  dimensions?: number[];
  volume?: string;
}

export interface WeebDexTag {
  id: string;
  group: string;
  name: string;
}

export interface WeebDexPerson {
  id: string;
  group: string;
  name: string;
}

export interface WeebDexStats {
  follows?: number;
  views?: number;
  rating?: {
    average?: number;
    bayesian?: number;
  };
}

export interface Metadata {
  page?: number;
}

export interface WeebDexChapterFeedResponse {
  total: number;
  limit: number;
  page: number;
  data: WeebDexChapter[];
}

export interface WeebDexChapter {
  id: string;
  chapter: string;
  volume?: string;
  title?: string;
  language: string;
  created_at: string;
  published_at: string;
  updated_at: string;
  is_unavailable?: boolean;
  node?: string;
  data?: WeebDexPageData[];
  data_optimized?: WeebDexPageData[];
  relationships: WeebDexChapterRelationships;
}

export interface WeebDexPageData {
  name: string;
  dimensions: number[];
}

export interface WeebDexChapterRelationships {
  manga: WeebDexManga;
  groups?: WeebDexGroup[];
  uploader?: WeebDexUser;
}

export interface WeebDexGroup {
  id: string;
  name: string;
}

export interface WeebDexUser {
  id: string;
  name: string;
}

export interface WeebDexTagListResponse {
  total: number;
  limit: number;
  page: number;
  data: WeebDexTag[];
}

export interface ExtractedFilters {
  status: string[];
  demographic: string[];
  contentRating: string[];
  includedTags: string[];
  excludedTags: string[];
  tagMode: string;
}
