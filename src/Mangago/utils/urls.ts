/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { DOMAIN } from "../models";
import { pathnameKey } from "./cache";

// Parse the trailing reader-page position from a numeric image-index URL
// (".../chapter/<mid>/<cid>/<pos>/"). Page 1 (".../chapter/<mid>/<cid>/") has no
// trailing position and returns undefined.
export function readerPagePosition(url: string): number | undefined {
  const match = /\/chapter\/\d+\/\d+\/(\d+)\/?$/.exec(pathnameKey(url));
  return match ? Number(match[1]) : undefined;
}

export function readMangaPagePosition(url: string): number | undefined {
  const match = /\/pg-(\d+)\/?$/i.exec(pathnameKey(url));
  return match ? Number(match[1]) : undefined;
}

// Pin a reader URL (or bare path) to www.mangago.me, the single host serving the
// read-manga reader, so a relative/absolute link or quirky response URL can't
// drift the walk off-domain. Also repairs accidental host-doubling (a stale
// entry like ".../https://www.mangago.me/read-manga/<slug>/...", which 404s) by
// slicing from the last reader segment.
export function canonicalReaderUrl(url: string): string {
  // Only look for the reader segment in the part BEFORE any query/fragment, so a
  // "/read-manga/" or "/chapter/" that appears inside a query string (e.g.
  // "?from=/chapter/x") can't be mistaken for the real path.
  const queryStart = url.search(/[?#]/);
  let beforeQuery = queryStart === -1 ? url : url.slice(0, queryStart);
  const suffix = queryStart === -1 ? "" : url.slice(queryStart);

  // Backstop for host doubling already in the input that has no "/read-manga/"
  // segment to anchor on: keep only the last absolute-URL occurrence (the doubled
  // form 404s). Normalize a leading protocol-relative host ("//host/...") to https
  // first so a doubled host whose outer prefix dropped the scheme is also caught;
  // only the leading "//" is rewritten, so a bare "//" in a path can't false-trip.
  if (beforeQuery.startsWith("//")) beforeQuery = `https:${beforeQuery}`;
  const schemeMatches = [...beforeQuery.matchAll(/https?:\/\//g)];
  if (schemeMatches.length > 1) {
    beforeQuery = beforeQuery.slice(schemeMatches[schemeMatches.length - 1]!.index);
  }

  // Detect an explicit mirror host (mangago.zone / youhim.me). The numeric reader
  // is served only by these mirrors and 404s on www.mangago.me, so preserve a
  // mirror host for numeric paths; everything else (including a /read-manga/ URL
  // linked from a mirror) is pinned to www.mangago.me. Plain-string detection,
  // not new URL(absolute, base), which the on-device polyfill mis-resolves.
  const inputHost = readerHostOf(beforeQuery);
  const mirrorOrigin =
    inputHost && isReaderMirrorHost(inputHost) ? `https://${inputHost}` : undefined;

  const readerIndex = Math.max(
    beforeQuery.lastIndexOf("/read-manga/"),
    beforeQuery.lastIndexOf("/chapter/"),
  );
  const working = (readerIndex > 0 ? beforeQuery.slice(readerIndex) : beforeQuery) + suffix;
  const pathSearchHash = readerPathSearchOf(working);
  const numeric = /^\/chapter\/\d+\/\d+/.test(readerPathOf(working));
  const origin = numeric && mirrorOrigin ? mirrorOrigin : DOMAIN;
  return `${origin}${pathSearchHash}`;
}

// True when the URL is a real read-manga reader page: /read-manga/<slug>/<more>
// (something after the slug). The bare /read-manga/<slug>/ is the manga-details
// page, not a reader. A numeric reader, a prefix-less "/uu/<chapter>/pg-N/", or a
// doubled host all return false — stale shapes getChapterDetails must re-resolve
// from the fresh chapter list.
export function isReadMangaReaderUrl(url: string): boolean {
  try {
    const match = /^\/read-manga\/[^/]+\/(.+)/.exec(new URL(url, DOMAIN).pathname);
    return !!match && match[1].length > 0;
  } catch {
    return false;
  }
}

// ── Polyfill-safe URL string helpers ───────────────────────────────────────
// The on-device URL polyfill mishandles `new URL(absoluteUrl, base)`: for an
// already-absolute mirror URL it can fold the host back to www.mangago.me,
// re-pinning a numeric mirror reader. So host/path detection of an absolute
// reader URL uses plain string ops; `new URL` is reserved for relative inputs.
export function readerHostOf(url: string): string | undefined {
  const n = url.startsWith("//") ? `https:${url}` : url;
  return /^https?:\/\/([^/?#]+)/i.exec(n)?.[1]?.toLowerCase();
}
export function readerPathSearchOf(url: string): string {
  const n = url.startsWith("//") ? `https:${url}` : url;
  const abs = /^https?:\/\/[^/]+(\/[^\s]*)?$/i.exec(n);
  return abs ? abs[1] || "/" : n.startsWith("/") ? n : `/${n}`;
}
export function readerPathOf(url: string): string {
  const ps = readerPathSearchOf(url);
  const cut = ps.search(/[?#]/);
  return cut >= 0 ? ps.slice(0, cut) : ps;
}

// True for the numeric reader path /chapter/<mid>/<cid>/. Many titles expose
// chapters only as numeric links, served by the mirror hosts (www.mangago.me
// 404s them); getMangagoPageUrls tries every mirror for such a URL.
export function isNumericChapterReaderUrl(url: string): boolean {
  return /^\/chapter\/\d+\/\d+/.test(readerPathOf(url));
}

// Hosts that can serve a numeric /chapter/<mid>/<cid>/ reader. The catalog and
// read-manga reader live on www.mangago.me, but numeric-only titles point at the
// mirrors (which www.mangago.me 404s). We try every host and use whichever
// returns the reader (imgsrcs) page.
const READER_MIRROR_HOSTS = [
  "https://www.mangago.me",
  "https://www.mangago.zone",
  "https://www.youhim.me",
];

export function numericChapterCandidates(url: string): string[] {
  const pathSearch = readerPathSearchOf(url);
  if (!/^\/chapter\/\d+\/\d+/.test(pathSearch)) return [];
  return READER_MIRROR_HOSTS.map((host) => `${host}${pathSearch}`);
}

// The rotating mirror hosts that serve the numeric reader (NOT www.mangago.me).
function isReaderMirrorHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "mangago.zone" ||
    h.endsWith(".mangago.zone") ||
    h === "youhim.me" ||
    h.endsWith(".youhim.me")
  );
}

export function absoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `https://www.mangago.me${url}`;
  return `https://www.mangago.me/${url}`;
}

export function extractMangaId(href: string): string {
  try {
    const url = href.startsWith("http") ? new URL(href) : new URL(href, "https://www.mangago.me");
    return url.pathname;
  } catch {
    return href;
  }
}

export function resolveUrl(url: string, baseUrl: string): string {
  // An already-absolute URL is returned unchanged: `new URL(absolute, base)` is
  // the form the on-device polyfill mis-resolves (folding a mirror host onto the
  // base). Only a relative input needs base resolution (the supported form).
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return absoluteUrl(url);
  }
}
