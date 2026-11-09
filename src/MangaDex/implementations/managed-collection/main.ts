/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  ManagedCollection,
  ManagedCollectionChange,
  ManagedCollectionChangeFailure,
  ManagedCollectionItems,
  SourceManga,
} from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { resolveMangaId } from "../shared/legacy";
import { getRatingEnumList } from "../shared/lookups";
import type { MangaDetailsResponse, MangaStatusResponse, SearchResponse } from "../shared/models";
import { parseMangaDetails, readMangaDetailsSettings } from "../shared/parsers";
import { getAccessToken } from "../shared/state";
import {
  buildMangaListUrl,
  buildMangaStatusListUrl,
  buildMangaStatusWriteUrl,
} from "../shared/urls";
import { MANGA_PAGE_LIMIT, chunk } from "../shared/utils";

// MangaDex keeps a single reading status per title.
const STATUS_GROUP = "status";

export async function getManagedCollections(): Promise<ManagedCollection[]> {
  return [
    { id: "reading", title: "Reading", exclusiveGroup: STATUS_GROUP },
    { id: "on_hold", title: "On Hold", exclusiveGroup: STATUS_GROUP },
    { id: "plan_to_read", title: "Planned", exclusiveGroup: STATUS_GROUP },
    { id: "dropped", title: "Dropped", exclusiveGroup: STATUS_GROUP },
    { id: "re_reading", title: "Re-reading", exclusiveGroup: STATUS_GROUP },
    { id: "completed", title: "Completed", exclusiveGroup: STATUS_GROUP },
  ];
}

export async function applyManagedCollectionChanges(
  changes: ManagedCollectionChange[],
): Promise<ManagedCollectionChangeFailure[]> {
  if (!getAccessToken()) {
    throw new Error("You need to be logged in");
  }

  const postStatus = async (mangaId: string, status: string | null) => {
    // Convert legacy numeric ids before posting.
    const resolvedId = await resolveMangaId(mangaId);
    await fetchJSON<{ result?: string }>({
      url: buildMangaStatusWriteUrl(resolvedId).toString(),
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const results = await Promise.allSettled(
    changes.map((change) =>
      postStatus(change.sourceManga.mangaId, change.type === "remove" ? null : change.to.id),
    ),
  );

  const failures: ManagedCollectionChangeFailure[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      const e: unknown = result.reason;
      failures.push({
        changeId: changes[i].id,
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  });

  if (changes.length > 0 && failures.length === changes.length) {
    throw new Error(`MangaDex collection update failed: ${failures[0].reason}`);
  }
  return failures;
}

export async function getManagedCollectionItems(
  collections: ManagedCollection[],
): Promise<ManagedCollectionItems[]> {
  if (!getAccessToken()) {
    throw new Error("You need to be logged in");
  }

  const statusjson = await fetchJSON<MangaStatusResponse>({
    url: buildMangaStatusListUrl().toString(),
    method: "GET",
  });

  if (
    !statusjson.statuses ||
    typeof statusjson.statuses !== "object" ||
    Array.isArray(statusjson.statuses)
  ) {
    throw new Error("MangaDex returned no status data");
  }

  const wanted = new Set(collections.map((c) => c.id));
  const ids = Object.keys(statusjson.statuses).filter((x) => wanted.has(statusjson.statuses[x]));

  const manga = await fetchSourceManga(ids);
  return collections.map((collection) => ({
    collectionId: collection.id,
    items: manga.filter((m) => statusjson.statuses[m.mangaId] === collection.id),
  }));
}

async function fetchSourceManga(ids: string[]): Promise<SourceManga[]> {
  // Fail on any batch error rather than render a silently partial collection,
  // which could make the user think kept titles were removed. The host retries.
  const responses = await Promise.all(
    chunk(ids, MANGA_PAGE_LIMIT).map((batch) =>
      fetchJSON<SearchResponse>({
        // All ratings, no language filter: show every kept title regardless of settings.
        url: buildMangaListUrl({
          limit: MANGA_PAGE_LIMIT,
          ratings: getRatingEnumList(),
          includes: ["author", "artist", "cover_art"],
          ids: batch,
        }).toString(),
        method: "GET",
      }),
    ),
  );

  const detailsSettings = readMangaDetailsSettings();

  return responses.flatMap((json) => {
    if (!Array.isArray(json.data)) return [];
    return json.data.map((item) =>
      parseMangaDetails(
        item.id,
        { result: "ok", response: "entity", data: item } as MangaDetailsResponse,
        undefined,
        detailsSettings,
      ),
    );
  });
}
