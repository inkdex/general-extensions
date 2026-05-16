/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SourceManga } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { resolveMangaId } from "../shared/legacy";
import type {
  AggregateResponse,
  CoverSearchResponse,
  MangaDetailsResponse,
  StatisticsResponse,
} from "../shared/models";
import { Status } from "../shared/models";
import { parseMangaDetails, readMangaDetailsSettings } from "../shared/parsers";
import { getLanguages, getTryFirstVolumeCover } from "../shared/state";
import {
  buildCoverSearchUrl,
  buildMangaAggregateUrl,
  buildMangaByIdUrl,
  buildStatisticsForMangaUrl,
} from "../shared/urls";
import { isNotFoundError } from "../shared/utils";

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

  // Fetch a batch since null volume covers sort first, so we pick later.
  const tryFirstVolumeCover = getTryFirstVolumeCover();
  const coverRequest = tryFirstVolumeCover
    ? {
        url: buildCoverSearchUrl({ mangaId: resolvedId, limit: 10, orderVolume: "asc" }).toString(),
        method: "GET",
      }
    : undefined;

  // /aggregate joins the parallel batch. We do not yet know the status,
  // so request it speculatively
  const aggregateRequest = {
    url: buildMangaAggregateUrl(resolvedId, getLanguages()).toString(),
    method: "GET",
  };

  const [detailsResult, statsResult, coverResult, aggregateResult] = await Promise.allSettled([
    fetchJSON<MangaDetailsResponse>(detailsRequest),
    fetchJSON<StatisticsResponse>(statisticsRequest),
    coverRequest
      ? fetchJSON<CoverSearchResponse>(coverRequest)
      : Promise.resolve(undefined as CoverSearchResponse | undefined),
    fetchJSON<AggregateResponse>(aggregateRequest),
  ]);

  if (detailsResult.status === "rejected") {
    const reason = detailsResult.reason;
    if (isNotFoundError(reason)) {
      const msg = reason instanceof Error ? reason.message : String(reason);
      throw new Error(`${msg}. You may need to add this manga again`);
    }
    throw reason instanceof Error ? reason : new Error(String(reason));
  }

  const json = detailsResult.value;
  if (!json.data) {
    throw new Error(`MangaDex API Error: missing data field for ${resolvedId}`);
  }

  // /aggregate only contributes to the completed -> publishing_finished
  // promotion. Discard for any other status.
  const aggregateJson: AggregateResponse | undefined =
    json.data.attributes?.status === Status.Completed && aggregateResult.status === "fulfilled"
      ? aggregateResult.value
      : undefined;

  const ratingJson: StatisticsResponse | undefined =
    statsResult.status === "fulfilled" ? statsResult.value : undefined;

  const coverJson: CoverSearchResponse | undefined =
    coverResult.status === "fulfilled" ? coverResult.value : undefined;
  // No numeric volume means no "first volume", so fall back to latest.
  const coverFileNameOverride = coverJson?.data?.find(
    (c) =>
      c?.attributes?.volume !== null &&
      c?.attributes?.volume !== undefined &&
      c?.attributes?.volume !== "",
  )?.attributes?.fileName;

  return parseMangaDetails(
    resolvedId,
    json,
    ratingJson,
    readMangaDetailsSettings(),
    aggregateJson,
    coverFileNameOverride,
  );
}
