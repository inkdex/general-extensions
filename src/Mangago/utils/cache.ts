/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// Caches for the deobfuscated chapter.js and final page URLs, so retries and
// re-opens don't refetch and trip the rate limiter.
export const mangagoPageUrlsCache = new Map<string, string[]>();
export const chapterJsCache = new Map<string, string>();

// Persistent cache for the deobfuscated chapter.js, keyed by its versioned URL,
// so the first chapter each launch skips re-downloading and re-decoding it. The
// version in the key makes a bump auto-miss and refetch.
export const CHAPTER_JS_STATE_PREFIX = "mangago-chapterjs:";

// Short-TTL dedup for reader-page HTML, keyed mirror-independently by path. On a
// re-walk this reuses pages that already loaded and only refetches the ones that
// failed. Only successful (imgsrcs-bearing) responses are cached.
export const READER_HTML_TTL_MS = 5 * 60 * 1000;
const readerHtmlCache = new Map<string, { html: string; expires: number }>();

export const READER_FETCH_MIN_INTERVAL_MS = 350;
let lastReaderFetchAt = 0;

export async function paceReaderFetch(): Promise<void> {
  const now = Date.now();
  const waitMs = READER_FETCH_MIN_INTERVAL_MS - (now - lastReaderFetchAt);
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastReaderFetchAt = Date.now();
}

export function pathnameKey(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function getCachedReaderHtml(url: string): string | undefined {
  const key = pathnameKey(url);
  const entry = readerHtmlCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    readerHtmlCache.delete(key);
    return undefined;
  }
  return entry.html;
}

export function cacheReaderHtml(url: string, html: string): void {
  readerHtmlCache.set(pathnameKey(url), { html, expires: Date.now() + READER_HTML_TTL_MS });
}
