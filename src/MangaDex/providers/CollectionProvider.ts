/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  URL,
  type LibraryItemSourceLinkProposal,
  type ManagedCollection,
  type ManagedCollectionChangeset,
  type SourceManga,
} from "@paperback/types";
import { parseMangaDetails } from "../MangaDexParser";
import { getAccessToken } from "../MangaDexSettings";
import { MANGADEX_API } from "../utils/CommonUtil";

/**
 * Manages MangaDex reading lists and library collections
 */
export class CollectionProvider {
  async prepareLibraryItems(): Promise<LibraryItemSourceLinkProposal[]> {
    throw new Error("Method not implemented.");
  }

  /**
   * Returns available reading status collections from MangaDex
   */
  async getManagedLibraryCollections(): Promise<ManagedCollection[]> {
    return [
      { id: "reading", title: "Reading" },
      { id: "on_hold", title: "On Hold" },
      { id: "plan_to_read", title: "Planned" },
      { id: "dropped", title: "Dropped" },
      { id: "re_reading", title: "Re-reading" },
      { id: "completed", title: "Completed" },
    ];
  }

  /**
   * Applies changes to manga reading status collections
   */
  async commitManagedCollectionChanges(changeset: ManagedCollectionChangeset): Promise<void> {
    if (!getAccessToken()) {
      throw new Error("You need to be logged in");
    }

    if (changeset.additions && changeset.additions.length > 0) {
      for (const addition of changeset.additions) {
        await Application.scheduleRequest({
          url: new URL(MANGADEX_API)
            .addPathComponent("manga")
            .addPathComponent(addition.mangaId)
            .addPathComponent("status")
            .toString(),
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: { status: changeset.collection.id },
        });
      }
    }

    if (changeset.deletions && changeset.deletions.length > 0) {
      for (const deletion of changeset.deletions) {
        await Application.scheduleRequest({
          url: new URL(MANGADEX_API)
            .addPathComponent("manga")
            .addPathComponent(deletion.mangaId)
            .addPathComponent("status")
            .toString(),
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: null }),
        });
      }
    }
  }

  /**
   * Gets manga in a specific collection/reading status
   */
  async getSourceMangaInManagedCollection(
    managedCollection: ManagedCollection,
  ): Promise<SourceManga[]> {
    if (!getAccessToken()) {
      throw new Error("You need to be logged in");
    }

    const [_, buffer] = await Application.scheduleRequest({
      url: new URL(MANGADEX_API).addPathComponent("manga").addPathComponent("status").toString(),
      method: "get",
    });

    const statusjson = JSON.parse(
      Application.arrayBufferToUTF8String(buffer),
    ) as MangaDex.MangaStatusResponse;

    if (statusjson.result === "error") {
      throw new Error(JSON.stringify(statusjson.errors)); // Assuming the API has it even if not listed
    }

    const ids = Object.keys(statusjson.statuses).filter(
      (x) => statusjson.statuses[x] === managedCollection.id,
    );

    let hasResults = true;
    let offset = 0;
    const limit = 100;
    const items: SourceManga[] = [];

    while (hasResults) {
      const batch = ids.slice(offset, offset + limit);

      const [_, buffer] = await Application.scheduleRequest({
        url: new URL(MANGADEX_API)
          .addPathComponent("manga")
          .setQueryItems({
            "contentRating[]": ["safe", "suggestive", "erotica", "pornographic"],
            "includes[]": ["author", "artist", "cover_art"],
          })
          .setQueryItem("ids[]", batch)
          .setQueryItem("limit", limit.toString())
          .toString(),
        method: "get",
      });

      const json = JSON.parse(
        Application.arrayBufferToUTF8String(buffer),
      ) as MangaDex.SearchResponse;

      if (json.result === "error") {
        throw new Error(JSON.stringify(json.errors));
      }

      for (const item of json.data) {
        items.push(
          parseMangaDetails(item.id, {
            result: "ok",
            response: "entity",
            data: item,
          } as MangaDex.MangaDetailsResponse),
        );
      }

      hasResults = batch.length >= limit;
      offset += batch.length;
    }

    return items;
  }
}
