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
import { fetchCustomListMangaIds } from "../shared/curated-lists";
import { normalizeUuid, resolveChapterId, resolveMangaId, UUID_SEARCH_RE } from "../shared/legacy";
import { ORIGINAL_LANGUAGES } from "../shared/lookups";
import type {
  ChapterAttributes,
  ChapterData,
  ChapterResponse,
  MangaItem,
  Metadata,
  SearchResponse,
  StatisticsResponse,
} from "../shared/models";
import {
  collectUniqueMangaIdsFromChapters,
  findMangaRelationshipId,
  parseMangaList,
} from "../shared/parsers";
import { dispatchSearch, type DispatchedSearch } from "../shared/search-dispatch";
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
import {
  buildChapterBatchUrl,
  buildChapterByIdUrl,
  buildLatestChaptersUrl,
  buildMangaListUrl,
  buildStatisticsBatchUrl,
} from "../shared/urls";
import { MANGA_PAGE_LIMIT, computeNextMetadata, reorderById } from "../shared/utils";
import { MangaDexAdvancedSearchForm, type MangaDexSearchMetadata } from "./forms";

type TagFilters = {
  ratings: string[];
  includedTags: string[];
  excludedTags: string[];
};

// ===== Input parsers =====

// Fans out any code with extraCodes (zh fans to zh + zh-hk).
function expandOriginalLanguages(selected: readonly string[]): string[] {
  if (!selected || selected.length === 0) return [];
  const out: string[] = [];
  for (const code of selected) {
    out.push(code);
    const extras = ORIGINAL_LANGUAGES.find((l) => l.enum === code)?.extraCodes;
    if (extras) out.push(...extras);
  }
  return out;
}

// Strict regex because parseInt would silently truncate "2024abc" to 2024.
function parseYearInput(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!/^\d{4}$/.test(trimmed)) return undefined;
  const year = Number(trimmed);
  return year > 0 ? year : undefined;
}

// ===== Filter and sort transformers =====

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

// ===== Shared fetchers =====

// Pass queryTitle=undefined for UUID flows where relevance scoring is pointless.
async function enrichAndParseMangaResults(
  mangaItems: MangaItem[],
  ratings: string[],
  languages: string[],
  queryTitle: string | undefined,
): Promise<SearchResultItem[]> {
  if (mangaItems.length === 0) return [];

  const wantRating = getShowSearchRatingInSubtitle();
  const chapterIds = mangaItems
    .map((manga) => manga.attributes?.latestUploadedChapter)
    .filter((id): id is string => !!id);
  const wantChapterDetails = (getShowVolume() || getShowChapter()) && chapterIds.length > 0;

  // Decorations fail open so a stats outage never blanks the page.
  const ratingPromise: Promise<StatisticsResponse | undefined> = wantRating
    ? fetchJSON<StatisticsResponse>({
        url: buildStatisticsBatchUrl(mangaItems.map((m) => m.id)).toString(),
        method: "GET",
      }).catch(() => undefined)
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

  let chapterDetailsMap: Record<string, ChapterAttributes> | undefined;
  if (chaptersResponse && Array.isArray(chaptersResponse.data)) {
    chapterDetailsMap = {};
    for (const chapter of chaptersResponse.data) {
      if (!chapter || !chapter.attributes) continue;
      chapterDetailsMap[chapter.id] = chapter.attributes;
    }
  }

  return parseMangaList(mangaItems, getSearchThumbnail, queryTitle, ratingJson, chapterDetailsMap);
}

// Rebuilds input order because /manga?ids[] resorts by latest chapter.
async function fetchAndEnrichOrderedMangaIds(
  orderedIds: readonly string[],
  ratings: string[],
  languages: string[],
): Promise<SearchResultItem[]> {
  if (orderedIds.length === 0) return [];

  const mangaResponse = await fetchJSON<SearchResponse>({
    url: buildMangaListUrl({
      limit: orderedIds.length,
      ratings,
      languages,
      ids: orderedIds,
    }).toString(),
    method: "GET",
  });

  if (!Array.isArray(mangaResponse.data)) return [];

  return enrichAndParseMangaResults(
    reorderById(mangaResponse.data, orderedIds),
    ratings,
    languages,
    undefined,
  );
}

// Uses /chapter/{id} (unfiltered) so a hidden rating cannot mask the manga.
async function resolveChapterToManga(chapterId: string): Promise<string | undefined> {
  try {
    const json = await fetchJSON<{ data?: ChapterData }>({
      url: buildChapterByIdUrl(chapterId, ["manga"]).toString(),
      method: "GET",
    });
    return findMangaRelationshipId(json.data?.relationships);
  } catch {
    return undefined;
  }
}

// ===== Dispatcher branches =====

const UPLOADER_FETCH_PAGE_CAP = 3;

// Ignores the blocked uploaders preference. usr:<uuid> is an explicit
// request, so the global blocklist does not apply here.
async function searchByUploader(
  uploaderUuid: string,
  metadata: Metadata | undefined,
  ratings: string[],
  languages: string[],
): Promise<PagedResults<SearchResultItem>> {
  let offset = metadata?.offset ?? 0;

  for (let attempt = 0; attempt < UPLOADER_FETCH_PAGE_CAP; attempt++) {
    const chaptersResponse = await fetchJSON<ChapterResponse>({
      url: buildLatestChaptersUrl({
        limit: MANGA_PAGE_LIMIT,
        offset,
        languages,
        ratings,
        uploaders: [uploaderUuid],
        includes: ["manga"],
      }).toString(),
      method: "GET",
    });

    if (!Array.isArray(chaptersResponse.data)) {
      return { items: [], metadata: undefined };
    }

    // Page by chapter count to avoid stalling on heavy uploaders.
    const chapters = chaptersResponse.data;
    const nextMetadata = computeNextMetadata(
      offset,
      chapters.length,
      chaptersResponse.total,
      MANGA_PAGE_LIMIT,
    );
    if (chapters.length === 0) {
      return { items: [], metadata: nextMetadata };
    }

    const { ids: orderedMangaIds } = collectUniqueMangaIdsFromChapters(chapters);

    const items = await fetchAndEnrichOrderedMangaIds(orderedMangaIds, ratings, languages);
    if (items.length > 0 || nextMetadata === undefined) {
      return { items, metadata: nextMetadata };
    }

    offset = nextMetadata.offset ?? offset + MANGA_PAGE_LIMIT;
  }

  return { items: [], metadata: { offset } };
}

const LIST_FETCH_PAGE_CAP = 3;

// Fetches /list once and carries the manga IDs across pages in metadata.
async function searchByList(
  listUuid: string,
  metadata: Metadata | undefined,
  ratings: string[],
  languages: string[],
): Promise<PagedResults<SearchResultItem>> {
  let offset = metadata?.offset ?? 0;

  let allMangaIds = metadata?.listMangaIds;
  if (!allMangaIds) {
    const fetched = await fetchCustomListMangaIds(listUuid);
    if (fetched === null) {
      return { items: [], metadata: undefined };
    }
    allMangaIds = fetched;
  }

  if (allMangaIds.length === 0) {
    return { items: [], metadata: undefined };
  }

  for (let attempt = 0; attempt < LIST_FETCH_PAGE_CAP; attempt++) {
    const slice = allMangaIds.slice(offset, offset + MANGA_PAGE_LIMIT);
    if (slice.length === 0) {
      return { items: [], metadata: undefined };
    }

    const nextOffset = offset + slice.length;
    const nextMetadata: Metadata | undefined =
      nextOffset < allMangaIds.length
        ? { offset: nextOffset, listMangaIds: allMangaIds }
        : undefined;

    const items = await fetchAndEnrichOrderedMangaIds(slice, ratings, languages);
    if (items.length > 0 || nextMetadata === undefined) {
      return { items, metadata: nextMetadata };
    }

    offset = nextOffset;
  }

  return { items: [], metadata: { offset, listMangaIds: allMangaIds } };
}

// ===== Exports =====

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
  const meta = query.metadata;

  const { ratings, includedTags, excludedTags } = applyTagFilters(meta?.tagsByGroup, getRatings());
  if (ratings.length === 0) {
    return { items: [], metadata: undefined };
  }

  const dispatched: DispatchedSearch | undefined = dispatchSearch(query.title);

  if (dispatched?.prefix === "usr") {
    return searchByUploader(dispatched.uuid, metadata, ratings, languages);
  }
  if (dispatched?.prefix === "list") {
    return searchByList(dispatched.uuid, metadata, ratings, languages);
  }

  // id / ch / UUID -> ids[]. grp / author -> filter params. Else -> title.
  let searchByIdsValue: string | undefined;
  let searchTitleValue: string | undefined;
  if (dispatched?.prefix === "id") {
    // resolveMangaId passes UUIDs through and maps legacy numeric ids.
    try {
      searchByIdsValue = await resolveMangaId(dispatched.uuid);
    } catch {
      return { items: [], metadata: undefined };
    }
  } else if (dispatched?.prefix === "ch") {
    let chapterUuid: string;
    try {
      chapterUuid = await resolveChapterId(dispatched.uuid);
    } catch {
      return { items: [], metadata: undefined };
    }
    const mangaUuid = await resolveChapterToManga(chapterUuid);
    if (!mangaUuid) return { items: [], metadata: undefined };
    searchByIdsValue = mangaUuid;
  } else if (!dispatched) {
    const bareUuidMatch = query.title?.match(UUID_SEARCH_RE);
    if (bareUuidMatch) {
      searchByIdsValue = bareUuidMatch[0].toLowerCase();
    } else {
      searchTitleValue = query.title?.trim() || undefined;
    }
  }

  const includedTagsMode = meta?.includeOperator?.[0];
  const excludedTagsMode = meta?.excludeOperator?.[0];

  const isTitleSearch = !!searchTitleValue;
  // Explicit sort wins. A title query with no sort gets order[relevance]=desc for full ranking.
  const { orderKey, orderValue } = resolveSortOrder(sortingOption, isTitleSearch);

  // Exact ID lookups skip form filters, but the global rating and
  // language gates still apply.
  const isExactIdLookup = !!searchByIdsValue;
  const hasAvailableChapters = isExactIdLookup ? undefined : (meta?.hasAvailableChapters ?? true);
  const demographics = isExactIdLookup ? [] : (meta?.demographics ?? []);
  const statuses = isExactIdLookup ? [] : (meta?.statuses ?? []);
  const originalLanguages = isExactIdLookup
    ? []
    : expandOriginalLanguages(meta?.originalLanguages ?? []);
  const year = isExactIdLookup ? undefined : parseYearInput(meta?.year);
  const formAuthorOrArtist = isExactIdLookup ? undefined : normalizeUuid(meta?.authorOrArtist);
  const formGroup = isExactIdLookup ? undefined : normalizeUuid(meta?.group);
  // Dispatched prefix wins when both the prefix and the form field are set.
  const authorOrArtist = dispatched?.prefix === "author" ? dispatched.uuid : formAuthorOrArtist;
  const group = dispatched?.prefix === "grp" ? dispatched.uuid : formGroup;

  const url = buildMangaListUrl({
    limit: MANGA_PAGE_LIMIT,
    offset,
    ratings,
    languages,
    hasAvailableChapters,
    orderKey,
    orderValue,
    demographics,
    statuses,
    originalLanguages,
    year,
    authorOrArtist,
    group,
  });
  if (searchByIdsValue) {
    url.setQueryItem("ids[]", searchByIdsValue);
  } else if (searchTitleValue) {
    url.setQueryItem("title", searchTitleValue);
  }
  // Tag filters also count as form filters, so drop them for ID lookups.
  if (!isExactIdLookup) {
    if (includedTagsMode) url.setQueryItem("includedTagsMode", includedTagsMode);
    if (excludedTagsMode) url.setQueryItem("excludedTagsMode", excludedTagsMode);
    url.setQueryItem("includedTags[]", includedTags);
    url.setQueryItem("excludedTags[]", excludedTags);
  }

  const json = await fetchJSON<SearchResponse>({ url: url.toString(), method: "GET" });

  if (!Array.isArray(json.data)) {
    return { items: [], metadata: undefined };
  }

  // Local relevance only fires for Best Match against a title query.
  const sortById = sortingOption?.id ?? "";
  const localRelevanceSort =
    !!searchTitleValue && (!sortById || sortById === "order[relevance]-desc");
  const items = await enrichAndParseMangaResults(
    json.data,
    ratings,
    languages,
    localRelevanceSort ? searchTitleValue : undefined,
  );

  return {
    items,
    metadata: computeNextMetadata(offset, json.data.length, json.total, MANGA_PAGE_LIMIT),
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
