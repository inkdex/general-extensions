/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ManagedCollection, ManagedCollectionChangeset, SourceManga } from "@paperback/types";

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

export async function getManagedLibraryCollections(): Promise<ManagedCollection[]> {
  return [
    { id: "reading", title: "Reading" },
    { id: "on_hold", title: "On Hold" },
    { id: "plan_to_read", title: "Planned" },
    { id: "dropped", title: "Dropped" },
    { id: "re_reading", title: "Re-reading" },
    { id: "completed", title: "Completed" },
  ];
}

export async function commitManagedCollectionChanges(
  changeset: ManagedCollectionChangeset,
): Promise<void> {
  if (!getAccessToken()) {
    throw new Error("You need to be logged in");
  }

  const postStatus = async (mangaId: string, status: string | null, action: string) => {
    // Convert legacy numeric ids before posting.
    const resolvedId = await resolveMangaId(mangaId);
    try {
      await fetchJSON<{ result?: string }>({
        url: buildMangaStatusWriteUrl(resolvedId).toString(),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      throw new Error(`MangaDex collection ${action} failed for ${resolvedId}: ${detail}`);
    }
  };

  // Use allSettled so one failed write is reported on its own, without
  // hiding the writes that already succeeded on the server.
  const requests = [
    ...(changeset.additions ?? []).map((a) =>
      postStatus(a.mangaId, changeset.collection.id, "add"),
    ),
    ...(changeset.deletions ?? []).map((d) => postStatus(d.mangaId, null, "remove")),
  ];
  const results = await Promise.allSettled(requests);
  const failures = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map((r) => (r.reason instanceof Error ? r.reason.message : String(r.reason)));
  if (failures.length > 0) {
    throw new Error(
      `MangaDex collection update failed for ${failures.length} of ${requests.length}: ${failures.join("; ")}`,
    );
  }
}

export async function getSourceMangaInManagedCollection(
  managedCollection: ManagedCollection,
): Promise<SourceManga[]> {
  if (!getAccessToken()) {
    throw new Error("You need to be logged in");
  }

  const statusJson = await fetchJSON<MangaStatusResponse>({
    url: buildMangaStatusListUrl().toString(),
    method: "GET",
  });

  if (
    !statusJson.statuses ||
    typeof statusJson.statuses !== "object" ||
    Array.isArray(statusJson.statuses)
  ) {
    throw new Error("MangaDex returned no status data");
  }

  const ids = Object.keys(statusJson.statuses).filter(
    (x) => statusJson.statuses[x] === managedCollection.id,
  );

  // Fail on any batch error instead of showing an incomplete collection,
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
