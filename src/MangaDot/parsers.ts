/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";

import {
  DOMAIN,
  type ChapterPagesResponse,
  type ChapterListResponse,
  type MangaData,
  type MangaDataResponse,
  type PageMetadata,
  type SearchResponse,
} from "./models";
import { normalizeId } from "./utils";

function parseStringArray(value: string[] | string | null): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function getArrayAuthor(mangaData: MangaData): string {
  return parseStringArray(mangaData.authors).join(",");
}

function getDate(date: string | null | undefined) {
  if (!date) return new Date();
  return new Date(date.split(".")[0].split("+")[0].replace(" ", "T"));
}

function getRating(mangaData: MangaData) {
  if (mangaData.is_adult) return ContentRating.ADULT;
  if (mangaData.is_blurworthy) return ContentRating.MATURE;
  switch (mangaData.content_rating) {
    case "safe":
      return ContentRating.EVERYONE;
    case "suggestive":
      return ContentRating.EVERYONE;
    case "erotica":
      return ContentRating.MATURE;
    case "pornographic":
      return ContentRating.ADULT;
    default:
      return ContentRating.EVERYONE;
  }
}

export const parseMangaInfo = (manga: MangaDataResponse, volumes: string[]): SourceManga => {
  const mangaInfo = manga.manga;
  return {
    mangaId: mangaInfo.id.toString(),
    mangaInfo: {
      thumbnailUrl: `${DOMAIN}${mangaInfo.photo}`,
      synopsis: mangaInfo.description,
      primaryTitle: mangaInfo.title,
      secondaryTitles: parseStringArray(mangaInfo.alt_titles),
      contentRating: getRating(mangaInfo),
      status: mangaInfo.status,
      artist: parseStringArray(mangaInfo.artists).join(","),
      author: getArrayAuthor(mangaInfo),
      bannerUrl: `${DOMAIN}${mangaInfo.banner_image}`,
      artworkUrls: [`${DOMAIN}${mangaInfo.banner_image}`, ...volumes],
      rating: mangaInfo.avg_rating ? mangaInfo.avg_rating / 10 : 0,
      tagGroups: [
        {
          id: "genres",
          title: "Genres",
          tags: mangaInfo.genres.map((genre) => ({
            id: normalizeId(genre),
            title: genre,
          })),
        },
      ],
      shareUrl: `${DOMAIN}/manga/${mangaInfo.id}`,
    },
  };
};

export const parseChapters = (
  chapterList: ChapterListResponse[],
  manga: SourceManga,
): Chapter[] => {
  return chapterList.map((chapter) => {
    return {
      chapterId: chapter.id.toString(),
      sourceManga: manga,
      langCode: chapter.language,
      chapNum: chapter.chapter_number ?? 0,
      title: chapter.chapter_title,
      version: chapter.scanlator_name,
      volume: chapter.volume_number ?? 0,
      sortingIndex: chapter.chapter_number ?? 0,
      publishDate: getDate(chapter.date_added),
      creationDate: getDate(chapter.date_added),
      additionalInfo: { upload: chapter.uploader_upload_status?.toString() ?? "" },
    };
  });
};

export const parseSearch = (
  results: SearchResponse,
  metadata: PageMetadata | undefined,
): PagedResults<SearchResultItem> => {
  const searchResults: SearchResultItem[] = [];
  const page = metadata?.page ?? 1;
  results.manga_list.forEach((result) => {
    searchResults.push({
      mangaId: result.id.toString(),
      title: result.title,
      subtitle: getArrayAuthor(result),
      imageUrl: `${DOMAIN}${result.photo}`,
      contentRating: getRating(result),
    });
  });
  return {
    items: searchResults,
    metadata: results.pagination.total_pages > page ? { page: page + 1 } : undefined,
  };
};

export const parseChapterPages = (
  pages: ChapterPagesResponse,
  chapter: Chapter,
): ChapterDetails => {
  if (!pages?.images || !Array.isArray(pages.images)) {
    throw new Error("pages.images doesn't exist");
  }
  return {
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    pages: pages.images.map((image) => `${DOMAIN}${image.url}`),
  };
};

export type SectionItemType =
  | "simpleCarouselItem"
  | "chapterUpdatesCarouselItem"
  | "prominentCarouselItem"
  | "featuredCarouselItem";

export const parseSection = (
  sectionElements: SearchResponse,
  page: number,
  type: SectionItemType,
): PagedResults<DiscoverSectionItem> => {
  const items = sectionElements.manga_list.map((item): DiscoverSectionItem => {
    const base = {
      mangaId: item.id.toString(),
      title: item.title,
      imageUrl: `${DOMAIN}${item.photo}`,
      contentRating: getRating(item),
    };
    switch (type) {
      case "chapterUpdatesCarouselItem":
        return {
          ...base,
          type,
          subtitle: `Chapter ${item.chapter_count}`,
          chapterId: item.chapter_count.toString(),
          publishDate: getDate(item.last_chapter_date),
        };
      case "featuredCarouselItem":
        return { ...base, type, supertitle: getArrayAuthor(item) };
      case "prominentCarouselItem":
        return { ...base, type, subtitle: getArrayAuthor(item) };
      default:
        return { ...base, type: "simpleCarouselItem", subtitle: getArrayAuthor(item) };
    }
  });
  return {
    items,
    metadata: sectionElements.pagination.total_pages > page ? { page: page + 1 } : undefined,
  };
};
