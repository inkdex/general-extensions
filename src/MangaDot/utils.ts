/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Tag } from "@paperback/types";

import type { SearchMetadata } from "./models";
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

export function getShowAdultStatus(): boolean {
  return (Application.getState("show_adult") as boolean | undefined) ?? false;
}

export function defaultMetadata(): SearchMetadata {
  return {
    genres: Object.fromEntries(getGenresHidden().map((item) => [item, "excluded" as const])),
    origin: getContentTypes().filter((type) => type !== ""),
    adult: getShowAdultStatus(),
  };
}

export function getGenres(): Tag[] {
  const genres = Application.getState("genres_filter") as string | undefined;
  if (genres === undefined) return [];
  try {
    return JSON.parse(genres) as Tag[];
  } catch {
    return [];
  }
}

export async function checkFilters(api: MangaDotApi): Promise<void> {
  await updateFilters(getGenres().length === 0, api);
}

export async function updateFilters(force: boolean, api: MangaDotApi): Promise<void> {
  const lastFilterFetch = Number(Application.getState("last_genres_fetch") ?? 0);
  const cached = lastFilterFetch + 172800 > new Date().valueOf() / 1000;
  if (cached && !force) {
    // The cache is still valid; only refetch if the persisted value went missing.
    if (Application.getState("genres_filter") === undefined) {
      await updateFilters(true, api);
    }
    return;
  }

  const fetchedGenres = await api.getFilters();
  const tags: Tag[] = fetchedGenres.map((elem) => ({
    id: normalizeId(elem),
    title: deNormalizeId(elem),
  }));
  Application.setState(JSON.stringify(tags), "genres_filter");
  Application.setState(String(new Date().valueOf() / 1000), "last_genres_fetch");
}
