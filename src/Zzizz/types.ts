// Type definitions for Zzizz extension
// Provides better type safety and developer experience

import { ContentRating } from "@paperback/types";

export interface ZizMangaData {
    title: string;
    author: string;
    artist: string;
    status: string;
    rating?: number;
    genres: string[];
    synopsis: string;
    coverUrl: string;
    contentRating: ContentRating;
}

export interface ZizChapterData {
    chapterId: string;
    chapterNumber: number;
    chapterName: string;
    publishDate: Date;
}

export interface ZizSearchResult {
    mangaId: string;
    title: string;
    imageUrl: string;
}

export interface ZizDiscoverItem {
    mangaId: string;
    title: string;
    imageUrl: string;
    subtitle?: string;
}

export interface ZizTrendingData {
    works: Array<{
        title: string;
        url: string;
        cover_url: string;
        last_chapter_num?: number;
    }>;
}

export interface ZizFilterOptions {
    genres: { id: string; value: string }[];
}

export interface ZizSortingOptions {
    id: string;
    label: string;
}

export interface ZizParserContext {
    domain: string;
    language: string;
    defaultContentRating: ContentRating;
}
