declare namespace ComicK {
    type Nullable<T> = T | null;

    type Item = {
        name: string;
        slug: string;
    };

    type Comic = {
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

    type MangaDetails = {
        comic: Comic;
        artists: Item[];
        authors: Item[];
    };

    type ChapterData = {
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

    type ChapterList = {
        chapters: ChapterData[];
        total: number;
    };

    type ChapterImages = {
        chapter: {
            images: { url: string }[];
        };
    };

    type SearchData = {
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

    type ChapterFilter = {
        chapterScoreFiltering: boolean;
        hideUnreleasedChapters: boolean;
        showTitle: boolean;
        showVol: boolean;
    };

    type Metadata = {
        page?: number;
        completed?: boolean;
    };
}
