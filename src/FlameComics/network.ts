/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";

import { CDN, DOMAIN, FALLBACK_BUILD_ID, THUMB_WIDTH } from "./models";
import type {
  ChapterReaderResponse,
  HomepageResponse,
  LatestProps,
  SearchProps,
  SeriesDetailResponse,
  SimpleSeriesListItem,
} from "./models";

// ---------------------------------------------------------------------------
// Interceptor — adds headers + CF detection
// ---------------------------------------------------------------------------

export class FlameInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent(),
      },
    };
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    // Cloudflare "managed challenge" — Paperback will spawn a webview for the
    // user to solve, then re-deliver the cookies through `cloudflareBypassCompleted`.
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: DOMAIN,
        method: "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }
    return data;
  }
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

export class FlameApi {
  /** Cached Next.js BUILD_ID (`<head><script id="__NEXT_DATA__">…buildId…`). */
  private buildId: string | undefined;
  /** Timestamp (epoch seconds) of last buildId discovery — refresh after a while. */
  private buildIdFetchedAt = 0;
  /** Refresh window for the buildId. The site only changes it on redeploy. */
  private static readonly BUILD_ID_TTL = 6 * 60 * 60; // 6 hours

  // -------------------------------------------------------------------------
  // BUILD_ID discovery
  // -------------------------------------------------------------------------

  /**
   * Fetch the homepage HTML and extract `buildId` from `__NEXT_DATA__`.
   * Falls back to a hard-coded value (will eventually rot — TODO: prove the
   * discovery is reliable enough to drop the fallback entirely).
   */
  private async fetchBuildId(): Promise<string> {
    try {
      const data = await this.fetchText(`${DOMAIN}/`);
      // The blob looks like:  …"buildId":"FSAQN1WFneGAAio7sG9-F",…
      const match = data.match(/"buildId":"([^"]+)"/);
      if (match && match[1]) return match[1];
    } catch (e) {
      throw new Error(
        `[FlameComics] BUILD_ID discovery failed, using fallback: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
    return FALLBACK_BUILD_ID;
  }

  /** Lazily-cached BUILD_ID. */
  private async getBuildId(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (!this.buildId || now - this.buildIdFetchedAt > FlameApi.BUILD_ID_TTL) {
      this.buildId = await this.fetchBuildId();
      this.buildIdFetchedAt = now;
    }
    return this.buildId;
  }

  /**
   * If a request fails (e.g. 404 because the BUILD_ID rotated), invalidate
   * the cache and retry once.
   */
  private async withBuildIdRetry<T>(fn: (buildId: string) => Promise<T>): Promise<T> {
    const buildId = await this.getBuildId();
    try {
      return await fn(buildId);
    } catch (firstError) {
      // Force a fresh lookup and retry exactly once.
      this.buildId = undefined;
      const fresh = await this.getBuildId();
      if (fresh === buildId) throw firstError; // same id — error is real
      return await fn(fresh);
    }
  }

  // -------------------------------------------------------------------------
  // Low-level fetchers
  // -------------------------------------------------------------------------

  private async fetchText(url: string): Promise<string> {
    const [, buffer] = await Application.scheduleRequest({ url, method: "GET" });
    return Application.arrayBufferToUTF8String(buffer);
  }

  private async fetchJSON<T>(url: string): Promise<T> {
    const text = await this.fetchText(url);
    return JSON.parse(text) as T;
  }

  /** Build a Next.js data URL: `${DOMAIN}/_next/data/${buildId}/${path}`. */
  private dataUrl(buildId: string, ...segments: string[]): URL {
    const url = new URL(DOMAIN)
      .addPathComponent("_next")
      .addPathComponent("data")
      .addPathComponent(buildId);
    segments.forEach((s) => url.addPathComponent(s));
    return url;
  }

  // -------------------------------------------------------------------------
  // High-level endpoints
  // -------------------------------------------------------------------------

  /**
   * Homepage: returns all the curated blocks (popular, latest, staff picks,
   * novels, carousel banner). One round-trip — perfect for the Discover view.
   */
  async getHomepage(): Promise<HomepageResponse> {
    return this.withBuildIdRetry((buildId) => {
      const url = this.dataUrl(buildId, "index.json");
      return this.fetchJSON<HomepageResponse>(url.toString());
    });
  }

  async getSimpleSeriesPage(): Promise<SimpleSeriesListItem[]> {
    const url = new URL(DOMAIN);
    url.addPathComponent("api");
    url.addPathComponent("series");
    return this.fetchJSON(url.toString());
  }

  async getBrowsePage(): Promise<SearchProps> {
    return this.withBuildIdRetry((buildId) => {
      const url = this.dataUrl(buildId, "browse.json");
      return this.fetchJSON<SearchProps>(url.toString());
    });
  }

  async getLatestPage(): Promise<LatestProps> {
    return this.withBuildIdRetry((buildId) => {
      const url = this.dataUrl(buildId, "latest.json");
      return this.fetchJSON<LatestProps>(url.toString());
    });
  }

  /**
   * Series detail + full chapter list, in one shot.
   * Endpoint:  /_next/data/<buildId>/series/<id>.json?id=<id>
   */
  async getSeries(seriesId: string): Promise<SeriesDetailResponse> {
    return this.withBuildIdRetry((buildId) => {
      const url = this.dataUrl(buildId, "series", `${seriesId}.json`).setQueryItem("id", seriesId);
      return this.fetchJSON<SeriesDetailResponse>(url.toString());
    });
  }

  /**
   * Chapter pages (images list):
   *   /_next/data/<buildId>/series/<id>/<token>.json?id=<id>&token=<token>
   */
  async getChapter(seriesId: string, token: string): Promise<ChapterReaderResponse> {
    return this.withBuildIdRetry((buildId) => {
      const url = this.dataUrl(buildId, "series", seriesId, `${token}.json`)
        .setQueryItem("id", seriesId)
        .setQueryItem("token", token);
      return this.fetchJSON<ChapterReaderResponse>(url.toString());
    });
  }

  // -------------------------------------------------------------------------
  // Image URL helpers (no network round-trip)
  // -------------------------------------------------------------------------

  /**
   * Build the cover URL for a series. The website usually proxies this through
   * `/_next/image?url=…&w=…&q=75` for CORS / sizing reasons, but the raw CDN
   * URL works just fine in Paperback (the in-app image loader doesn't care
   * about Next's optimizer).
   *
   *   https://cdn.flamecomics.xyz/uploads/images/series/{series_id}/{cover}?{last_edit}
   */
  buildSeriesCoverUrl(seriesId: number | string, cover: string, lastEdit: number | string): string {
    // `last_edit` doubles as a cache-buster.
    return `${CDN}/uploads/images/series/${seriesId}/${cover}?${lastEdit}`;
  }

  /** Build the carousel banner URL (homepage hero). */
  buildCarouselImageUrl(image: string): string {
    return `${CDN}/uploads/images/carousel/${image}`;
  }

  /**
   * Build a chapter page image URL.
   *   https://cdn.flamecomics.xyz/uploads/images/series/{series_id}/{token}/{name}?{token}
   */
  buildChapterImageUrl(seriesId: number | string, token: string, name: string): string {
    return `${CDN}/uploads/images/series/${seriesId}/${token}/${encodeURIComponent(name)}?${token}`;
  }

  /**
   * (Optional) Build a thumbnail via the Next.js image optimizer — useful if
   * we ever decide we'd rather get JPEG/WEBP transcoding for bandwidth.
   * NOT used by default because Paperback can request the raw PNG/JPEG fine.
   */
  buildOptimizedThumbnailUrl(
    seriesId: number | string,
    cover: string,
    lastEdit: number | string,
    width: number = THUMB_WIDTH,
  ): string {
    const raw = `${CDN}/uploads/images/series/${seriesId}/${cover}?${lastEdit}`;
    const encoded = encodeURIComponent(raw);
    return `${DOMAIN}/_next/image?url=${encoded}&w=${width}&q=75`;
  }
}
