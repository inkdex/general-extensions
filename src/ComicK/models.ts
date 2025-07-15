type Nullable<T> = T | null;

export type Item = {
    name: string;
    slug: string;
};

export type Comic = {
    title: string;
    status: number;
    content_rating: string;
    desc: string;
    slug: string;
    country: string;
    md_titles: { title: string }[];
    cover_url?: string;
    md_comic_md_genres: { md_genres: Item }[];
    bayesian_rating: string;
    md_covers: { vol: string; w: number; h: number; b2key: string }[];
};

export type MangaDetails = {
    comic: Comic;
    artists: Item[];
    authors: Item[];
};

export type ChapterData = {
    id: number;
    chap: Nullable<string>;
    title: Nullable<string>;
    vol: Nullable<string>;
    slug: Nullable<string>;
    lang: string;
    created_at: Date;
    updated_at: Date;
    publish_at: Date;
    up_count: number;
    down_count: number;
    group_name: Nullable<string[]>;
    hid: string;
    md_groups: {
        slug: string;
        title: string;
    }[];
};

export type ChapterList = {
    chapters: ChapterData[];
    total: number;
};

export type ChapterImages = {
    chapter: {
        images: { url: string }[];
    };
};

export type SearchData = {
    hid: string;
    title: string;
    cover_url: string;
    last_chapter: string;
    updated_at?: Date;
    md_comics: {
        cover_url: string;
        title: string;
        hid: string;
        last_chapter: string;
    };
    content_rating: string;
};

export type ChapterFilter = {
    chapterScoreFiltering: boolean;
    hideUnreleasedChapters: boolean;
    showTitle: boolean;
    showVol: boolean;
};

export type Metadata = {
    page?: number;
    completed?: boolean;
};
