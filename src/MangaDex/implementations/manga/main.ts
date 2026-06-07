/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SourceManga } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { resolveMangaId } from "../shared/legacy";
import { getRatingEnumList } from "../shared/lookups";
import type {
  AggregateResponse,
  CoverSearchResponse,
  MangaDetailsResponse,
  StatisticsResponse,
} from "../shared/models";
import { Status } from "../shared/models";
import { buildArtworkUrls, parseMangaDetails, readMangaDetailsSettings } from "../shared/parsers";
import {
  getArtworkThumbnail,
  getLanguages,
  getShowCoverArtwork,
  getTryFirstVolumeCover,
} from "../shared/state";
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

  // Fetch a batch. Covers with no volume sort to the top, so pick a real one later.
  // One request serves both the first volume thumbnail and the artwork gallery, the
  // gallery needs the full set while the thumbnail only case needs just a few (10).
  // 100 is the /cover API max per page; raising it past 100 returns a 400.
  const tryFirstVolumeCover = getTryFirstVolumeCover();
  const showCoverArtwork = getShowCoverArtwork();
  const coverRequest =
    tryFirstVolumeCover || showCoverArtwork
      ? {
          url: buildCoverSearchUrl({
            mangaId: resolvedId,
            limit: showCoverArtwork ? 100 : 10,
            orderVolume: "asc",
          }).toString(),
          method: "GET",
        }
      : undefined;

  // /aggregate joins the parallel batch. We don't know the status yet,
  // so request it just in case.
  const aggregateRequest = {
    // All ratings: the publishing_finished check reads lastChapter regardless of
    // rating, so aggregate must see every chapter no matter the user's filter.
    url: buildMangaAggregateUrl(resolvedId, getLanguages(), getRatingEnumList()).toString(),
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

  // /aggregate only matters for turning a completed status into
  // publishing_finished. Discard it for any other status.
  const aggregateJson: AggregateResponse | undefined =
    json.data.attributes?.status === Status.Completed && aggregateResult.status === "fulfilled"
      ? aggregateResult.value
      : undefined;

  const ratingJson: StatisticsResponse | undefined =
    statsResult.status === "fulfilled" ? statsResult.value : undefined;

  const coverJson: CoverSearchResponse | undefined =
    coverResult.status === "fulfilled" ? coverResult.value : undefined;
  // No numeric volume means no "first volume", so fall back to latest. Only applies when the
  // first volume toggle is on, so enabling only the gallery never changes the thumbnail.
  const coverFileNameOverride = tryFirstVolumeCover
    ? coverJson?.data?.find(
        (c) =>
          c?.attributes?.volume !== null &&
          c?.attributes?.volume !== undefined &&
          c?.attributes?.volume !== "",
      )?.attributes?.fileName
    : undefined;

  const artworkUrls = showCoverArtwork
    ? buildArtworkUrls(resolvedId, coverJson, getArtworkThumbnail())
    : undefined;

  return parseMangaDetails(
    resolvedId,
    json,
    ratingJson,
    readMangaDetailsSettings(),
    aggregateJson,
    coverFileNameOverride,
    artworkUrls,
  );
}
