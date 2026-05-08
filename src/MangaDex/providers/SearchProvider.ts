/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  URL,
  type PagedResults,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type TagSection,
} from "@paperback/types";
import type { SearchFilter, SearchFilterValue } from "@paperback/types/lib/compat/0.8";

import tagJSON from "../external/tag.json";
import { parseMangaList } from "../MangaDexParser";
import {
  getLanguages,
  getRatings,
  getSearchThumbnail,
  getShowChapter,
  getShowSearchRatingInSubtitle,
  getShowVolume,
} from "../MangaDexSettings";
import type {
  ChapterAttributes,
  ChapterResponse,
  Metadata,
  SearchResponse,
  StatisticsResponse,
} from "../models";
import { fetchJSON, MANGADEX_API } from "../utils/CommonUtil";

/**
 * Handles manga search functionality and filters
 */
export class SearchProvider {
  /**
   * Returns tag sections for manga search filters
   */
  getSearchTags(): TagSection[] {
    const ratings: string[] = getRatings();
    const sections: Record<string, TagSection> = {};

    for (const tag of tagJSON) {
      const group = tag.data.attributes.group;

      if (sections[group] == null) {
        sections[group] = {
          id: group,
          title: group.charAt(0).toUpperCase() + group.slice(1),
          tags: [],
        };
      }

      const tagObject = {
        id: tag.data.id,
        title:
          tag.data.type === "rating" && !ratings.includes(tag.data.attributes.name.en.toLowerCase())
            ? `${tag.data.attributes.name.en} (Blocked in settings)`
            : tag.data.attributes.name.en,
      };
      sections[group].tags = [...(sections[group]?.tags ?? []), tagObject];
    }

    return Object.values(sections);
  }

  /**
   * Builds search filter UI components
   */
  async getSearchFilters(): Promise<SearchFilter[]> {
    const filters: SearchFilter[] = [];

    filters.push({
      id: "includeOperator",
      type: "dropdown",
      options: [
        { id: "AND", value: "AND" },
        { id: "OR", value: "OR" },
      ],
      value: "AND",
      title: "Include Operator",
    });

    filters.push({
      id: "excludeOperator",
      type: "dropdown",
      options: [
        { id: "AND", value: "AND" },
        { id: "OR", value: "OR" },
      ],
      value: "OR",
      title: "Exclude Operator",
    });

    const tags = this.getSearchTags();
    for (const tag of tags) {
      filters.push({
        type: "multiselect",
        options: tag.tags.map((x) => ({ id: x.id, value: x.title })),
        id: "tags-" + tag.id,
        allowExclusion: true,
        title: tag.title.replace(/_/g, " "),
        value: {},
        allowEmptySelection: true,
        maximum: undefined,
      });
    }

    return filters;
  }

  /**
   * Executes manga search with filters and returns results
   */
  async getSearchResults(
    query: SearchQuery<SearchFilterValue[]>,
    metadata: Metadata,
    sortingOption: SortingOption | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const ratings: string[] = getRatings();
    const languages: string[] = getLanguages();
    const offset: number = metadata?.offset ?? 0;
    let results: SearchResultItem[] = [];

    const searchType = query.title?.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
    )
      ? "ids[]"
      : "title";
    const url = new URL(MANGADEX_API)
      .addPathComponent("manga")
      .setQueryItem(searchType, query?.title?.replace(/ /g, "+") || "")
      .setQueryItem("limit", "100")
      .setQueryItem("hasAvailableChapters", "true")
      .setQueryItem("availableTranslatedLanguage[]", languages)
      .setQueryItem("offset", offset.toString())
      .setQueryItem("contentRating[]", ratings)
      .setQueryItem("includes[]", "cover_art");

    if (sortingOption && sortingOption.id) {
      const index = sortingOption.id.lastIndexOf("-");
      if (index > 0) {
        const key = sortingOption.id.substring(0, index);
        const value = sortingOption.id.substring(index + 1);
        if (key && value) {
          url.setQueryItem(key, value);
        }
      }
    }

    const includedTags = [];
    const excludedTags = [];
    for (const filter of query.metadata ?? []) {
      if (filter.id.startsWith("tags")) {
        if (filter.id.includes("rating")) {
          const tags = (filter.value ?? {}) as Record<string, "included" | "excluded">;
          const ratingMap: Record<string, string> = {
            "1": "safe",
            "2": "suggestive",
            "3": "erotica",
            "4": "pornographic",
          };
          for (const [id, status] of Object.entries(tags)) {
            const rating = ratingMap[id];
            if (!rating) continue;
            const index = ratings.indexOf(rating);
            if (status === "excluded" && index !== -1) {
              ratings.splice(index, 1);
            } else if (status === "included" && index === -1) {
              ratings.push(rating);
            }
          }
        } else {
          const tags = (filter.value ?? {}) as Record<string, "included" | "excluded">;
          for (const tag of Object.entries(tags)) {
            switch (tag[1]) {
              case "excluded":
                excludedTags.push(tag[0]);
                break;
              case "included":
                includedTags.push(tag[0]);
                break;
            }
          }
        }
      }

      if (filter.id == "includeOperator") {
        url.setQueryItem("includedTagsMode", (filter.value as string) ?? "and");
      }

      if (filter.id == "excludeOperator") {
        url.setQueryItem("excludedTagsMode", (filter.value as string) ?? "or");
      }
    }

    const request = {
      url: url
        .setQueryItem("includedTags[]", includedTags)
        .setQueryItem("excludedTags[]", excludedTags)
        .toString(),
      method: "GET",
    };
    const json = await fetchJSON<SearchResponse>(request);

    let ratingJson: StatisticsResponse | undefined = undefined;
    if (getShowSearchRatingInSubtitle() && json.data && json.data.length > 0) {
      const mangaIds = json.data.map((manga) => manga.id);
      const ratingRequest = {
        url: new URL(MANGADEX_API)
          .addPathComponent("statistics")
          .addPathComponent("manga")
          .setQueryItem("manga[]", mangaIds)
          .toString(),
        method: "GET",
      };
      ratingJson = await fetchJSON<StatisticsResponse>(ratingRequest);
    }

    const chapterDetailsMap: Record<string, ChapterAttributes> = {};
    const chapterIds = json.data
      .map((manga) => manga.attributes.latestUploadedChapter)
      .filter((id): id is string => !!id);

    if ((getShowVolume() || getShowChapter()) && chapterIds.length > 0) {
      const chapterDetailsRequest = {
        url: new URL(MANGADEX_API)
          .addPathComponent("chapter")
          .setQueryItem("ids[]", chapterIds)
          .setQueryItem("limit", chapterIds.length.toString())
          .toString(),
        method: "GET",
      };
      const chaptersResponse = await fetchJSON<ChapterResponse>(chapterDetailsRequest);
      if (chaptersResponse.data) {
        for (const chapter of chaptersResponse.data) {
          chapterDetailsMap[chapter.id] = chapter.attributes;
        }
      }
    }

    results = await parseMangaList(
      json.data,
      getSearchThumbnail,
      query,
      ratingJson,
      chapterDetailsMap,
    );
    const nextMetadata: Metadata | undefined =
      results.length < 100 ? undefined : { offset: offset + 100 };

    return { items: results, metadata: nextMetadata };
  }

  async getSortingOptions(_query: SearchQuery<SearchFilterValue[]>): Promise<SortingOption[]> {
    return [
      { id: "", label: "Latest Upload" },
      { id: "order[relevance]-desc", label: "Best Match" },
      { id: "order[latestUploadedChapter]-asc", label: "Oldest Upload" },
      { id: "order[title]-asc", label: "Title Ascending" },
      { id: "order[title]-desc", label: "Title Descending" },
      { id: "order[rating]-desc", label: "Highest Rating" },
      { id: "order[rating]-asc", label: "Lowest Rating" },
      { id: "order[followedCount]-desc", label: "Most Follows" },
      { id: "order[followedCount]-asc", label: "Least Follows" },
      { id: "order[createdAt]-desc", label: "Recently Added" },
      { id: "order[createdAt]-asc", label: "Oldest Added" },
      { id: "order[year]-asc", label: "Year Ascending" },
      { id: "order[year]-desc", label: "Year Descending" },
    ];
  }
}
