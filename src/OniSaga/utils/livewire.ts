/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CheerioAPI } from "cheerio";

import {
  DEFAULT_SORT,
  DOMAIN,
  type BrowseLivewireRequest,
  type ChapterLivewireRequest,
  type LivewireState,
  type PostFilterUpdates,
  type ToggleLivewireRequest,
} from "../models";

// Headers a Livewire `POST /livewire/update` expects (JSON body, XHR marker).
export function livewireHeaders(referer: string): Record<string, string> {
  return {
    "X-Livewire": "",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
    Origin: DOMAIN,
    Referer: referer,
  };
}

// Invoke a single Livewire method (setPeriod / setSort / setPlatform) on a
// rail's component to switch its time range / platform and re-render its cards.
export function buildSectionToggleRequest(
  state: LivewireState,
  method: string,
  value: string,
): ToggleLivewireRequest {
  return {
    _token: state.token,
    components: [
      {
        snapshot: state.snapshot,
        updates: {},
        calls: [{ type: "call", path: "", method, params: [value] }],
      },
    ],
  };
}

export function defaultUpdates(): PostFilterUpdates {
  return {
    platform: "",
    status: "",
    sort: DEFAULT_SORT,
    min_chapters: "",
    group: null,
    release_start: null,
    release_end: null,
    genre: [],
    excludeGenre: [],
  };
}

export function isDefaultUpdates(updates: PostFilterUpdates): boolean {
  return (
    updates.platform === "" &&
    updates.status === "" &&
    updates.sort === DEFAULT_SORT &&
    updates.min_chapters === "" &&
    updates.group === null &&
    updates.release_start === null &&
    updates.release_end === null &&
    updates.genre.length === 0 &&
    updates.excludeGenre.length === 0
  );
}

// The snapshot lives in a `wire:snapshot` attribute; the CSRF token in a
// `<meta name="csrf-token">` (or `_token` input). Match the component by name.
export function extractLivewireState(
  $: CheerioAPI,
  componentName: string,
): LivewireState | undefined {
  const token =
    $("meta[name=csrf-token]").attr("content")?.trim() ||
    $("input[name=_token]").attr("value")?.trim();
  if (!token) return undefined;

  let snapshot: string | undefined;
  $("[wire\\:snapshot]").each((_, el) => {
    if (snapshot) return;
    const value = $(el).attr("wire:snapshot");
    if (value && value.includes(componentName)) {
      snapshot = value;
    }
  });

  if (!snapshot) return undefined;
  return { token, snapshot };
}

export function buildBrowseRequest(
  state: LivewireState,
  updates: PostFilterUpdates,
  page: number,
): BrowseLivewireRequest {
  return {
    _token: state.token,
    components: [
      {
        snapshot: state.snapshot,
        updates,
        calls: [{ type: "call", path: "", method: "gotoPage", params: [page] }],
      },
    ],
  };
}

// Pull the entire chapter (and volume) list in a single Livewire round-trip by
// setting the component's loaded-counts straight to a number larger than any
// series, instead of repeatedly calling loadMoreChapters.
export function buildLoadMoreChaptersRequest(state: LivewireState): ChapterLivewireRequest {
  return {
    _token: state.token,
    components: [
      {
        snapshot: state.snapshot,
        updates: { chaptersLoaded: 3000, volumesLoaded: 3000 },
        calls: [],
      },
    ],
  };
}
