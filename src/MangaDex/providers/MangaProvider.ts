/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { URL, type SourceManga } from "@paperback/types";

import { parseMangaDetails } from "../MangaDexParser";
import { getCoverArtworkEnabled } from "../MangaDexSettings";
import type { CoverArtResponse, MangaDetailsResponse, StatisticsResponse } from "../models";
import { checkId, fetchJSON, MANGADEX_API } from "../utils/CommonUtil";

/**
 * Handles fetching manga details and information
 */
export class MangaProvider {
  /**
   * Retrieves detailed information for a specific manga
   */
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    checkId(mangaId);

    let request = {
      url: new URL(MANGADEX_API)
        .addPathComponent("manga")
        .addPathComponent(mangaId)
        .setQueryItems({
          "includes[]": ["author", "artist", "cover_art"],
        })
        .toString(),
      method: "GET",
    };

    const json = await fetchJSON<MangaDetailsResponse>(request);

    // Handle MangaDex API error responses with proper typing
    if (json.result === "error" && Array.isArray(json.errors) && json.errors.length === 1) {
      const err = json.errors[0];
      if (err.status === 404) {
        throw new Error(
          `MangaDex API Error: [${err.status}] ${err.detail}. You may need to re-add this manga`,
        );
      }
    }

    request = {
      url: new URL(MANGADEX_API)
        .addPathComponent("statistics")
        .addPathComponent("manga")
        .addPathComponent(mangaId)
        .toString(),
      method: "GET",
    };

    const ratingJson = await fetchJSON<StatisticsResponse>(request);

    let coversJson: CoverArtResponse | undefined;

    if (getCoverArtworkEnabled()) {
      request = {
        url: new URL(MANGADEX_API)
          .addPathComponent("cover")
          .setQueryItem("manga[]", mangaId)
          .setQueryItem("limit", "100")
          .setQueryItem("order[volume]", "desc")
          .setQueryItem("order[createdAt]", "desc")
          .toString(),
        method: "GET",
      };

      coversJson = await fetchJSON<CoverArtResponse>(request);
    }

    return parseMangaDetails(mangaId, json, ratingJson, coversJson);
  }
}
