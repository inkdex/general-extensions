/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  DiscoverSectionType,
  type DiscoverSection,
  type DiscoverSectionItem,
  type PagedResults,
} from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { ensureCuratedListIds, fetchCustomListMangaIds } from "../shared/curated-lists";
import type { ChapterResponse, Metadata, SearchResponse } from "../shared/models";
import {
  assertDataArray,
  collectUniqueMangaIdsFromChapters,
  parseChapterTitle,
  parseMangaList,
} from "../shared/parsers";
import {
  DISCOVER_SECTIONS,
  SECTION_DEFINITIONS,
  getBlockedUploaders,
  getDiscoverSectionOrder,
  getDiscoverThumbnail,
  getLanguages,
  getLatestUpdatesEnabled,
  getPopularEnabled,
  getRatings,
  getRecentlyAddedEnabled,
  getRecommendedEnabled,
  getSeasonalEnabled,
  getSelfPublishedEnabled,
  getShowChapter,
  getShowVolume,
} from "../shared/state";
import { buildLatestChaptersUrl, buildMangaListUrl } from "../shared/urls";
import {
  MANGA_PAGE_LIMIT,
  chunk,
  computeNextMetadata,
  formatCreatedAtSince,
  parseDateOrEpoch,
  reorderById,
} from "../shared/utils";

// Match the MangaDex website's "Popular New Titles" filter window.
const POPULAR_NEW_TITLES_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

// Translates the string type stored in SECTION_DEFINITIONS into the runtime
// enum. The enum is local to this module so shared/state.ts does not depend
// on @paperback/types.
const SECTION_TYPE_MAP: Record<string, DiscoverSectionType> = {
  prominentCarousel: DiscoverSectionType.prominentCarousel,
  chapterUpdates: DiscoverSectionType.chapterUpdates,
  simpleCarousel: DiscoverSectionType.simpleCarousel,
  featured: DiscoverSectionType.featured,
};

// Prominent and simple carousels share one item shape and differ only by type.
// Generic over the literal so each item still narrows to its DiscoverSectionItem
// member. Featured items carry a different shape and are built inline.
function toCarouselItems<T extends "prominentCarouselItem" | "simpleCarouselItem">(
  items: ReturnType<typeof parseMangaList>,
  type: T,
) {
  return items.map((x) => ({
    type,
    mangaId: x.mangaId,
    imageUrl: x.imageUrl,
    title: x.title,
    subtitle: x.subtitle,
    contentRating: x.contentRating,
  }));
}

export async function getDiscoverSections(): Promise<DiscoverSection[]> {
  const sectionOrder = getDiscoverSectionOrder();
  const definitionsById = new Map(SECTION_DEFINITIONS.map((s) => [s.id, s]));
  const sections: DiscoverSection[] = [];
  for (const sectionId of sectionOrder) {
    const definition = definitionsById.get(sectionId);
    if (definition && definition.getEnabled()) {
      sections.push({
        id: definition.id,
        title: definition.title,
        type: SECTION_TYPE_MAP[definition.type],
      });
    }
  }
  return sections;
}

export async function getDiscoverSectionItems(
  section: DiscoverSection,
  metadata: Metadata | undefined,
): Promise<PagedResults<DiscoverSectionItem>> {
  const sectionId = section.id;

  if (sectionId === DISCOVER_SECTIONS.POPULAR) {
    if (!getPopularEnabled()) return { items: [], metadata: undefined };
    return getPopularNewTitlesItems(section, metadata);
  }

  if (sectionId === DISCOVER_SECTIONS.LATEST_UPDATES) {
    if (!getLatestUpdatesEnabled()) return { items: [], metadata: undefined };
    return getLatestUpdatesItems(section, metadata);
  }

  if (sectionId === DISCOVER_SECTIONS.RECOMMENDED) {
    if (!getRecommendedEnabled()) return { items: [], metadata: undefined };
    const ids = await ensureCuratedListIds();
    return getCuratedListItems(section, ids.recommended, "simpleCarouselItem");
  }

  if (sectionId === DISCOVER_SECTIONS.SELF_PUBLISHED) {
    if (!getSelfPublishedEnabled()) return { items: [], metadata: undefined };
    const ids = await ensureCuratedListIds();
    return getCuratedListItems(section, ids.selfPublished, "simpleCarouselItem");
  }

  if (sectionId === DISCOVER_SECTIONS.SEASONAL) {
    if (!getSeasonalEnabled()) return { items: [], metadata: undefined };
    const ids = await ensureCuratedListIds();
    return getCuratedListItems(section, ids.seasonal, "featuredCarouselItem");
  }

  if (sectionId === DISCOVER_SECTIONS.RECENTLY_ADDED) {
    if (!getRecentlyAddedEnabled()) return { items: [], metadata: undefined };
    return getRecentlyAddedItems(section, metadata);
  }

  return { items: [], metadata: undefined };
}

async function getCustomListManga(
  listId: string,
  ratings: string[],
  languages: string[],
): Promise<{ ids: string[]; urls: string[] } | null> {
  // The /manga response is sorted by latest chapter, so the
  // caller restores the curator's order from this array.
  const ids = await fetchCustomListMangaIds(listId);
  if (ids === null) {
    throw new Error(`MangaDex returned no list data for ${listId}`);
  }

  // An empty ids[] would drop the filter and return 100 unrelated manga.
  if (ids.length === 0) return null;

  // /manga?ids[] caps at MANGA_PAGE_LIMIT, so chunk to avoid truncating curators with longer lists.
  const urls = chunk(ids, MANGA_PAGE_LIMIT).map((batch) =>
    buildMangaListUrl({
      limit: batch.length,
      ratings,
      languages,
      ids: batch,
    }).toString(),
  );

  return { ids, urls };
}

async function getCuratedListItems(
  section: DiscoverSection,
  listId: string,
  carouselType: "featuredCarouselItem" | "simpleCarouselItem",
): Promise<PagedResults<DiscoverSectionItem>> {
  const ratings: string[] = getRatings();
  const languages: string[] = getLanguages();

  const listData = await getCustomListManga(listId, ratings, languages);
  if (!listData) return { items: [], metadata: undefined };

  // allSettled keeps the carousel populated when one batch fails.
  const responses = await Promise.allSettled(
    listData.urls.map((url) => fetchJSON<SearchResponse>({ url, method: "GET" })),
  );
  const allData: SearchResponse["data"] = responses.flatMap((result) => {
    if (result.status === "rejected") return [];
    return Array.isArray(result.value.data) ? result.value.data : [];
  });
  if (allData.length === 0) {
    // Show an empty section if user's filters hid all results
    if (responses.some((r) => r.status === "fulfilled")) {
      return { items: [], metadata: undefined };
    }
    throw new Error(`Failed to create results for ${section.title}, check MangaDex status`);
  }

  // Items missing from allData (filtered out per batch) are dropped.
  const items = parseMangaList(reorderById(allData, listData.ids), getDiscoverThumbnail);

  if (carouselType === "featuredCarouselItem") {
    return {
      items: items.map((x) => ({
        type: "featuredCarouselItem",
        imageUrl: x.imageUrl,
        mangaId: x.mangaId,
        title: x.title,
        supertitle: undefined,
        metadata: undefined,
        contentRating: x.contentRating,
      })),
      metadata: undefined,
    };
  }

  return {
    items: toCarouselItems(items, "simpleCarouselItem"),
    metadata: undefined,
  };
}

// Popular and Recently Added differ only by order key, carousel type, and the
// optional createdAtSince window, so they share one fetch/parse/page helper.
async function getOrderedMangaCarousel(
  section: DiscoverSection,
  metadata: Metadata | undefined,
  orderKey: string,
  carouselType: "prominentCarouselItem" | "simpleCarouselItem",
  createdAtSince?: string,
): Promise<PagedResults<DiscoverSectionItem>> {
  const offset: number = metadata?.offset ?? 0;

  const ratings: string[] = getRatings();
  const languages: string[] = getLanguages();

  const url = buildMangaListUrl({
    limit: MANGA_PAGE_LIMIT,
    offset,
    ratings,
    languages,
    hasAvailableChapters: true,
    orderKey,
    orderValue: "desc",
  });
  if (createdAtSince) {
    url.setQueryItem("createdAtSince", createdAtSince);
  }

  const json = await fetchJSON<SearchResponse>({ url: url.toString(), method: "GET" });
  assertDataArray(json, section.title);

  const items = parseMangaList(json.data, getDiscoverThumbnail);
  const nextMetadata = computeNextMetadata(offset, json.data.length, json.total, MANGA_PAGE_LIMIT);
  return {
    items: toCarouselItems(items, carouselType),
    metadata: nextMetadata,
  };
}

function getPopularNewTitlesItems(
  section: DiscoverSection,
  metadata: Metadata | undefined,
): Promise<PagedResults<DiscoverSectionItem>> {
  // Match the website's Popular New Titles carousel: only manga
  // created in the last 30 days.
  return getOrderedMangaCarousel(
    section,
    metadata,
    "order[followedCount]",
    "prominentCarouselItem",
    formatCreatedAtSince(Date.now() - POPULAR_NEW_TITLES_WINDOW_MS),
  );
}

async function getLatestUpdatesItems(
  section: DiscoverSection,
  metadata: Metadata | undefined,
): Promise<PagedResults<DiscoverSectionItem>> {
  const offset: number = metadata?.offset ?? 0;

  const ratings: string[] = getRatings();
  const languages: string[] = getLanguages();
  const excludedUploaders = getBlockedUploaders();

  // Chapter first. Query the latest chapters in the user's language
  const chaptersResponse = await fetchJSON<ChapterResponse>({
    url: buildLatestChaptersUrl({
      limit: MANGA_PAGE_LIMIT,
      offset,
      languages,
      ratings,
      excludedUploaders,
    }).toString(),
    method: "GET",
  });
  assertDataArray(chaptersResponse, section.title);

  const nextMetadata = computeNextMetadata(
    offset,
    chaptersResponse.data.length,
    chaptersResponse.total,
    MANGA_PAGE_LIMIT,
  );

  const { ids: orderedMangaIds, chapterByMangaId } = collectUniqueMangaIdsFromChapters(
    chaptersResponse.data,
  );

  if (orderedMangaIds.length === 0) {
    return { items: [], metadata: nextMetadata };
  }

  const mangaResponse = await fetchJSON<SearchResponse>({
    url: buildMangaListUrl({
      limit: orderedMangaIds.length,
      ratings,
      languages,
      ids: orderedMangaIds,
    }).toString(),
    method: "GET",
  });
  assertDataArray(mangaResponse, section.title);

  // Restore chapter order, dropping any manga that came back missing.
  const items = parseMangaList(
    reorderById(mangaResponse.data, orderedMangaIds),
    getDiscoverThumbnail,
  );
  const showVolume = getShowVolume();
  const showChapter = getShowChapter();

  const carouselItems = items.flatMap((x) => {
    const chapter = chapterByMangaId.get(x.mangaId);
    if (!chapter) return [];
    const publishDate = parseDateOrEpoch(chapter.attributes?.readableAt);
    return [
      {
        chapterId: chapter.id,
        imageUrl: x.imageUrl,
        mangaId: x.mangaId,
        title: x.title,
        subtitle: parseChapterTitle(chapter.attributes ?? {}, {
          compact: false,
          showVolume,
          showChapter,
        }),
        publishDate,
        contentRating: x.contentRating,
        type: "chapterUpdatesCarouselItem" as const,
      },
    ];
  });

  return {
    items: carouselItems,
    metadata: nextMetadata,
  };
}

function getRecentlyAddedItems(
  section: DiscoverSection,
  metadata: Metadata | undefined,
): Promise<PagedResults<DiscoverSectionItem>> {
  return getOrderedMangaCarousel(section, metadata, "order[createdAt]", "simpleCarouselItem");
}
