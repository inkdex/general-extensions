export interface metadata {
    page?: number;
    collectedIds?: string[];
    searchCollectedIds?: string[];
}

export interface searchFilter {
    id: string;
    value: string;
}

export interface MangaPageAuthor {
    name: string;
    slug: string;
}

export interface MangaPageTag {
    id: string;
    name: string;
}

export interface MangaPagePoster {
    id: string;
    color: string;
    plaiceholder: string;
    image: string;
}

export interface ChapterApiItem {
    id: string;
    number: number;
    title: string;
    createdAt: string;
    index: number;
    pageCount: number;
    progress: null;
}

export interface ChapterApiResponse {
    chapters: ChapterApiItem[];
    pages: number;
    page: number;
}

export interface MangaPage {
    id: string;
    authors: MangaPageAuthor[];
    banner: {
        url: string;
        aspectRatio: number;
    };
    tags: MangaPageTag[];
    englishTitle: string;
    poster: MangaPagePoster;
    isInitiallyBookmarked: boolean;
    title: string;
    type: string;
    otherNames: string[];
    synopsis: string;
    anilistId: number | null;
    mangaBakaId: string | null;
    malId: number | null;
    mangaUpdatesId: string | null;
    status: string;
    recommendations: unknown[];
    chapters: ChapterApiItem[];
    startReading: {
        label: string;
        legend: string;
        href: string;
    };
}

export interface MangaApiResponse {
    mangaPage: MangaPage;
}

export interface SearchHit {
    plaiceholder: string;
    id: string;
    title: string;
    color: string;
    image: string;
    initiallyBookmarked: boolean;
    type: string;
}

export interface SearchApiResponse {
    hits: SearchHit[];
}

export interface SearchItem {
    id: string;
    image: string;
    title: string;
}

export interface InfiniteApiResponse {
    items: SearchItem[];
}

export interface HomePageSectionItem {
    id: string;
    banner: string;
    title: string;
}

export interface HomePageSection {
    type: string;
    key: string;
    items: HomePageSectionItem[];
}

export interface HomePageApiResponse {
    homePage: {
        sections: HomePageSection[];
    };
}

export interface ChapterPage {
    id: string;
    image: string;
    number: number;
    width: number;
    height: number;
    aspectRatio: number;
}

export interface ReadChapter {
    id: string;
    title: string;
    pages: ChapterPage[];
}

export interface ChapterDetailsApiResponse {
    readChapter: ReadChapter;
}
