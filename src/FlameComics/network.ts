/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";

import { CDN, DOMAIN, FALLBACK_BUILD_ID } from "./models";

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
    _request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    if (response.headers?.["cf-mitigated"] === "challenge") {
      throw new CloudflareError({
        url: DOMAIN,
        method: "GET",
        headers: { "user-agent": await Application.getDefaultUserAgent() },
      });
    }
    return data;
  }
}

/** The site only rotates buildId on redeploy — refresh at most every 6h. */
const BUILD_ID_TTL = 6 * 60 * 60;

let buildId: string | undefined;
let buildIdFetchedAt = 0;

async function fetchText(url: string): Promise<string> {
  const [, buffer] = await Application.scheduleRequest({ url, method: "GET" });
  return Application.arrayBufferToUTF8String(buffer);
}

async function fetchJSON<T>(url: string): Promise<T> {
  return JSON.parse(await fetchText(url)) as T;
}

/** Extract buildId from the homepage `__NEXT_DATA__`; fall back if the regex misses. */
async function fetchBuildId(): Promise<string> {
  const data = await fetchText(`${DOMAIN}/`);
  const match = data.match(/"buildId":"([^"]+)"/);
  return match?.[1] ?? FALLBACK_BUILD_ID;
}

async function getBuildId(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (!buildId || now - buildIdFetchedAt > BUILD_ID_TTL) {
    buildId = await fetchBuildId();
    buildIdFetchedAt = now;
  }
  return buildId;
}

/** Retry once with a fresh buildId if the first attempt fails (likely a rotation). */
async function withBuildIdRetry<T>(fn: (buildId: string) => Promise<T>): Promise<T> {
  const id = await getBuildId();
  try {
    return await fn(id);
  } catch (firstError) {
    if (firstError instanceof CloudflareError) throw firstError;
    buildId = undefined;
    const fresh = await getBuildId();
    if (fresh === id) throw firstError; // same id — the error is real
    return await fn(fresh);
  }
}

function dataUrl(id: string, segments: string[]): URL {
  const url = new URL(DOMAIN)
    .addPathComponent("_next")
    .addPathComponent("data")
    .addPathComponent(id);
  segments.forEach((s) => url.addPathComponent(s));
  return url;
}

/** Fetch a `/_next/data/<buildId>/<...segments>` JSON payload. */
export async function fetchNextData<T>(
  segments: string[],
  query?: Record<string, string>,
): Promise<T> {
  return withBuildIdRetry((id) => {
    const url = dataUrl(id, segments);
    if (query) for (const [k, v] of Object.entries(query)) url.setQueryItem(k, v);
    return fetchJSON<T>(url.toString());
  });
}

/** `/api/series` — the only endpoint exposing `chapter_count`. */
export async function fetchSimpleSeries<T>(): Promise<T> {
  const url = new URL(DOMAIN).addPathComponent("api").addPathComponent("series");
  return fetchJSON<T>(url.toString());
}

/** `last_edit` doubles as a cache-buster. */
export function buildSeriesCoverUrl(
  seriesId: number | string,
  cover: string,
  lastEdit: number | string,
): string {
  return `${CDN}/uploads/images/series/${seriesId}/${cover}?${lastEdit}`;
}

export function buildChapterImageUrl(
  seriesId: number | string,
  token: string,
  name: string,
): string {
  return `${CDN}/uploads/images/series/${seriesId}/${token}/${encodeURIComponent(name)}?${token}`;
}
