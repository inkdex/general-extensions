/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Tag } from "@paperback/types";

import { type CategoryGroup, discoverySections, type SearchMetadata, type TagItem } from "./models";
import type { MangaDotApi } from "./network";

export function normalizeId(id: string): string {
  return id.replaceAll("-", "@#@").replaceAll("'", "&#@").replaceAll(" ", "#@&");
}

export function deNormalizeId(id: string): string {
  return id.replaceAll("@#@", "-").replaceAll("&#@", "'").replaceAll("#@&", " ");
}

export function getContentTypes() {
  return (Application.getState("content_type") as string[] | undefined) ?? [""];
}

export function getSectionContentTypes() {
  return (Application.getState("section_content_type") as string[] | undefined) ?? [""];
}

export function getGenresHidden() {
  return (Application.getState("hidden_genres") as string[] | undefined) ?? [];
}

export function getDemographicHidden() {
  return (Application.getState("hidden_demographic") as string[] | undefined) ?? [];
}

export function getThemesHidden() {
  return (Application.getState("hidden_themes") as string[] | undefined) ?? [];
}

export function getMoreHidden() {
  return (Application.getState("hidden_more") as string[] | undefined) ?? [];
}

export function getEnglishOnly() {
  return (Application.getState("english_only_content") as boolean | undefined) ?? false;
}

export function getShowAdultStatus(): string[] {
  return (Application.getState("show_adult_content") as string[] | undefined) ?? ["0"];
}

export function getTimeRangeStatus(): string[] {
  return (Application.getState("content_range") as string[] | undefined) ?? [""];
}

export function getRangeStatus(): boolean {
  return (Application.getState("range_type") as boolean | undefined) ?? false;
}

export function getMultipageStatus(): boolean {
  return (Application.getState("multipage_section") as boolean | undefined) ?? false;
}

export function getDiscoverySectionsOrder() {
  return (
    (Application.getState("sections") as { id: string; title: string }[] | undefined) ??
    discoverySections
  );
}

export function generateTagElement(tag: string): Tag {
  return {
    id: normalizeId(tag),
    title: deNormalizeId(tag),
  };
}

export function defaultMetadata(filterItem: string = ""): SearchMetadata {
  return {
    genres: {
      ...Object.fromEntries(getGenresHidden().map((item) => [item, "excluded" as const])),
      ...(filterItem.length > 0 ? { [filterItem]: "included" as const } : {}),
    },
    demographic: Object.fromEntries(
      getDemographicHidden().map((item) => [item, "excluded" as const]),
    ),
    themes: Object.fromEntries(getThemesHidden().map((item) => [item, "excluded" as const])),
    more: Object.fromEntries(getMoreHidden().map((item) => [item, "excluded" as const])),
    origin: getContentTypes().filter((type) => type !== ""),
    adult: getShowAdultStatus(),
  };
}

export function getFilters(): GenreFilters {
  const filters = Application.getState("search_filter") as string | undefined;
  if (filters === undefined)
    return { demographic: [], genre: [], more: [], themeAndContent: [], language: [] };
  try {
    return JSON.parse(filters) as GenreFilters;
  } catch {
    return { demographic: [], genre: [], more: [], themeAndContent: [], language: [] };
  }
}

export async function checkFilters(api: MangaDotApi): Promise<void> {
  // Force only when no tags were stored at all.
  const filters = getFilters();
  const categories = getCachedCategorizedTags();
  const isEmpty =
    Object.keys(categories).length +
      filters.genre.length +
      filters.themeAndContent.length +
      filters.demographic.length +
      filters.more.length ===
    0;
  await updateFilters(isEmpty, api);
}

export async function updateFilters(force: boolean, api: MangaDotApi): Promise<void> {
  const lastFilterFetch = Number(Application.getState("last_genres_fetch") ?? 0);
  const cached = lastFilterFetch + 172800 > new Date().valueOf() / 1000;
  if (cached && !force) {
    if (
      Application.getState("search_filter") === undefined ||
      Application.getState("search_categories") === undefined
    ) {
      await updateFilters(true, api);
    }
    return;
  }

  // GENRES
  const fetchedGenres = await api.getFilters();
  fetchedGenres.sort((a, b) => a.localeCompare(b));
  const filters = groupGenres(fetchedGenres);
  const lang = await api.getLanguages();
  filters.language = lang.languages.map((l): Tag => ({ id: l.code, title: l.name }));
  filters.language.unshift({ id: "", title: "All" });
  Application.setState(JSON.stringify(filters), "search_filter");
  // TAGS
  const rawData = await api.getTagsList();
  const categorizedTags = groupTagsByCategory(rawData);
  const categoryNames: string[] = [];
  for (const [categoryName, tags] of Object.entries(categorizedTags)) {
    const rowId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const storageKey = `filter_cat_${rowId}`;
    Application.setState(JSON.stringify(tags), storageKey);
    categoryNames.push(categoryName);
  }
  Application.setState(JSON.stringify(categoryNames), "search_categories");
  Application.setState(String(new Date().valueOf() / 1000), "last_genres_fetch");
}

export function getCachedCategorizedTags() {
  const categoriesJson = Application.getState("search_categories") as string | undefined;
  if (categoriesJson === undefined) return {};
  const categoryNames: string[] = JSON.parse(categoriesJson);
  const result: Record<string, TagItem[]> = {};
  for (const categoryName of categoryNames) {
    const rowId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const storageKey = `filter_cat_${rowId}`;
    const tagsJson = Application.getState(storageKey) as string | undefined;
    if (tagsJson) {
      result[categoryName] = JSON.parse(tagsJson);
    }
  }
  TAGS = result;
  return result;
}

type GenreCategory = "Demographic" | "Genre" | "Theme & content" | "More";

const CATEGORY_MAP: Record<string, Exclude<GenreCategory, "More">> = {
  Shounen: "Demographic",
  Seinen: "Demographic",
  Shoujo: "Demographic",
  Josei: "Demographic",
  Kids: "Demographic",

  Action: "Genre",
  Adventure: "Genre",
  Comedy: "Genre",
  Drama: "Genre",
  Fantasy: "Genre",
  Horror: "Genre",
  Mystery: "Genre",
  Romance: "Genre",
  "Sci-Fi": "Genre",
  "Slice of Life": "Genre",
  Sports: "Genre",
  Thriller: "Genre",
  Tragedy: "Genre",
  Psychological: "Genre",
  Supernatural: "Genre",
  Mecha: "Genre",
  Historical: "Genre",

  Isekai: "Theme & content",
  Ecchi: "Theme & content",
  Harem: "Theme & content",
  "Martial Arts": "Theme & content",
  "School Life": "Theme & content",
  Magic: "Theme & content",
  Military: "Theme & content",
  Music: "Theme & content",
  Demons: "Theme & content",
  Vampire: "Theme & content",
  Game: "Theme & content",
  Cooking: "Theme & content",
  Medical: "Theme & content",
  Webtoon: "Theme & content",
};

export interface GenreFilters {
  demographic: Tag[];
  genre: Tag[];
  themeAndContent: Tag[];
  more: Tag[];
  language: Tag[];
}
export function groupGenres(genres: readonly string[]): GenreFilters {
  const grouped: GenreFilters = {
    demographic: [],
    genre: [],
    themeAndContent: [],
    more: [],
    language: [],
  };

  for (const genre of genres) {
    switch (CATEGORY_MAP[genre]) {
      case "Demographic":
        grouped.demographic.push(generateTagElement(genre));
        break;

      case "Genre":
        grouped.genre.push(generateTagElement(genre));
        break;

      case "Theme & content":
        grouped.themeAndContent.push(generateTagElement(genre));
        break;

      default:
        grouped.more.push(generateTagElement(genre));
        break;
    }
  }

  return grouped;
}

export let TAGS: Record<string, TagItem[]> = {};

export function saveTags(apiResponse: CategoryGroup[]) {
  TAGS = groupTagsByCategory(apiResponse);
}

function groupTagsByCategory(apiResponse: any): Record<string, TagItem[]> {
  const categoriesList: string[] = apiResponse.categories || [];
  const terms: any[] = apiResponse.terms || [];
  const grouped: Record<string, TagItem[]> = {};
  grouped["Genres"] = [];
  categoriesList.forEach((catName) => {
    grouped[catName] = [];
  });
  terms.forEach((term) => {
    const tagName = term[1];
    const categoryIndex = term[3];
    const seriesCount = term[4];
    const isAdult = term[5];
    let categoryName = "Other";
    if (categoryIndex === -1) {
      categoryName = "Genres";
    } else if (typeof categoryIndex === "number" && categoriesList[categoryIndex]) {
      categoryName = categoriesList[categoryIndex];
    }
    if (!grouped[categoryName]) {
      grouped[categoryName] = [];
    }
    grouped[categoryName].push({
      name: tagName,
      series_count: seriesCount,
      is_adult: isAdult,
    });
  });
  return grouped;
}
