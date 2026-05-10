/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Chapter,
  type ChapterDetails,
  ContentRating,
  CookieStorageInterceptor,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";

import { filter } from "./main";
import {
  type ChapterItem,
  DOMAIN,
  type Filters,
  type Metadata,
  NO_IMAGE,
  type SearchMetadata,
  type TagMap,
} from "./models";
import { ApiMaker } from "./network";
import { getDefaultMetadata, getRanking, parseRelativeDate } from "./utils/utilsFunctions";

const api = new ApiMaker();
export class JsonParser {
  async parseSection(section: string) {
    const latest: DiscoverSectionItem[] = [];
    const json = await api.getJsonMangaTopApi(section);
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
          imageUrl: item.poster?.large.length > 0 ? item.poster?.large : NO_IMAGE,
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
  async parseGenreSection(
    ComixMetadata: Metadata | undefined,
  ): Promise<{ items: DiscoverSectionItem[]; metadata: Metadata }> {
    await filter.updateFilters(true);
    const allGenres: DiscoverSectionItem[] = [];
    const page = ComixMetadata?.page ?? 1;
    filter.genres
      .filter((filterName) => {
        return !filter.getHiddenGenresSettings().includes(filterName.id);
      })
      .forEach((filterItem) => {
        allGenres.push({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: getDefaultMetadata(filterItem.id),
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

  async parseSectionSimple(section: string, metadata: Metadata) {
    const latest: DiscoverSectionItem[] = [];
    const page = metadata?.page ?? 1;
    const json = await api.getJsonMangaApi(section, page);
    if (json.status === "ok") {
      for (const item of json.result.items) {
        latest.push({
          contentRating: getRanking(item.contentRating),
          imageUrl: item.poster.large.length > 0 ? item.poster.large : NO_IMAGE,
          mangaId: item?.hid ?? "NULL",
          subtitle: "Chapter " + item.finalChapter.toString(),
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

  async parseSectionChapter(section: string, metadata: Metadata) {
    const latest: DiscoverSectionItem[] = [];
    const page = metadata?.page ?? 1;
    const json = await api.getJsonMangaApi(section, page);
    if (json.status === "ok") {
      for (const item of json.result.items) {
        latest.push({
          contentRating: getRanking(item.contentRating),
          imageUrl: item.poster.large.length > 0 ? item.poster.large : NO_IMAGE,
          chapterId: item.hid,
          mangaId: item.hid,
          subtitle: "Chapter " + item.finalChapter.toString(),
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

  async parseChapters(
    manga: SourceManga,
    cookieStorageInterceptor: CookieStorageInterceptor,
  ): Promise<Chapter[]> {
    const firstPage = await api.getJsonChapterApi(manga.mangaId, 1, cookieStorageInterceptor);

    const totalPages = firstPage.result.meta.lastPage ?? 1;
    const requests: Promise<{ page: number; data: ChapterItem[] }>[] = [];
    requests.push(Promise.resolve({ page: 1, data: firstPage.result.items }));
    for (let page = 2; page <= totalPages; page++) {
      requests.push(
        api.getJsonChapterApi(manga.mangaId, page, cookieStorageInterceptor).then((r) => ({
          page,
          data: r.result.items,
        })),
      );
    }
    const allPages = await Promise.all(requests);
    allPages.sort((a, b) => a.page - b.page);
    const chaptersArray = allPages.flatMap((p) => p.data);
    return chaptersArray.map((chapter) => {
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
        additionalInfo: { vote: chapter.votes.toString() },
      };
    });
  }

  async parseChapterDetails(
    chapterId: string,
    cookieInterceptor: CookieStorageInterceptor,
  ): Promise<ChapterDetails> {
    const pages = await api.getJsonChapPagesApi(chapterId, cookieInterceptor);
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

  async parseMangaDetails(mangaId: string): Promise<SourceManga> {
    const info = await api.getJsonMangaInfoApi(mangaId);
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
      thumbnailUrl: manga.poster.large.length > 0 ? manga.poster.large : NO_IMAGE,
      synopsis: manga.synopsis,
      primaryTitle: manga.title,
      secondaryTitles: manga.altTitles,
      contentRating: manga.contentRating !== "safe" ? ContentRating.ADULT : ContentRating.EVERYONE,
      status: manga.status,
      bannerUrl: manga.poster.medium.length > 0 ? manga.poster.medium : NO_IMAGE,
      artist: manga.artists?.map((artist) => artist.title).join(" ") ?? "",
      author: manga.authors?.map((author) => author.title).join(" ") ?? "",
      rating: manga.ratedAvg / 10,
      tagGroups: tags,
      shareUrl: `${DOMAIN}/title/${manga.hid}`,
    };
    return { mangaId: mangaId, mangaInfo: mangaInfo };
  }

  async parseSearchResults(
    query: SearchQuery<SearchMetadata>,
    metadata: Metadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    function mapTags(filter: string | TagMap) {
      if (!filter || typeof filter !== "object") return [];
      return Object.entries(filter).flatMap(([key, value]) => {
        if (value === "included") return [key];
        return [];
      });
    }
    function mapTagsExcluded(filter: string | TagMap) {
      if (!filter || typeof filter !== "object") return [];
      return Object.entries(filter).flatMap(([key, value]) => {
        if (value === "excluded") return [key];
        return [];
      });
    }
    function buildFilter(
      excluded: boolean,
      type: Filters["type"],
      ...sources: (string | TagMap)[]
    ): Filters[] {
      let values = [];
      if (excluded) {
        values = sources.flatMap(mapTagsExcluded);
      } else {
        values = sources.flatMap(mapTags);
      }
      return values.length ? [{ type, filters: values }] : [];
    }
    const page = metadata?.page ?? 1;
    const genres = query.metadata?.genres ?? {};
    const formats = query.metadata?.formats ?? {};
    const demographic = query.metadata?.demographic ?? {};
    const status = query.metadata?.status ?? {};
    const types = query.metadata?.types ?? {};
    const mode = query.metadata?.mode ?? "and";
    const [sortBy, orderBy] = sortingOption.id.split("$");
    const filters: Filters[] = [
      ...buildFilter(false, "genres_in[]", genres, formats),
      ...buildFilter(true, "genres_ex[]", genres, formats),
      ...buildFilter(false, "types[]", types),
      ...buildFilter(false, "demographics[]", demographic),
      ...buildFilter(false, "statuses[]", status),
    ];
    const search = await api.getJsonSearchApi(
      query.title,
      page,
      filters,
      mode as string,
      sortBy,
      orderBy,
    );
    const items: SearchResultItem[] = [];
    if (search.status.toString() === "ok") {
      search.result.items.forEach((item) => {
        items.push({
          mangaId: item.hid,
          title: item.title,
          imageUrl: item.poster.large.length > 0 ? item.poster.large : NO_IMAGE,
          contentRating: getRanking(item.contentRating),
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

  async parseFilterUpdate(type: string): Promise<{ id: string; value: string }[]> {
    const filter = await api.getFiltersApi(type);
    const filters: { id: string; value: string }[] = [];
    filter.result.forEach((filter) => {
      filters.push({
        id: filter.id.toString(),
        value: filter.label,
      });
    });
    return filters;
  }
}
