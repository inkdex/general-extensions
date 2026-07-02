/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  DOMAIN,
  type ApiResponse,
  type OptionItem,
  type SearchMetadata,
  type TagMap,
} from "../models";
import { fetchText } from "../network";

// Tag options fetched from the site, cached in state for 2 days.
export const filters: Record<"genres" | "demographic" | "formats", OptionItem[]> = {
  genres: [],
  demographic: [],
  formats: [],
};

const TAG_TYPES = { genres: "genre", demographic: "demographic", formats: "format" } as const;

export const contentTypes: OptionItem[] = [
  { id: "manga", title: "Manga" },
  { id: "manhwa", title: "Manhwa" },
  { id: "manhua", title: "Manhua" },
  { id: "other", title: "Other" },
];

export const publicationStatuses: OptionItem[] = [
  { id: "finished", title: "Finished" },
  { id: "releasing", title: "Releasing" },
  { id: "on_hiatus", title: "On Hiatus" },
  { id: "discontinued", title: "Discontinued" },
  { id: "not_yet_released", title: "Not Yet Released" },
];

export const contentRatings: OptionItem[] = [
  { id: "safe", title: "Safe" },
  { id: "suggestive", title: "Suggestive" },
  { id: "erotica", title: "Erotica" },
  { id: "pornographic", title: "Pornographic" },
];

const state = <T>(key: string, fallback: T): T =>
  (Application.getState(key) as T | undefined) ?? fallback;

export const getContentRating = () => state<string[]>("content_rating", ["suggestive"]);
export const getHiddenGenres = () => state<string[]>("hide_genres", []);
export const getHiddenDemographics = () => state<string[]>("hide_demog", []);
export const getShowOnlyTypes = () => state<string[]>("show_only", []);
export const getYear = () => state("year_settings", new Date().getFullYear() - 1);
export const useYearFilter = () => state("yearTimes", true);
// true = horizontal carousel, false = chapter-updates table
export const horizontalChapterSections = () => state("chapterSection", false);
export const horizontalTrendingSections = () => state("trendingSection", true);
export const horizontalRecentSection = () => state("recentSection", true);

async function fetchTags(type: string): Promise<OptionItem[]> {
  const json = JSON.parse(
    await fetchText(`${DOMAIN}/api/v1/tags/search?limit=50&type=${type}`),
  ) as ApiResponse<{ id: number; label: string }[]>;
  return json.result
    .map((tag) => ({ id: tag.id.toString(), title: tag.label }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function ensureFilters(force = false): Promise<void> {
  if (!force && Object.values(filters).every((options) => options.length > 0)) return;
  const lastFetch = Number(Application.getState("last-filter-fetch") ?? 0);
  const fresh = new Date().valueOf() / 1000 - lastFetch < 172_800;
  let fetched = false;
  for (const [key, type] of Object.entries(TAG_TYPES) as [keyof typeof filters, string][]) {
    if (fresh && !force) {
      const stored = Application.getState(type) as string | undefined;
      const cached = stored ? (JSON.parse(stored) as OptionItem[]) : [];
      // `title` check drops stored options in the pre-refactor `{id, value}` shape
      if (cached.length > 0 && cached[0]?.title !== undefined) {
        filters[key] = cached;
        continue;
      }
    }
    filters[key] = await fetchTags(type);
    Application.setState(JSON.stringify(filters[key]), type);
    fetched = true;
  }
  if (fetched) Application.setState(String(new Date().valueOf() / 1000), "last-filter-fetch");
}

// Search metadata pre-seeded from the user's hide/show settings.
export function defaultSearchMetadata(includeGenre?: string): SearchMetadata {
  const excluded = (options: OptionItem[], hidden: string[]): TagMap =>
    Object.fromEntries(
      options.filter((o) => hidden.includes(o.id)).map((o) => [o.id, "excluded" as const]),
    );
  const genres = excluded(filters.genres, getHiddenGenres());
  if (includeGenre) genres[includeGenre] = "included";
  return {
    genres,
    demographic: excluded(filters.demographic, getHiddenDemographics()),
    types: Object.fromEntries(getShowOnlyTypes().map((id) => [id, "included" as const])),
  };
}

export const pickTags = (
  value: "included" | "excluded",
  ...maps: (TagMap | undefined)[]
): string[] =>
  maps.flatMap((map) =>
    Object.entries(map ?? {})
      .filter(([, v]) => v === value)
      .map(([id]) => id),
  );
