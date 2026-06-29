/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

import { DOMAIN, READER_USER_AGENT, USER_AGENT, type MangagoImageContext } from "./models";
import { descrambleMangagoImage } from "./utils/descramble";
import { readerHostOf, readerPathOf } from "./utils/urls";

// Remember each image's descramble context (desckey + cols) keyed by its clean,
// fragment-less URL, so a retry that drops the "#desckey=...&cols=..." fragment
// can still be descrambled.
const IMAGE_CONTEXT_STATE_PREFIX = "mangago-image-context:";

function cleanUrl(url: string): string {
  const hashIndex = url.indexOf("#");
  return hashIndex >= 0 ? url.slice(0, hashIndex) : url;
}

function saveImageContext(url: string, context: MangagoImageContext): void {
  try {
    Application.setState(
      { desckey: context.desckey, cols: context.cols },
      `${IMAGE_CONTEXT_STATE_PREFIX}${cleanUrl(url)}`,
    );
  } catch {
    // State storage is only a safety net; ignore failures.
  }
}

function readSavedImageContext(url: string): MangagoImageContext | null {
  try {
    const raw = Application.getState(`${IMAGE_CONTEXT_STATE_PREFIX}${cleanUrl(url)}`) as
      | { desckey?: unknown; cols?: unknown }
      | undefined;

    const desckey = typeof raw?.desckey === "string" ? raw.desckey : undefined;
    const cols = typeof raw?.cols === "number" ? raw.cols : undefined;

    if (!desckey || !cols || cols <= 0) return null;

    return { desckey, cols };
  } catch {
    return null;
  }
}

function parseImageContext(url: string): MangagoImageContext | null {
  const hashIndex = url.indexOf("#");
  if (hashIndex < 0) return readSavedImageContext(url);

  const fragment = url.slice(hashIndex + 1);

  // Parse the "desckey=...&cols=..." fragment by hand: URLSearchParams isn't
  // guaranteed on-device, and the fragment is written with encodeURIComponent so
  // a split + decodeURIComponent round-trips exactly.
  const fragmentParams = new Map<string, string>();
  for (const pair of fragment.split("&")) {
    const eq = pair.indexOf("=");
    if (eq < 0) continue;
    const key = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    try {
      fragmentParams.set(key, decodeURIComponent(value));
    } catch {
      fragmentParams.set(key, value);
    }
  }

  const desckey = fragmentParams.get("desckey");
  const colsRaw = fragmentParams.get("cols");

  if (!desckey || !colsRaw) return readSavedImageContext(url);

  const cols = Number(colsRaw);
  if (!Number.isFinite(cols) || cols <= 0) return readSavedImageContext(url);

  const context = { desckey, cols };
  saveImageContext(url, context);
  return context;
}

// Host detection by plain string (readerHostOf), not new URL(url, DOMAIN), which
// the on-device polyfill can fold a mirror host onto the base. A relative URL
// (no host) defaults to www.mangago.me.
function isMangagoHost(url: string): boolean {
  const host = readerHostOf(url) ?? (url.startsWith("/") ? "www.mangago.me" : undefined);
  if (!host) return false;
  // www.mangago.me is the catalog/read-manga host; .mangago.zone and youhim.me
  // are the rotating mirror hosts that serve the numeric /chapter/ reader. All
  // of them need the desktop-reader cookie/headers; image CDN hosts do not.
  return (
    host === "mangago.me" ||
    host.endsWith(".mangago.me") ||
    host === "mangago.zone" ||
    host.endsWith(".mangago.zone") ||
    host === "youhim.me" ||
    host.endsWith(".youhim.me")
  );
}

// A reader page lives at /read-manga/<slug>/<chapter…> or the numeric
// /chapter/<mid>/<cid>/. The bare /read-manga/<slug>/ is the manga-details page,
// not a reader. Reader pages take the desktop UA; everything else takes the mobile
// browsing UA so chapter links come back as read-manga URLs.
function isReaderPageUrl(url: string): boolean {
  const pathname = readerPathOf(url);
  const readManga = /^\/read-manga\/[^/]+\/(.+)/.exec(pathname);
  if (readManga && readManga[1].length > 0) return true;
  return /^\/chapter\/\d+\/\d+/.test(pathname);
}

function readerHeadersForUrl(url: string): {
  referer: string;
  origin: string;
  "user-agent": string;
} {
  // Match referer/origin to the request's own reader host so a same-origin
  // navigation looks right (numeric readers may be on a mirror); non-reader
  // traffic stays on the canonical domain. UA is per request type: reader pages
  // desktop, everything else mobile browsing.
  const reader = isReaderPageUrl(url);
  const host = reader ? readerHostOf(url) : undefined;
  const origin = host ? `https://${host}` : DOMAIN;
  return {
    referer: `${origin}/`,
    origin,
    "user-agent": reader ? READER_USER_AGENT : USER_AGENT,
  };
}

// Apply our headers (page-type UA, referer/origin) and the _m_superu=1 cookie to
// a www.mangago.me request. Shared by interceptRequest and the redirect handler
// so headers survive a redirect (the app only runs interceptRequest on the
// initial request).
//
// We deliberately keep image hosts on HTTPS (no HTTP downgrade): iOS App
// Transport Security blocks plaintext HTTP, so a downgraded image never returns.
//
// _m_superu=1 is merged into request.cookies (additive, not overwritten) so it
// sits alongside any Cloudflare-bypass cookies. Only the mangago.me host gets it;
// image CDN hosts are excluded — they don't need it and must not receive Mangago
// cookies.
export async function applyMangagoHeaders(request: Request): Promise<Request> {
  return {
    ...request,
    headers: {
      // URL-based defaults (referer/origin + per-page-type UA) are the baseline;
      // any header explicitly set on the request wins via the spread below. This
      // is deliberate: a reader fetch forces the desktop UA, and we must never let
      // URL-classification downgrade it. A stale/prefix-less reader path would
      // otherwise miss isReaderPageUrl, get the mobile UA, and make mangago serve
      // the windowed reader (the slow multi-page walk).
      ...readerHeadersForUrl(request.url),
      ...request.headers,
    },
    cookies: isMangagoHost(request.url) ? { ...request.cookies, _m_superu: "1" } : request.cookies,
  };
}

export class MangagoInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return applyMangagoHeaders(request);
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: request.url,
        method: request.method ?? "GET",
        headers: {
          ...readerHeadersForUrl(request.url),
        },
      });
    }

    // Only cspiclink images are scrambled. Other images skip the descramble path
    // (and the per-image Application.getState lookup) so they return immediately.
    if (!request.url.includes("cspiclink")) return data;

    const context = parseImageContext(request.url);

    if (!context) return data;

    try {
      return await descrambleMangagoImage(
        data,
        context.desckey,
        context.cols,
        response.mimeType ?? "image/jpeg",
      );
    } catch {
      // Descramble failed; return the raw bytes rather than blocking the image.
      return data;
    }
  }
}

export async function fetchText(
  url: string,
  headers: { [key: string]: string } = {},
): Promise<string> {
  return (await fetchTextWithUrl(url, headers)).text;
}

// Like fetchText, but also returns the final response URL after redirects.
// mangago.me redirects numeric /chapter/ reader URLs to the /read-manga/ reader;
// a walking caller must key off this final URL or same-chapter next_page links
// won't match and the walk stops early.
export async function fetchTextWithUrl(
  url: string,
  headers: { [key: string]: string } = {},
): Promise<{ text: string; finalUrl: string }> {
  const [response, data] = await Application.scheduleRequest({
    url,
    method: "GET",
    headers: {
      ...readerHeadersForUrl(url),
      ...headers,
    },
  });

  return {
    text: Application.arrayBufferToUTF8String(data),
    finalUrl: response.url || url,
  };
}
