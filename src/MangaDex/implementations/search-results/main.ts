/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  AdvancedSearchForm,
  PagedResults,
  SearchQuery,
  SearchResultItem,
  SortingOption,
  TagSection,
} from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { UUID_SEARCH_RE } from "../shared/legacy";
import type {
  ChapterAttributes,
  ChapterResponse,
  Metadata,
  SearchResponse,
  StatisticsResponse,
} from "../shared/models";
import { parseMangaList } from "../shared/parsers";
import {
  getLanguages,
  getRatings,
  getSearchThumbnail,
  getShowChapter,
  getShowSearchRatingInSubtitle,
  getShowVolume,
} from "../shared/state";
import {
  CONTENT_RATING_GROUP,
  getSearchTagSections,
  SYNTHETIC_RATING_ID_TO_NAME,
} from "../shared/tags";
import { buildChapterBatchUrl, buildMangaListUrl, buildStatisticsBatchUrl } from "../shared/urls";
import { computeNextMetadata } from "../shared/utils";
import { MangaDexAdvancedSearchForm, type MangaDexSearchMetadata } from "./forms";

type TagFilters = {
  ratings: string[];
  includedTags: string[];
  excludedTags: string[];
};

function applyTagFilters(
  tagsByGroup: MangaDexSearchMetadata["tagsByGroup"],
  baseRatings: string[],
): TagFilters {
  const ratings = new Set(baseRatings);
  const includedTags: string[] = [];
  const excludedTags: string[] = [];
  if (tagsByGroup) {
    for (const [groupId, tagMap] of Object.entries(tagsByGroup)) {
      if (groupId === CONTENT_RATING_GROUP) {
        // Per search override of content settings, matching MangaDex's web UI.
        for (const [id, status] of Object.entries(tagMap)) {
          const rating = SYNTHETIC_RATING_ID_TO_NAME[id];
          if (!rating) continue;
          if (status === "excluded") ratings.delete(rating);
          else if (status === "included") ratings.add(rating);
        }
      } else {
        for (const [tagId, status] of Object.entries(tagMap)) {
          if (status === "included") includedTags.push(tagId);
          else if (status === "excluded") excludedTags.push(tagId);
        }
      }
    }
  }
  return { ratings: [...ratings], includedTags, excludedTags };
}

function resolveSortOrder(
  sortingOption: SortingOption | undefined,
  isTitleSearch: boolean,
): { orderKey?: string; orderValue?: "asc" | "desc" } {
  const id = sortingOption?.id;
  if (id) {
    const index = id.lastIndexOf("-");
    if (index > 0) {
      const key = id.substring(0, index);
      const value = id.substring(index + 1);
      // MangaDex returns 400 if order[relevance] is set without a title.
      const skipRelevance = key === "order[relevance]" && !isTitleSearch;
      if ((value === "asc" || value === "desc") && !skipRelevance) {
        return { orderKey: key, orderValue: value };
      }
    }
  }
  if (isTitleSearch) {
    return { orderKey: "order[relevance]", orderValue: "desc" };
  }
  return {};
}

export async function getSearchTags(): Promise<TagSection[]> {
  return getSearchTagSections(getRatings());
}

export async function getAdvancedSearchForm(
  query: SearchQuery<MangaDexSearchMetadata>,
): Promise<AdvancedSearchForm> {
  const tagSections = await getSearchTags();
  return new MangaDexAdvancedSearchForm(query, tagSections);
}

export async function getSearchResults(
  query: SearchQuery<MangaDexSearchMetadata>,
  metadata: Metadata | undefined,
  sortingOption: SortingOption | undefined,
): Promise<PagedResults<SearchResultItem>> {
  const languages: string[] = getLanguages();
  const offset: number = metadata?.offset ?? 0;

  const uuidMatch = query.title?.match(UUID_SEARCH_RE);
  const searchType = uuidMatch ? "ids[]" : "title";
  // UUID queries search by id only, lowercased to match MangaDex
  const searchValue = uuidMatch ? uuidMatch[0].toLowerCase() : (query?.title ?? "");
  const isTitleSearch = !!searchValue && searchType === "title";

  const { ratings, includedTags, excludedTags } = applyTagFilters(
    query.metadata?.tagsByGroup,
    getRatings(),
  );
  if (ratings.length === 0) {
    return { items: [], metadata: undefined };
  }

  const includedTagsMode = query.metadata?.includeOperator?.[0];
  const excludedTagsMode = query.metadata?.excludeOperator?.[0];

  // Explicit sort wins. A title query with no sort gets order[relevance]=desc for full ranking.
  const { orderKey, orderValue } = resolveSortOrder(sortingOption, isTitleSearch);

  const url = buildMangaListUrl({
    limit: 100,
    offset,
    ratings,
    languages,
    includes: ["cover_art"],
    hasAvailableChapters: true,
    orderKey,
    orderValue,
  });
  // Skip title/ids when the user typed nothing.
  if (searchValue) {
    url.setQueryItem(searchType, searchValue);
  }
  if (includedTagsMode) url.setQueryItem("includedTagsMode", includedTagsMode);
  if (excludedTagsMode) url.setQueryItem("excludedTagsMode", excludedTagsMode);
  url.setQueryItem("includedTags[]", includedTags);
  url.setQueryItem("excludedTags[]", excludedTags);

  const json = await fetchJSON<SearchResponse>({ url: url.toString(), method: "GET" });

  if (!Array.isArray(json.data)) {
    return { items: [], metadata: undefined };
  }

  // Independent lookups in parallel. Worst case is one round trip.
  const wantRating = getShowSearchRatingInSubtitle() && json.data.length > 0;
  const chapterIds = json.data
    .map((manga) => manga.attributes?.latestUploadedChapter)
    .filter((id): id is string => !!id);
  const wantChapterDetails = (getShowVolume() || getShowChapter()) && chapterIds.length > 0;

  const ratingPromise: Promise<StatisticsResponse | undefined> = wantRating
    ? fetchJSON<StatisticsResponse>({
        url: buildStatisticsBatchUrl(json.data.map((m) => m.id)).toString(),
        method: "GET",
      }).catch(() => {
        // Rating is decorative. A stats outage must not blank the page.
        return undefined;
      })
    : Promise.resolve(undefined);

  const chaptersPromise: Promise<ChapterResponse | undefined> = wantChapterDetails
    ? fetchJSON<ChapterResponse>({
        url: buildChapterBatchUrl({
          chapterIds,
          languages,
          ratings,
        }).toString(),
        method: "GET",
      }).catch(() => undefined)
    : Promise.resolve(undefined);

  const [ratingJson, chaptersResponse] = await Promise.all([ratingPromise, chaptersPromise]);

  // undefined on failure. parseMangaList treats any present map as authoritative.
  let chapterDetailsMap: Record<string, ChapterAttributes> | undefined;
  if (chaptersResponse && Array.isArray(chaptersResponse.data)) {
    chapterDetailsMap = {};
    for (const chapter of chaptersResponse.data) {
      if (!chapter || !chapter.attributes) continue;
      chapterDetailsMap[chapter.id] = chapter.attributes;
    }
  }

  // Local relevance sort only for Best Match. UUID queries skip because token similarity is 0.
  const sortById = sortingOption?.id ?? "";
  const localRelevanceSort = !uuidMatch && (!sortById || sortById === "order[relevance]-desc");
  const items = parseMangaList(
    json.data,
    getSearchThumbnail,
    localRelevanceSort ? query.title : undefined,
    ratingJson,
    chapterDetailsMap,
  );

  return {
    items,
    metadata: computeNextMetadata(offset, json.data.length, json.total, 100),
  };
}

export async function getSortingOptions(
  _query: SearchQuery<MangaDexSearchMetadata>,
): Promise<SortingOption[]> {
  return [
    { id: "order[latestUploadedChapter]-desc", label: "Latest Upload" },
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
