/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { ManagedCollection, ManagedCollectionChangeset, SourceManga } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { resolveMangaId } from "../shared/legacy";
import type { MangaDetailsResponse, MangaStatusResponse, SearchResponse } from "../shared/models";
import { parseMangaDetails, readMangaDetailsSettings } from "../shared/parsers";
import { getAccessToken } from "../shared/state";
import {
  buildMangaListUrl,
  buildMangaStatusListUrl,
  buildMangaStatusWriteUrl,
} from "../shared/urls";
import { chunk } from "../shared/utils";

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
    const [response] = await Application.scheduleRequest({
      url: buildMangaStatusWriteUrl(resolvedId).toString(),
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: { status },
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `MangaDex collection ${action} failed for ${resolvedId} (status ${response.status})`,
      );
    }
  };

  // Idempotent per id. Promise.all aborts the whole changeset on any failure.
  const additionRequests = (changeset.additions ?? []).map((a) =>
    postStatus(a.mangaId, changeset.collection.id, "add"),
  );
  const deletionRequests = (changeset.deletions ?? []).map((d) =>
    postStatus(d.mangaId, null, "remove"),
  );
  await Promise.all([...additionRequests, ...deletionRequests]);
}

export async function getSourceMangaInManagedCollection(
  managedCollection: ManagedCollection,
): Promise<SourceManga[]> {
  if (!getAccessToken()) {
    throw new Error("You need to be logged in");
  }

  const statusjson = await fetchJSON<MangaStatusResponse>({
    url: buildMangaStatusListUrl().toString(),
    method: "get",
  });

  if (
    !statusjson.statuses ||
    typeof statusjson.statuses !== "object" ||
    Array.isArray(statusjson.statuses)
  ) {
    throw new Error("MangaDex returned no status data");
  }

  const ids = Object.keys(statusjson.statuses).filter(
    (x) => statusjson.statuses[x] === managedCollection.id,
  );

  const limit = 100;
  // allSettled so one transient failure does not blank the whole collection page.
  const responses = await Promise.allSettled(
    chunk(ids, limit).map((batch) =>
      fetchJSON<SearchResponse>({
        // All ratings, no language filter: show every kept title regardless of settings.
        url: buildMangaListUrl({
          limit,
          ratings: ["safe", "suggestive", "erotica", "pornographic"],
          includes: ["author", "artist", "cover_art"],
          ids: batch,
        }).toString(),
        method: "get",
      }),
    ),
  );

  const detailsSettings = readMangaDetailsSettings();

  return responses.flatMap((result) => {
    if (result.status === "rejected") return [];
    const json = result.value;
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
