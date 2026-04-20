/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import {
  type ChapterItem,
  type Metadata,
  type Filters,
  type TagMap,
  DOMAIN,
  NO_IMAGE,
} from "./models";
import { ApiMaker } from "./network";

const api = new ApiMaker();
export class JsonParser {
  async parseSection(section: string, metadata: Metadata | undefined) {
    const latest: DiscoverSectionItem[] = [];
    const page = metadata?.page ?? 1;
    const json = await api.getJsonMangaApi(section, page);
    if (json.status === 200) {
      for (const item of json.result.items) {
        latest.push({
          type:
            section === "follow"
              ? "prominentCarouselItem"
              : section === "popular"
                ? "featuredCarouselItem"
                : "simpleCarouselItem",
          contentRating: item.is_nsfw ? ContentRating.ADULT : ContentRating.EVERYONE,
          imageUrl: item.poster.large.length > 0 ? item.poster.large : NO_IMAGE,
          mangaId: item.hash_id,
          title: item.title,
          subtitle: item.author?.map((author) => author.title).join(" ") ?? "",
        });
      }
    }
    return {
      items: latest,
      metadata: section === "follow" || section === "popular" ? undefined : { page: page + 1 },
    };
  }

  async parseSectionChUp(section: string, metadata: Metadata) {
    const latest: DiscoverSectionItem[] = [];
    const page = metadata?.page ?? 1;
    const json = await api.getJsonMangaApi(section, page);
    if (json.status === 200) {
      json.result.items.forEach((item) => {
        latest.push({
          contentRating: item.is_nsfw ? ContentRating.ADULT : ContentRating.EVERYONE,
          imageUrl: item.poster.large.length > 0 ? item.poster.large : NO_IMAGE,
          chapterId: item.hash_id,
          mangaId: item.hash_id,
          subtitle: "Chapter " + item.latest_chapter.toString(),
          title: item.title,
          type: "chapterUpdatesCarouselItem",
          publishDate: new Date(item.chapter_updated_at * 1000),
        });
      });
      return {
        items: latest,
        metadata: json.result.items.length > 0 ? { page: page + 1 } : undefined,
      };
    }
    return { items: latest, metadata: undefined };
  }

  async parseChapters(manga: SourceManga): Promise<Chapter[]> {
    const firstPage = await api.getJsonChapterApi(manga.mangaId, 1);

    const totalPages = firstPage.result.pagination.last_page ?? 1;
    const requests: Promise<{ page: number; data: ChapterItem[] }>[] = [];
    requests.push(Promise.resolve({ page: 1, data: firstPage.result.items }));
    for (let page = 2; page <= totalPages; page++) {
      requests.push(
        api.getJsonChapterApi(manga.mangaId, page).then((r) => ({
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
        chapterId: chapter.chapter_id.toString(),
        sourceManga: manga,
        langCode: chapter.language,
        chapNum: chapter.number,
        title: chapter.name,
        volume: chapter.volume,
        version:
          chapter.is_official === 1 ? "⭐Official" : (chapter.scanlation_group?.name ?? "Unknown"),
        sortingIndex: chapter.number,
        publishDate: new Date(chapter.updated_at * 1000),
        creationDate: new Date(chapter.created_at * 1000),
        additionalInfo: { vote: chapter.votes.toString() },
      };
    });
  }

  async parseChapterDetails(chapterId: string): Promise<ChapterDetails> {
    const pages = await api.getJsonChapPagesApi(chapterId);
    return {
      id: chapterId,
      mangaId: pages.result.manga_id.toString(),
      pages: pages.result.images.map((img) => img.url),
    };
  }

  async parseMangaDetails(mangaId: string): Promise<SourceManga> {
    const info = await api.getJsonMangaInfoApi(mangaId);
    const manga = info.result;
    const toTag = (item: { term_id: number; title: string }): Tag => ({
      id: item.term_id.toString(),
      title: item.title,
    });
    const demographicArray: Tag[] = manga.demographic.map(toTag);
    const genreArray: Tag[] = manga.genre.map(toTag);
    const themeArray: Tag[] = manga.theme.map(toTag);

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
      {
        title: "themes",
        tags: themeArray,
        id: "themes",
      },
    ];
    const mangaInfo = {
      thumbnailUrl: manga.poster.large.length > 0 ? manga.poster.large : NO_IMAGE,
      synopsis: manga.synopsis,
      primaryTitle: manga.title,
      secondaryTitles: manga.alt_titles,
      contentRating: manga.is_nsfw ? ContentRating.ADULT : ContentRating.EVERYONE,
      status: manga.status,
      bannerUrl: manga.poster.medium.length > 0 ? manga.poster.medium : NO_IMAGE,
      artist: manga.artist?.map((artist) => artist.title).join(" ") ?? "",
      author: manga.author?.map((author) => author.title).join(" ") ?? "",
      rating: manga.rated_avg / 10,
      tagGroups: tags,
      shareUrl: `${DOMAIN}/title/${manga.hash_id}`,
    };
    return { mangaId: mangaId, mangaInfo: mangaInfo };
  }

  async parseSearchResults(
    query: SearchQuery,
    metadata: Metadata | undefined,
    sortingOption: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    function mapTags(filter: string | TagMap) {
      if (!filter || typeof filter !== "object") return [];
      return Object.entries(filter).flatMap(([key, value]) => {
        if (value === "included") return [key];
        if (value === "excluded") return ["-" + key];
        return [];
      });
    }
    function buildFilter(type: Filters["type"], ...sources: (string | TagMap)[]): Filters[] {
      const values = sources.flatMap(mapTags);
      return values.length ? [{ type, filters: values }] : [];
    }
    const page = metadata?.page ?? 1;
    const getFilterValue = (id: string) => query.filters.find((filter) => filter.id == id)?.value;
    const genres: string | TagMap = getFilterValue("genres") ?? "";
    const themes: string | TagMap = getFilterValue("themes") ?? "";
    const types: string | TagMap = getFilterValue("types") ?? "";
    const demographic: string | TagMap = getFilterValue("demographic") ?? "";
    const status: string | TagMap = getFilterValue("status") ?? "";
    const formats: string | TagMap = getFilterValue("formats") ?? "";

    const mode: string | TagMap = getFilterValue("filter_mode") ?? "";
    const [sortBy, orderBy] = sortingOption.id.split("$");
    const filters: Filters[] = [
      ...buildFilter("genres[]", genres, themes, formats),
      ...buildFilter("types[]", types),
      ...buildFilter("demographics[]", demographic),
      ...buildFilter("statuses[]", status),
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
    if (search.status === 200) {
      search.result.items.forEach((item) => {
        items.push({
          mangaId: item.hash_id,
          title: item.title,
          imageUrl: item.poster.large.length > 0 ? item.poster.large : NO_IMAGE,
          contentRating: item.is_nsfw ? ContentRating.ADULT : ContentRating.EVERYONE,
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
    filter.result.items.forEach((filter) => {
      filters.push({
        id: filter.term_id.toString(),
        value: filter.title,
      });
    });
    return filters;
  }
}
