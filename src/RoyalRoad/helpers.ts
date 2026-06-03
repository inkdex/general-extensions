/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { RR_DOMAIN } from "./models";

export function getShareUrl(mangaId: string): string {
  return `${RR_DOMAIN}/fiction/${mangaId}`;
}

// The HTML void elements — tags that never have a closing partner. Readium's
// XHTML parser rejects them when they are left unclosed (e.g. `<br>`), so we
// rewrite every occurrence into its self-closing form (`<br />`).
const VOID_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
].join("|");

// Matches an opening void tag with optional attributes and an optional, already
// present trailing slash, capturing the tag name and its attribute string.
const VOID_ELEMENT_REGEX = new RegExp(`<(${VOID_ELEMENTS})((?:\\s+[^>]*?)?)\\s*/?>`, "gi");

// Normalises every void element in an HTML fragment into a self-closing tag so
// the result is valid XHTML for Readium. Already self-closed tags are left
// effectively unchanged (apart from whitespace normalisation), and existing
// attributes are preserved.
export function fixVoidElements(html: string): string {
  return html.replace(VOID_ELEMENT_REGEX, (_match, tag: string, attributes: string) => {
    const attrs = attributes.trim();
    return attrs ? `<${tag.toLowerCase()} ${attrs} />` : `<${tag.toLowerCase()} />`;
  });
}

// Maps a Royal Road status label to the strings Paperback expects.
export function mapStatus(label: string): string {
  switch (label.trim().toUpperCase()) {
    case "ONGOING":
      return "Ongoing";
    case "COMPLETED":
      return "Completed";
    case "HIATUS":
      return "Hiatus";
    case "DROPPED":
    case "STUB":
      return "Dropped";
    default:
      return "Unknown";
  }
}

// Turns a fiction href ("/fiction/21220/the-slug") into the id we persist
// ("21220/the-slug"), which is appended back to `/fiction/` when fetching.
export function toMangaId(href: string): string {
  const parts = href.split("/fiction/");
  return (parts[1] ?? href).replace(/^\/+/, "").replace(/\/+$/, "");
}

// Chapter hrefs are full paths; we keep them (sans leading slash) as the id.
export function toChapterId(href: string): string {
  return href.replace(/^\/+/, "").replace(/\/+$/, "");
}

export function formatImageUrl(url: string): string {
  if (url.startsWith("https://")) return url;
  return url.length > 0 ? `${RR_DOMAIN}/${url}` : url;
}
