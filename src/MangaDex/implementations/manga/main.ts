/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SourceManga } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { resolveMangaId } from "../shared/legacy";
import type { MangaDetailsResponse, StatisticsResponse } from "../shared/models";
import { parseMangaDetails, readMangaDetailsSettings } from "../shared/parsers";
import { buildMangaByIdUrl, buildStatisticsForMangaUrl } from "../shared/urls";

export async function getMangaDetails(mangaId: string): Promise<SourceManga> {
  // Returned SourceManga uses the resolved id. Paperback then updates its stored reference.
  const resolvedId = await resolveMangaId(mangaId);

  const detailsRequest = {
    url: buildMangaByIdUrl(resolvedId, ["author", "artist", "cover_art"]).toString(),
    method: "GET",
  };

  const statisticsRequest = {
    url: buildStatisticsForMangaUrl(resolvedId).toString(),
    method: "GET",
  };

  // Parallel. Stats are decorative, so a 5xx must not block opening.
  const [detailsResult, statsResult] = await Promise.allSettled([
    fetchJSON<MangaDetailsResponse>(detailsRequest),
    fetchJSON<StatisticsResponse>(statisticsRequest),
  ]);

  if (detailsResult.status === "rejected") {
    const reason = detailsResult.reason;
    const msg = reason instanceof Error ? reason.message : String(reason);
    // 404 arrives in three shapes. Match all for a consistent message.
    if (
      msg.includes("[404]") ||
      msg.includes("HTTP 404") ||
      msg.includes("404 MangaDex Request Failed")
    ) {
      throw new Error(`${msg}. You may need to add this manga again`);
    }
    throw reason instanceof Error ? reason : new Error(msg);
  }

  const json = detailsResult.value;
  if (!json.data) {
    throw new Error(`MangaDex API Error: missing data field for ${resolvedId}`);
  }

  const ratingJson: StatisticsResponse | undefined =
    statsResult.status === "fulfilled" ? statsResult.value : undefined;

  return parseMangaDetails(resolvedId, json, ratingJson, readMangaDetailsSettings());
}
