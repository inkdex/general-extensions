/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export interface AtsuHomePageResponse {
  homePage: {
    sections: AtsuSection[];
  };
}

export interface AtsuSection {
  key: string;
  layout: string;
  title?: string;
  seeMoreHref?: string;
  items?: AtsuMangaItem[];
}

export interface AtsuMangaItem {
  id: string;
  image: string;
  title: string;
  type: string;
}

export interface AtsuInfiniteResponse {
  items: AtsuMangaItem[];
}

export interface AtsuMangaPageResponse {
  mangaPage: AtsuMangaDetails;
}

export interface AtsuMangaDetails {
  id: string;
  authors: Array<{ id: string; name: string }>;
  scanlators: Array<{ id: string; name: string }>;
  banner: string | null;
  genres: AtsuTag[];
  englishTitle: string;
  poster: {
    id: string;
    image: string;
  };
  title: string;
  type: string;
  otherNames: string[];
  synopsis: string;
  status: string;
  totalChapterCount: number;
}

export interface AtsuTag {
  id: string;
  name: string;
}

export interface AtsuChapter {
  id: string;
  number: number;
  title: string;
  createdAt: number;
  index: number;
  pageCount: number;
  scanlationMangaId: string | null;
}

export interface AtsuChaptersResponse {
  chapters: AtsuChapter[];
  pages: number;
  page: number;
}

export interface AtsuReadChapterResponse {
  readChapter: {
    id: string;
    title: string;
    pages: AtsuPage[];
  };
}

export interface AtsuPage {
  id: string;
  image: string;
  number: number;
  width: number;
  height: number;
  aspectRatio: number;
}

export interface AtsuFilteredViewRequest {
  filter: {
    search: string;
    genres: string[];
    excludeGenres: string[];
    types: string[];
    status: string[];
    years: number[];
    minChapters: number | null;
    hideBookmarked: boolean;
    officialTranslation: boolean;
    showAdult: boolean;
    sortBy: string;
  };
  page: number;
}

export interface AtsuFilteredViewResponse {
  items: AtsuMangaItem[];
}

export interface AtsuAvailableFiltersResponse {
  genres: Array<{ id: string; name: string }>;
  types: Array<{ id: string; name: string }>;
  statuses: Array<{ id: string; name: string }>;
}

export interface ExtractedFilters {
  includedTags: string[];
  excludedTags: string[];
  selectedTypes: string[];
  selectedStatuses: string[];
}
