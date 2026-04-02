export const DOMAIN = "https://qimanhwa.com";
export const DOMAIN_API = "https://api.qimanhwa.com/api";

export const PAGE_SIZE = 20;

export interface QIScansSeriesSearchResponse {
  data: QIScansSeriesSearchItem[];
}

export interface QIScansSeriesGenre {
  id: number;
  name: string;
  slug: string;
}

export interface QIScansSeriesSearchItem {
  slug: string;
  title: string;
  alternativeTitles?: string;
  cover: string;
  type: string;
  status: string;
  publishStatus: string;
  createdAt: string;
  avgRating: number | null;
  redirectUrl: string;
  discountActive: boolean;
  discountPercentage: number | null;
  discountEndAt: string | null;
}

export interface QIScansSeriesDetailsResponse {
  id: number;
  slug: string;
  title: string;
  alternativeTitles: string;
  description: string;
  author: string;
  artist: string;
  cover: string;
  type: string;
  status: string;
  publishStatus: string;
  lastChapterAddedAt: string;
  createdAt: string;
  genres: QIScansGenre[];
  stats: {
    averageRating: number | null;
    reviewCount: number;
    chapterCount: number;
    commentCount: number;
  };
  navigation?: {
    first?: {
      number: number;
      slug: string;
    };
  };
}

export interface QIScansSeriesChaptersResponse {
  data: QIScansSeriesChapter[];
  totalItems: number;
  totalPages: number;
  current: number;
  next: number | null;
}

export interface QIScansSeriesChapter {
  id: number;
  slug: string;
  number: number;
  title: string;
  cover: string;
  price: number;
  isFree: boolean;
  publishStatus: string;
  totalViews: number;
  commentCount: number;
  createdAt: string;
  requiresPurchase: boolean;
}

export interface QIScansSeriesChapterDetailsResponse {
  id: number;
  slug: string;
  number: number;
  title: string;
  content: string;
  cover: string;
  publishStatus: string;
  price: number;
  isFree: boolean;
  requiresPurchase: boolean;
  totalViews: number;
  images: QIScansSeriesChapterImage[];
  totalImages: number;
  createdAt: string;
}

export interface QIScansSeriesChapterImage {
  url: string;
  order: number;
  width: number;
  height: number;
}

export interface QIScansHomeResponse {
  banners: QIScansHomeSeriesItem[];
  popular: QIScansHomeSeriesItem[];
  newSeries: QIScansHomeSeriesItem[];
  pinned: QIScansHomeSeriesItem[];
  editorsPick: QIScansHomeSeriesItem[];
}

export interface QIScansHomeSeriesItem {
  id: number;
  slug: string;
  title: string;
  cover: string;
  coverBlurHash?: string;
  type: string;
  status: string;
  redirectUrl: string;
  avgRating: number | null;
  lastChapterAddedAt?: string;
  description?: string;
  genres?: QIScansHomeGenre[];
  chapters?: QIScansHomeChapter[];
}

export interface QIScansHomeGenre {
  id: number;
  slug: string;
  name: string;
}

export interface QIScansHomeChapter {
  slug: string;
  number: number;
  price: number;
  createdAt: string;
}

export interface QIScansGenre {
  id: number;
  name: string;
  color?: string;
}

export type Metadata = {
  page?: number;
};
