export interface QIScansQueryResponse {
    posts: QIScansPost[];
    totalCount: number;
}

export interface QIScansV2Response {
    data: QIScansPost[];
}

export interface QIScansPost {
    id: number;
    slug: string;
    postTitle: string;
    postContent: string;
    isNovel: boolean;
    isNew: boolean;
    chaptersPricing: number;
    featuredImage: string;
    postStatus: string;
    postType: string;
    author?: string;
    artist?: string;
    seriesType?: string;
    seriesStatus?: string;
    totalViews?: number;
    alternativeTitles?: string;
    genres: QIScansGenre[];
    chapters: QIScansChapter[];
    _count: { chapters: number };
    averageRating?: number;
    createdAt: string;
    updatedAt: string;
    lastChapterAddedAt?: string;
}

export interface QIScansGenre {
    id: number;
    name: string;
    color?: string;
}

export interface QIScansChapter {
    id: number;
    number: number;
    title: string | null;
    slug: string;
    mangaPostId: number;
    createdAt: string;
    isLocked: boolean;
    isAccessible: boolean;
}

export interface QIScansChaptersResponse {
    post: {
        slug: string;
        chapters: QIScansChapter[];
    };
    totalChapterCount: number;
}

export type Metadata = {
    page?: number;
    completed?: boolean;
};
