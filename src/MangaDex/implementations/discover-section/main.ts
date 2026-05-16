/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  DiscoverSectionType,
  type DiscoverSection,
  type DiscoverSectionItem,
  type PagedResults,
} from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { ensureCuratedListIds } from "../shared/curated-lists";
import type {
  ChapterData,
  ChapterResponse,
  CustomListResponse,
  Metadata,
  Relationship,
  SearchResponse,
} from "../shared/models";
import { assertDataArray, parseChapterTitle, parseMangaList } from "../shared/parsers";
import {
  DISCOVER_SECTIONS,
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
import { buildCustomListUrl, buildLatestChaptersUrl, buildMangaListUrl } from "../shared/urls";
import { chunk, computeNextMetadata, formatCreatedAtSince } from "../shared/utils";

// Match the MangaDex website's "Popular New Titles" filter window.
const POPULAR_NEW_TITLES_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function getDiscoverSections(): Promise<DiscoverSection[]> {
  const sectionOrder = getDiscoverSectionOrder();

  const availableSections: Array<{
    id: string;
    title: string;
    type: DiscoverSectionType;
    enabled: boolean;
  }> = [
    {
      id: DISCOVER_SECTIONS.POPULAR,
      title: "Popular New Titles",
      type: DiscoverSectionType.prominentCarousel,
      enabled: getPopularEnabled(),
    },
    {
      id: DISCOVER_SECTIONS.LATEST_UPDATES,
      title: "Latest Updates",
      type: DiscoverSectionType.chapterUpdates,
      enabled: getLatestUpdatesEnabled(),
    },
    {
      id: DISCOVER_SECTIONS.RECOMMENDED,
      title: "Recommended",
      type: DiscoverSectionType.simpleCarousel,
      enabled: getRecommendedEnabled(),
    },
    {
      id: DISCOVER_SECTIONS.SELF_PUBLISHED,
      title: "Self-Published",
      type: DiscoverSectionType.simpleCarousel,
      enabled: getSelfPublishedEnabled(),
    },
    {
      id: DISCOVER_SECTIONS.SEASONAL,
      title: "Seasonal",
      type: DiscoverSectionType.featured,
      enabled: getSeasonalEnabled(),
    },
    {
      id: DISCOVER_SECTIONS.RECENTLY_ADDED,
      title: "Recently Added",
      type: DiscoverSectionType.simpleCarousel,
      enabled: getRecentlyAddedEnabled(),
    },
  ];

  const sectionMap = new Map(availableSections.map((s) => [s.id, s]));
  const sections: DiscoverSection[] = [];
  for (const sectionId of sectionOrder) {
    const section = sectionMap.get(sectionId);
    if (section && section.enabled) {
      sections.push({ id: section.id, title: section.title, type: section.type });
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
  const json = await fetchJSON<CustomListResponse>({
    url: buildCustomListUrl(listId),
    method: "GET",
  });

  if (!json.data || !Array.isArray(json.data.relationships)) {
    throw new Error(`MangaDex returned no list data for ${listId}`);
  }

  // The /manga response is sorted by latest chapter, so the
  // caller restores the curator's order from this array.
  const ids = json.data.relationships
    .filter((x: Relationship) => x?.type === "manga")
    .map((x: Relationship) => x.id);

  // An empty ids[] would drop the filter and return 100 unrelated manga.
  if (ids.length === 0) return null;

  // /manga?ids[] caps at 100, so chunk to avoid truncating curators with over 100 entries.
  const urls = chunk(ids, 100).map((batch) =>
    buildMangaListUrl({
      limit: batch.length,
      ratings,
      languages,
      includes: ["cover_art"],
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
  const dataById = new Map(allData.map((d) => [d.id, d]));
  const sortedData = listData.ids.flatMap((id) => {
    const d = dataById.get(id);
    return d ? [d] : [];
  });

  const items = parseMangaList(sortedData, getDiscoverThumbnail);

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
    items: items.map((x) => ({
      type: "simpleCarouselItem",
      mangaId: x.mangaId,
      imageUrl: x.imageUrl,
      title: x.title,
      subtitle: x.subtitle,
      contentRating: x.contentRating,
    })),
    metadata: undefined,
  };
}

async function getPopularNewTitlesItems(
  section: DiscoverSection,
  metadata: Metadata | undefined,
): Promise<PagedResults<DiscoverSectionItem>> {
  const offset: number = metadata?.offset ?? 0;

  const ratings: string[] = getRatings();
  const languages: string[] = getLanguages();

  const url = buildMangaListUrl({
    limit: 100,
    offset,
    ratings,
    languages,
    includes: ["cover_art"],
    hasAvailableChapters: true,
    orderKey: "order[followedCount]",
    orderValue: "desc",
  });
  // Match the website's Popular New Titles carousel: only manga
  // created in the last 30 days.
  url.setQueryItem(
    "createdAtSince",
    formatCreatedAtSince(Date.now() - POPULAR_NEW_TITLES_WINDOW_MS),
  );

  const json = await fetchJSON<SearchResponse>({ url: url.toString(), method: "GET" });
  assertDataArray(json, section.title);

  const items = parseMangaList(json.data, getDiscoverThumbnail);
  const nextMetadata = computeNextMetadata(offset, json.data.length, json.total, 100);
  return {
    items: items.map((x) => ({
      type: "prominentCarouselItem",
      mangaId: x.mangaId,
      imageUrl: x.imageUrl,
      title: x.title,
      subtitle: x.subtitle,
      contentRating: x.contentRating,
    })),
    metadata: nextMetadata,
  };
}

async function getLatestUpdatesItems(
  section: DiscoverSection,
  metadata: Metadata | undefined,
): Promise<PagedResults<DiscoverSectionItem>> {
  const offset: number = metadata?.offset ?? 0;

  const ratings: string[] = getRatings();
  const languages: string[] = getLanguages();

  // Chapter first. Query the latest chapters in the user's language
  const chaptersResponse = await fetchJSON<ChapterResponse>({
    url: buildLatestChaptersUrl({ limit: 100, offset, languages, ratings }).toString(),
    method: "GET",
  });
  assertDataArray(chaptersResponse, section.title);

  const nextMetadata = computeNextMetadata(
    offset,
    chaptersResponse.data.length,
    chaptersResponse.total,
    100,
  );

  // Dedupe by manga, preserving chapter recency order.
  const chapterByMangaId = new Map<string, ChapterData>();
  const orderedMangaIds: string[] = [];
  for (const chapter of chaptersResponse.data) {
    const mangaRel = Array.isArray(chapter.relationships)
      ? chapter.relationships.find((r) => r?.type === "manga")
      : undefined;
    if (!mangaRel?.id || chapterByMangaId.has(mangaRel.id)) continue;
    chapterByMangaId.set(mangaRel.id, chapter);
    orderedMangaIds.push(mangaRel.id);
  }

  if (orderedMangaIds.length === 0) {
    return { items: [], metadata: nextMetadata };
  }

  const mangaResponse = await fetchJSON<SearchResponse>({
    url: buildMangaListUrl({
      limit: orderedMangaIds.length,
      ratings,
      languages,
      includes: ["cover_art"],
      ids: orderedMangaIds,
    }).toString(),
    method: "GET",
  });
  assertDataArray(mangaResponse, section.title);

  // Restore chapter order, dropping any manga that came back missing.
  const mangaById = new Map(mangaResponse.data.map((m) => [m.id, m]));
  const orderedManga = orderedMangaIds.flatMap((id) => {
    const m = mangaById.get(id);
    return m ? [m] : [];
  });

  const items = parseMangaList(orderedManga, getDiscoverThumbnail);
  const showVolume = getShowVolume();
  const showChapter = getShowChapter();

  const carouselItems = items.flatMap((x) => {
    const chapter = chapterByMangaId.get(x.mangaId);
    if (!chapter) return [];
    const parsed = new Date(chapter.attributes?.readableAt ?? 0);
    const publishDate = isNaN(parsed.getTime()) ? new Date(0) : parsed;
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

async function getRecentlyAddedItems(
  section: DiscoverSection,
  metadata: Metadata | undefined,
): Promise<PagedResults<DiscoverSectionItem>> {
  const offset: number = metadata?.offset ?? 0;

  const ratings: string[] = getRatings();
  const languages: string[] = getLanguages();

  const request = {
    url: buildMangaListUrl({
      limit: 100,
      offset,
      ratings,
      languages,
      includes: ["cover_art"],
      hasAvailableChapters: true,
      orderKey: "order[createdAt]",
      orderValue: "desc",
    }).toString(),
    method: "GET",
  };
  const json = await fetchJSON<SearchResponse>(request);
  assertDataArray(json, section.title);

  const items = parseMangaList(json.data, getDiscoverThumbnail);
  const nextMetadata = computeNextMetadata(offset, json.data.length, json.total, 100);
  return {
    items: items.map((x) => ({
      type: "simpleCarouselItem",
      mangaId: x.mangaId,
      imageUrl: x.imageUrl,
      title: x.title,
      subtitle: x.subtitle,
      contentRating: x.contentRating,
    })),
    metadata: nextMetadata,
  };
}
