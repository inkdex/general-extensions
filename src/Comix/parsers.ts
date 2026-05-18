/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchResultItem,
  type SourceManga,
  type Tag,
  type TagSection,
  ContentRating,
} from "@paperback/types";

import {
  type ApiResponse,
  type ChapterItem,
  type ChapterPages,
  type Filter,
  type MangaItem,
  type Metadata,
  type OptionItem,
  type ResultManga,
  type SearchMetadata,
  DOMAIN,
} from "./models";
import { getPoster, getRanking, parseRelativeDate } from "./utils/helpers";

export class ComixParser {
  parseSection(section: string, json: ApiResponse<MangaItem[]>) {
    const latest: DiscoverSectionItem[] = [];
    if (json.status === "ok") {
      for (const item of json.result) {
        latest.push({
          type:
            section === "follow"
              ? "prominentCarouselItem"
              : section === "popular"
                ? "featuredCarouselItem"
                : "simpleCarouselItem",
          contentRating: getRanking(item.contentRating),
          imageUrl: getPoster(item),
          mangaId: item.hid,
          title: item.title,
          subtitle: item.authors?.map((author) => author.title).join(" ") ?? "",
        });
      }
    }
    return {
      items: latest,
      metadata: undefined,
    };
  }

  parseGenreSection(
    ComixMetadata: Metadata | undefined,
    genres: OptionItem[],
    hiddenGenres: string[],
    buildMetadata: (genreId: string) => SearchMetadata,
  ): { items: DiscoverSectionItem[]; metadata: Metadata } {
    const allGenres: DiscoverSectionItem[] = [];
    const page = ComixMetadata?.page ?? 1;
    genres
      .filter((filterName) => !hiddenGenres.includes(filterName.id))
      .forEach((filterItem) => {
        allGenres.push({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: buildMetadata(filterItem.id),
          },
          name: filterItem.value,
          contentRating:
            filterItem.value === "Adult" ? ContentRating.ADULT : ContentRating.EVERYONE,
        });
      });
    return {
      items: allGenres,
      metadata: { page: page + 1 },
    };
  }

  parseSectionSimple(page: number, json: ApiResponse<ResultManga>) {
    const latest: DiscoverSectionItem[] = [];
    if (json.status === "ok") {
      for (const item of json.result.items) {
        latest.push({
          contentRating: getRanking(item.contentRating),
          imageUrl: getPoster(item),
          mangaId: item?.hid ?? "NULL",
          subtitle: `Chapter ${item.finalChapter || item.latestChapter}`,
          title: item.title,
          type: "simpleCarouselItem",
        });
      }
      return {
        items: latest,
        metadata: json.result.items.length > 0 ? { page: page + 1 } : undefined,
      };
    }
    return { items: latest, metadata: undefined };
  }

  parseSectionChapter(page: number, json: ApiResponse<ResultManga>) {
    const latest: DiscoverSectionItem[] = [];
    if (json.status === "ok") {
      for (const item of json.result.items) {
        latest.push({
          contentRating: getRanking(item.contentRating),
          imageUrl: getPoster(item),
          chapterId: item.hid,
          mangaId: item.hid,
          subtitle: `Chapter ${item.finalChapter || item.latestChapter}`,
          title: item.title,
          type: "chapterUpdatesCarouselItem",
          publishDate: parseRelativeDate(item.chapterUpdatedAtFormatted),
        });
      }
      return {
        items: latest,
        metadata: json.result.items.length > 0 ? { page: page + 1 } : undefined,
      };
    }
    return { items: latest, metadata: undefined };
  }

  parseChapters(manga: SourceManga, items: ChapterItem[]): Chapter[] {
    return items.map((chapter) => {
      return {
        chapterId: chapter.id.toString(),
        sourceManga: manga,
        langCode: chapter.language,
        chapNum: chapter.number,
        title: chapter.name,
        volume: chapter.volume,
        version: chapter.isOfficial ? "⭐Official" : (chapter.group?.name ?? "Unknown"),
        sortingIndex: chapter.number,
        publishDate: parseRelativeDate(chapter.createdAtFormatted),
        additionalInfo: { vote: chapter.votes.toString(), url: chapter.url },
      };
    });
  }

  parseChapterDetails(chapterId: string, pages: ApiResponse<ChapterPages>): ChapterDetails {
    const { baseUrl, items } = pages.result.pages;
    const base = baseUrl.replace(/\/$/, "");
    return {
      id: chapterId,
      mangaId: pages.result.mangaId.toString(),
      pages: items.map((img) =>
        img.url.startsWith("http") ? img.url : `${base}/${img.url.replace(/^\//, "")}`,
      ),
    };
  }

  parseMangaDetails(mangaId: string, info: ApiResponse<MangaItem>): SourceManga {
    const manga = info.result;
    const toTag = (item: { id: number; title: string }): Tag => ({
      id: item.id.toString(),
      title: item.title,
    });
    const demographicArray: Tag[] = manga.demographics.map(toTag);
    const genreArray: Tag[] = manga.genres.map(toTag);

    const tags: TagSection[] = [
      {
        title: "demographic",
        tags: demographicArray,
        id: "demographic",
      },
      {
        title: "genres",
        tags: genreArray,
        id: "genres",
      },
    ];
    const mangaInfo = {
      thumbnailUrl: getPoster(manga),
      synopsis: manga.synopsis,
      primaryTitle: manga.title,
      secondaryTitles: manga.altTitles,
      contentRating: manga.contentRating !== "safe" ? ContentRating.ADULT : ContentRating.EVERYONE,
      status: manga.status,
      bannerUrl: getPoster(manga),
      artist: manga.artists?.map((artist) => artist.title).join(" ") ?? "",
      author: manga.authors?.map((author) => author.title).join(" ") ?? "",
      rating: manga.ratedAvg / 10,
      tagGroups: tags,
      shareUrl: `${DOMAIN}${manga.url}`,
    };
    return { mangaId: mangaId, mangaInfo: mangaInfo };
  }

  parseSearchResults(
    page: number,
    search: ApiResponse<ResultManga>,
  ): PagedResults<SearchResultItem> {
    const items: SearchResultItem[] = [];
    if (search.status.toString() === "ok") {
      search.result.items.forEach((item) => {
        items.push({
          mangaId: item.hid,
          title: item.title,
          imageUrl: getPoster(item),
          contentRating: getRanking(item.contentRating),
          subtitle: `Chapter ${item.finalChapter || item.latestChapter}`,
        });
      });
      return {
        items: items,
        metadata: search.result.items.length > 0 ? { page: page + 1 } : undefined,
      };
    }
    return {
      items: items,
      metadata: undefined,
    };
  }

  parseFilterUpdate(response: ApiResponse<Filter[]>): { id: string; value: string }[] {
    const filters: { id: string; value: string }[] = [];
    response.result.forEach((filter) => {
      filters.push({
        id: filter.id.toString(),
        value: filter.label,
      });
    });
    return filters;
  }
}
