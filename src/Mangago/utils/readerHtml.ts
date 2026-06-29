/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { DOMAIN } from "../models";
import { extractImgsrcs } from "./crypto";
import { canonicalReaderUrl, readerHostOf, readerPathOf, resolveUrl } from "./urls";

export function extractTotalPages(html: string): number {
  const candidates = [
    /total_pages\s*=\s*["']?(\d+)/.exec(html)?.[1],
    /class=["'][^"']*multi_pg_tip[^"']*["'][^>]*>\s*\(\s*\d+\s*\/\s*(\d+)\s*\)/i.exec(html)?.[1],
    /page\s+\d+\s+of\s+(\d+)/i.exec(html)?.[1],
  ];

  for (const candidate of candidates) {
    const value = candidate ? Number(candidate) : 0;
    if (Number.isFinite(value) && value > 0) return value;
  }

  return 0;
}

export function extractCurrentReaderPage(html: string): number | undefined {
  const candidates = [
    /current_page\s*=\s*["']?(\d+)/.exec(html)?.[1],
    /class=["'][^"']*multi_pg_tip[^"']*["'][^>]*>\s*\(\s*(\d+)\s*\/\s*\d+\s*\)/i.exec(html)?.[1],
  ];

  for (const candidate of candidates) {
    const value = candidate ? Number(candidate) : 0;
    if (Number.isFinite(value) && value > 0) return value;
  }

  return undefined;
}

// The reader-page URL template, e.g. "/chapter/35134/2096487/{page}/".
export function extractCurlTemplate(html: string): string | undefined {
  const match = /<input[^>]*id=["']curl["'][^>]*value=["']([^"']+)["']/i.exec(html);
  return match?.[1]?.trim();
}

// Some read-manga reader pages ship an unusable curl value of "/" and put the
// current page URL in the pcurl variable instead. Turn that concrete pg-N URL
// into the same {page} template the walker expects.
export function extractPcurlTemplate(html: string): string | undefined {
  const match = /\bpcurl\s*=\s*["']([^"']*\/pg-)\d+(\/[^"']*)?["']/.exec(html);
  if (!match?.[1]) return undefined;

  return templatePathname(`${match[1]}{page}${match[2] ?? ""}`);
}

export function usableCurlTemplate(template: string | undefined): string | undefined {
  if (!template || !template.includes("{page}")) return undefined;

  // Mangago sometimes emits this as an absolute URL. Keep only the pathname so
  // later path merging cannot turn it into /https://www.mangago.me/...
  return templatePathname(template);
}

// The site's own multimode flag: `_multimode = "1"` for paginated readers
// (page 1 holds only a slice of the chapter), `""` for single-page readers
// (page 1 holds every image).
export function extractMultimode(html: string): string {
  const match = /_multimode\s*=\s*["']([^"']*)["']/.exec(html);
  return match?.[1] ?? "";
}

// The reader's "next page" anchor href — the link the site uses to advance the
// reader, so following it is correct regardless of what the page parameter means.
// On the last page it points at the next chapter, our natural stop signal.
export function extractNextPageHref(html: string): string | undefined {
  const anchors = [
    /<a\b(?=[^>]*class=["'][^"']*next_page[^"']*["'])[^>]*>/i.exec(html)?.[0],
    /<a\b(?=[^>]*id=["']pic_container["'])[^>]*>/i.exec(html)?.[0],
    /<a\b(?=[^>]*alt=["']next page["'])[^>]*>/i.exec(html)?.[0],
  ];

  for (const anchor of anchors) {
    const href = anchor ? /\bhref=["']([^"']+)["']/i.exec(anchor)?.[1]?.trim() : undefined;
    if (href) return href;
  }

  // The windowed numeric reader advances via a `next_url` JS variable rather than
  // an anchor. Resolved against the current page it's the exact next sub-page; on
  // the last page it points at the next chapter (detected via readerChapterKey).
  const nextUrlVar = /\bnext_url\s*=\s*["']([^"']+)["']/.exec(html)?.[1]?.trim();
  if (nextUrlVar && nextUrlVar !== "#" && !/^javascript:/i.test(nextUrlVar)) return nextUrlVar;

  return undefined;
}

// Identify a chapter (independent of which page within it) from a reader URL or
// path, so a "next page" link can be told apart from a "next chapter" link:
//   /chapter/<mid>/<cid>/<page>/        -> c:<cid>
//   /read-manga/<slug>/.../chapter-<id>/pg-<n>/ -> rm:<id>
export function readerChapterKey(u: string): string {
  let path = u;
  try {
    path = new URL(u).pathname;
  } catch {
    // keep the raw string
  }

  const numeric = /\/chapter\/\d+\/(\d+)(?:\/|$)/.exec(path);
  if (numeric) return `c:${numeric[1]}`;

  const readManga = /chapter-(\d+)/i.exec(path);
  if (readManga) return `rm:${readManga[1]}`;

  return path;
}

// Detect Mangago's "not found" body so the walker treats the page as definitively
// absent and stops retrying it (a 404 is not transient).
export function isMangago404Page(html: string): boolean {
  return (
    /<title>\s*404\s*-\s*mangago\s*<\/title>/i.test(html) ||
    /the page you have requested is not available/i.test(html)
  );
}

export function extractChapterJsUrl(html: string): string | undefined {
  const match =
    html.match(/<script\b[^>]+src=["']([^"']*chapter\.js[^"']*)["'][^>]*>/i) ??
    html.match(/src=["']([^"']*chapter\.js[^"']*)["']/i);
  return match?.[1];
}

export function extractImgsrcsFromHtml(html: string): string | undefined {
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1] ?? "",
  );
  const imgsrcsScript = scripts.find((s) => s.includes("imgsrcs"));
  return imgsrcsScript ? extractImgsrcs(imgsrcsScript) : undefined;
}

// Match a single curl-template path segment (which may contain "{page}")
// against a concrete URL segment.
function templateSegmentMatches(templateSegment: string, urlSegment: string): boolean {
  const escaped = templateSegment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = `^${escaped.replace(/\\\{[^}]+\\\}/g, "[^/]+")}$`;
  return new RegExp(pattern).test(urlSegment);
}

function templatePathname(template: string): string {
  const placeholder = "__MANGAGO_PAGE_PLACEHOLDER__";
  const protectedTemplate = template.replace(/\{page\}/g, placeholder);

  try {
    return new URL(protectedTemplate, DOMAIN).pathname.replaceAll(placeholder, "{page}");
  } catch {
    return template;
  }
}

// Merge the curl template into a concrete URL path. Numeric readers serve a
// full-path template ("/chapter/ID/CID/{page}/") so this is an identity; some
// read-manga regions serve a template relative to the chapter slug
// ("/uu/nml_chapter-41/pg-{page}/"), so we splice it onto the real path prefix
// from the next_page href instead of resolving it against the domain root
// (which would 404).
function mergeUrlPathWithTemplate(urlPath: string, template: string): string {
  const templatePath = templatePathname(template);
  const urlSegments = urlPath
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
  const templateSegments = templatePath
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);

  let bestStart = -1;
  let bestLength = 0;

  for (let start = 0; start < urlSegments.length; start++) {
    let length = 0;
    while (
      length < templateSegments.length &&
      start + length < urlSegments.length &&
      templateSegmentMatches(templateSegments[length]!, urlSegments[start + length]!)
    ) {
      length++;
    }
    if (length > bestLength) {
      bestStart = start;
      bestLength = length;
    }
  }

  const tail = templatePath.endsWith("/") ? "/" : "";
  if (bestStart >= 0 && bestLength > 0) {
    const prefix = urlSegments.slice(0, bestStart);
    return `/${[...prefix, ...templateSegments].join("/")}${tail}`;
  }
  return `/${[...urlSegments, ...templateSegments].join("/")}${tail}`;
}

// True when the curl template's {page} parameter is a 1-based IMAGE index
// (numeric reader, "/chapter/<mid>/<cid>/{page}/"). read-manga "pg-{page}"
// templates index reader pages instead, so the image-count stride guess does
// not apply there.
export function isImageIndexTemplate(template: string): boolean {
  return /\/chapter\/\d+\/\d+\/\{page\}\/?$/.test(templatePathname(template));
}

// Build the URL for reader page N. Prefer the site's next_page href as the
// concrete example path and merge the template into it; fall back to resolving
// the template against the loaded URL. Only used as a fallback when a sub-page
// omits its own next_page link.
export function buildReaderPageUrl(
  template: string,
  baseUrl: string,
  page: number,
  nextPageHref?: string,
): string {
  const concreteBase = nextPageHref ? resolveUrl(nextPageHref, baseUrl) : baseUrl;
  // String-based throughout (new URL(absolute, base) is mis-resolved by the
  // on-device polyfill). Merge the template onto the base path to keep the
  // /read-manga/<slug>/ or numeric /chapter/ prefix, and keep the base's host
  // (the mirror for numeric readers, which 404 on www.mangago.me).
  const host = readerHostOf(concreteBase);
  const origin = host ? `https://${host}` : DOMAIN;
  const basePath = readerPathOf(concreteBase);
  const merged = mergeUrlPathWithTemplate(basePath, template).replace("{page}", String(page));
  return canonicalReaderUrl(`${origin}${merged.startsWith("/") ? merged : `/${merged}`}`);
}
