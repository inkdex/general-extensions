/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, type Chapter, type SourceManga, type TagSection } from "@paperback/types";
import { type Cheerio, type CheerioAPI } from "cheerio";
import { type Element } from "domhandler";

import { DOMAIN, GENRES, LANGUAGES, type Option } from "./models";
import { chapterIdFromHref, mangaIdFromHref } from "./utils/helpers";

const READER_TOKEN_REGEX = /readerToken["']?\s*:\s*["']([^"']+)["']/;
const TOTAL_PAGES_REGEX = /totalPages["']?\s*:\s*(\d+)/;
const PAGE_ORDER_REGEX = /["']?order["']?\s*:\s*(\d+)/g;
const CHAPTER_NUMBER_REGEX = /(\d+(?:\.\d+)?)/;

const TYPE_BADGES = new Set(["manga", "manhwa", "manhua", "shounen", "seinen", "shoujo", "josei"]);

const GENRE_ID_BY_TITLE = new Map(GENRES.map((g) => [g.title.toLowerCase(), g.id]));
const LANG_CODE_BY_BADGE = new Map(LANGUAGES.map((l) => [l.badge.toUpperCase(), l.langCode]));

function resolveUrl(src: string): string {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return `${DOMAIN}${src}`;
  return `${DOMAIN}/${src}`;
}

// Largest URL from a srcset ("a 150w, b 300w, c 450w" -> c).
function lastSrcsetUrl(srcset: string): string {
  const urls = srcset
    .split(",")
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean);
  return urls[urls.length - 1] ?? "";
}

function resolveImageUrl($el: Cheerio<Element>): string {
  const direct = $el.attr("data-src") || $el.attr("data-lazy-src") || $el.attr("src") || "";
  if (direct && !direct.startsWith("data:")) return resolveUrl(direct);

  // Lazy cards keep the real image in a srcset (on the <img> or a <picture>
  // <source>); prefer the webp source.
  const srcset =
    $el.attr("srcset") ||
    $el.attr("data-srcset") ||
    $el.parent().find('source[type="image/webp"]').first().attr("srcset") ||
    $el.parent().find("source[srcset]").first().attr("srcset") ||
    "";
  const fromSet = lastSrcsetUrl(srcset);
  return fromSet ? resolveUrl(fromSet) : "";
}

export interface MangaCard {
  mangaId: string;
  title: string;
  imageUrl: string;
  contentRating: ContentRating;
  genres?: string;
  views?: string;
}

// Card view count ("20,558 views"); ratings only live on the top-manga page.
function extractCardViews(text: string): string | undefined {
  const match = text.match(/(\d[\d.,]*\s*[KMB]?)\s*(?:views|reads)\b/i);
  return match ? match[1].trim() : undefined;
}

export function buildStatSubtitle(card: MangaCard): string | undefined {
  if (card.views) return `${card.views} views`;
  return card.genres || undefined;
}

export function parseMangaCards($: CheerioAPI, showNsfw: boolean): MangaCard[] {
  const cards: MangaCard[] = [];

  $("div.relative.group").each((_, element) => {
    const card = $(element);

    const isAdult = card.find("span:contains('18+')").length > 0;
    if (isAdult && !showNsfw) return;

    const link = card.find("a[href*='/manga/']").first();
    const href = link.attr("href") ?? "";
    const mangaId = mangaIdFromHref(href);
    if (!mangaId) return;

    const titleEl = card.find("a[title]").first();
    const title = (titleEl.attr("title") || card.find("h3").first().text() || link.text()).trim();
    if (!title) return;

    const imageUrl = resolveImageUrl(card.find("img").first());
    // Paperback throws "Invalid URL" on an empty imageUrl, so skip imageless
    // cards rather than emit a broken discover item.
    if (!imageUrl) return;

    const genres =
      card.find('[class*="text-accent/50"]').first().text().replace(/\s+/g, " ").trim() ||
      undefined;
    const views = extractCardViews(card.text());

    cards.push({
      mangaId,
      title,
      imageUrl,
      contentRating: isAdult ? ContentRating.ADULT : ContentRating.EVERYONE,
      genres,
      views,
    });
  });

  return cards;
}

// ============================= Top-manga ranking =============================
// /top-manga rows carry both the read count and ★ rating that /browse lacks.
export interface TopMangaItem {
  mangaId: string;
  title: string;
  imageUrl: string;
  contentRating: ContentRating;
  genres?: string;
  reads?: string;
  rating?: string;
}

const ADULT_GENRE_REGEX = /\b(adult|mature|smut|ecchi|hentai)\b/i;

function cleanGenreLine(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*[·/]\s*/g, " · ")
    .trim();
}

function ratingValue(text: string): string | undefined {
  return text.match(/\d+(?:\.\d+)?/)?.[0];
}

export function parseTopManga($: CheerioAPI, showNsfw: boolean): TopMangaItem[] {
  const items: TopMangaItem[] = [];
  const seen = new Set<string>();

  const add = (item: TopMangaItem | undefined): void => {
    if (!item || !item.mangaId || !item.title || !item.imageUrl || seen.has(item.mangaId)) return;
    if (item.contentRating === ContentRating.ADULT && !showNsfw) return;
    seen.add(item.mangaId);
    items.push(item);
  };

  // Podium (ranks 1-3): poster anchors; title from the image alt, reads from a
  // "N reads" line. No rating/genre.
  $("section a[href*='/manga/']").each((_, el) => {
    const a = $(el);
    const img = a.find("img").first();
    if (img.length === 0) return;
    const readsMatch = a.text().match(/([\d,]+)\s*reads/i);
    if (!readsMatch) return;

    add({
      mangaId: mangaIdFromHref(a.attr("href") ?? ""),
      title: (img.attr("alt") ?? "").replace(/\s*cover\s*$/i, "").trim(),
      imageUrl: resolveImageUrl(img),
      contentRating: ContentRating.EVERYONE,
      reads: readsMatch[1],
    });
  });

  // Ranked list (rank 4+): each <li> anchor has title, genres, and a stat block
  // (reads then ★ rating).
  $("ol li a[href*='/manga/']").each((_, el) => {
    const a = $(el);
    const genres = cleanGenreLine(a.find('[class*="text-accent/45"]').first().text()) || undefined;
    const stats = a
      .find('[class*="text-right"]')
      .first()
      .children("span")
      .map((_, s) => $(s).text().trim())
      .get();

    add({
      mangaId: mangaIdFromHref(a.attr("href") ?? ""),
      title: a.find('[class*="line-clamp-1"]').first().text().trim(),
      imageUrl: resolveImageUrl(a.find("img").first()),
      contentRating:
        genres && ADULT_GENRE_REGEX.test(genres) ? ContentRating.ADULT : ContentRating.EVERYONE,
      genres,
      reads: stats[0] || undefined,
      rating: stats.length > 1 ? ratingValue(stats[stats.length - 1]) : undefined,
    });
  });

  return items;
}

// Carousel subtitle: "★ 8.9 · 18,972 reads", or whichever stat/genre is present.
export function topMangaSubtitle(item: TopMangaItem): string | undefined {
  const parts: string[] = [];
  if (item.rating) parts.push(`★ ${item.rating}`);
  if (item.reads) parts.push(`${item.reads} reads`);
  if (parts.length > 0) return parts.join(" · ");
  return item.genres || undefined;
}

// =============================== Home sections ===============================
// Outer HTML of the Livewire component whose wire:snapshot names it, so its
// cards can be parsed. Empty when the page lacks the component.
export function componentHtmlByName($: CheerioAPI, componentName: string): string {
  let html = "";
  $("[wire\\:snapshot]").each((_, el) => {
    if (html) return;
    if (($(el).attr("wire:snapshot") ?? "").includes(componentName)) {
      html = $.html(el);
    }
  });
  return html;
}

// Genre id → title from the browse filter checkboxes
// (`<input name="genre[]" value="67">` + `<label for="genre67">`). [] if absent.
export function parseGenres($: CheerioAPI): Option[] {
  const genres: Option[] = [];
  const seen = new Set<string>();
  $('input[name="genre[]"]').each((_, el) => {
    const id = $(el).attr("value")?.trim();
    if (!id || seen.has(id)) return;
    const title = $(`label[for="genre${id}"]`).first().text().trim();
    if (!title) return;
    seen.add(id);
    genres.push({ id, title });
  });
  genres.sort((a, b) => a.title.localeCompare(b.title));
  return genres;
}

export function hasNextPage($: CheerioAPI): boolean {
  let found = false;
  $("[wire\\:click*='nextPage']").each((_, el) => {
    if ($(el).attr("disabled") === undefined) found = true;
  });
  return found;
}

function parseStatus($: CheerioAPI): string {
  const text = (
    $("span:has(> span.size-1\\.5)").first().text() ||
    $("span.inline-flex")
      .filter((_, el) => /Completed|Ongoing|Hiatus|Cancelled/i.test($(el).text()))
      .first()
      .text()
  )
    .toLowerCase()
    .trim();

  if (text.includes("ongoing") || text.includes("releasing")) return "Ongoing";
  if (text.includes("completed")) return "Completed";
  if (text.includes("hiatus")) return "Hiatus";
  if (text.includes("cancelled") || text.includes("dropped")) return "Cancelled";
  return "Unknown";
}

export function parseMangaDetails($: CheerioAPI, mangaId: string): SourceManga {
  const title = ($("h1").first().text() || $("[data-flux-heading]").first().text()).trim();

  const thumbnailUrl = resolveImageUrl(
    $(".w-32 > picture:nth-child(1) > img:nth-child(3)").first(),
  );

  const infoSection = $("div.flex.flex-col.md\\:flex-row").first();

  const authors: string[] = [];
  infoSection.find("a[href*='/author/']").each((_, el) => {
    const name = $(el).text().trim();
    if (name) authors.push(name);
  });

  const genres: string[] = [];
  $("div.flex.items-center.gap-2.justify-center.mb-2 div[data-flux-badge]").each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (TYPE_BADGES.has(text)) genres.push(text.charAt(0).toUpperCase() + text.slice(1));
  });
  infoSection.find("a[href*='/genre/']").each((_, el) => {
    const name = $(el).text().trim();
    if (name) genres.push(name);
  });

  let rating = 0;
  $("span.text-xs").each((_, el) => {
    if (rating) return;
    const match = $(el)
      .text()
      .trim()
      .match(/^(\d+\.\d+)/);
    if (match) rating = parseFloat(match[1]) / 10;
  });

  const synopsis = $("p.leading-relaxed").first().text().trim();

  const isAdult = $("span:contains('18+')").length > 0;

  const tagGroups: TagSection[] = [];
  if (genres.length > 0) {
    tagGroups.push({
      id: "genres",
      title: "Genres",
      tags: genres.map((g) => ({ id: GENRE_ID_BY_TITLE.get(g.toLowerCase()) ?? g, title: g })),
    });
  }

  return {
    mangaId,
    mangaInfo: {
      primaryTitle: title,
      secondaryTitles: [],
      thumbnailUrl,
      synopsis,
      rating,
      contentRating: isAdult ? ContentRating.ADULT : ContentRating.EVERYONE,
      status: parseStatus($),
      tagGroups,
      author: authors.join(", ") || undefined,
      shareUrl: `${DOMAIN}/manga/${mangaId}`,
    },
  };
}

function splitDetails(text: string): string[] {
  return text
    .replace(/ - /g, " · ")
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function detailsLanguage(details: string[]): string {
  const known = details.find((d) => LANG_CODE_BY_BADGE.has(d.toUpperCase()));
  if (known) return known.toUpperCase();
  return "";
}

function detailsDate(details: string[]): string {
  return (
    details.find((d) => {
      const lower = d.toLowerCase();
      return lower.includes("ago") || lower === "today" || lower === "yesterday";
    }) ?? ""
  );
}

export function parseChapterDate(value: string): Date {
  const date = value.toLowerCase().trim();
  const now = new Date();
  if (!date) return now;
  if (date.includes("today")) return now;
  if (date.includes("yesterday")) {
    now.setDate(now.getDate() - 1);
    return now;
  }

  const match = date.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
  if (!match) return now;

  const value2 = parseInt(match[1], 10);
  switch (match[2]) {
    case "minute":
      now.setMinutes(now.getMinutes() - value2);
      break;
    case "hour":
      now.setHours(now.getHours() - value2);
      break;
    case "day":
      now.setDate(now.getDate() - value2);
      break;
    case "week":
      now.setDate(now.getDate() - value2 * 7);
      break;
    case "month":
      now.setMonth(now.getMonth() - value2);
      break;
    case "year":
      now.setFullYear(now.getFullYear() - value2);
      break;
  }
  return now;
}

function makeChapter(
  sourceManga: SourceManga,
  href: string,
  numberText: string,
  badge: string,
  dateStr: string,
): Chapter | undefined {
  const url = chapterIdFromHref(href);
  if (!url || url === "/") return undefined;

  const numMatch = numberText.match(CHAPTER_NUMBER_REGEX);
  const parsedNum = numMatch ? parseFloat(numMatch[1]) : 0;
  // Coerce unparseable numbers to 0 so a stray heading can't NaN the sort.
  const chapNum = Number.isFinite(parsedNum) ? parsedNum : 0;
  const langCode = LANG_CODE_BY_BADGE.get(badge.toUpperCase()) ?? "en";

  return {
    chapterId: url,
    sourceManga,
    chapNum,
    volume: 0,
    langCode,
    title: `Chapter ${numberText}`,
    publishDate: parseChapterDate(dateStr),
  };
}

// Surface every chapter, tagging each with its detected language (some series
// have multi-language variants and the site has no language filter).
export function parseChapters($: CheerioAPI, sourceManga: SourceManga): Chapter[] {
  const chapters: Chapter[] = [];
  const seen = new Set<string>();

  const push = (chapter: Chapter | undefined): void => {
    if (!chapter || seen.has(chapter.chapterId)) return;
    seen.add(chapter.chapterId);
    chapters.push(chapter);
  };

  // Structure 1: direct chapter links.
  $("a[wire\\:key^='ch-']").each((_, el) => {
    const link = $(el);
    const number =
      link.find("div[data-flux-heading]").first().text().replace("Chapter ", "").trim() ||
      link.find("div.w-10").first().text().trim();
    if (!number) return;

    const href = link.attr("href") ?? "";
    const details = splitDetails(link.find("p[data-flux-text]").first().text());

    push(makeChapter(sourceManga, href, number, detailsLanguage(details), detailsDate(details)));
  });

  // Structure 2: dropdown menus (per-language chapter variants).
  $("ui-dropdown[wire\\:key^='ch-']").each((_, el) => {
    const dropdown = $(el);
    const number =
      dropdown.find("div[data-flux-heading]").first().text().replace("Chapter ", "").trim() ||
      dropdown.find("button div.w-10").first().text().trim();
    if (!number) return;

    const details = splitDetails(dropdown.find("p[data-flux-text]").first().text());
    const dateStr = detailsDate(details);

    dropdown.find("ui-menu a[data-flux-menu-item]").each((_, link) => {
      const menuItem = $(link);
      const href = menuItem.attr("href") ?? "";
      const badge = (
        menuItem.find("div[data-flux-badge]").first().text() || menuItem.text()
      ).trim();

      push(makeChapter(sourceManga, href, number, badge, dateStr));
    });
  });

  return chapters;
}

export function extractReaderToken(body: string): string {
  return READER_TOKEN_REGEX.exec(body)?.[1] ?? "";
}

export function countPages(body: string): number {
  // The reader page embeds an authoritative `totalPages: N`; prefer it over
  // counting `order:` occurrences (which the page may repeat for spreads).
  const total = TOTAL_PAGES_REGEX.exec(body);
  if (total?.[1]) {
    const count = parseInt(total[1], 10);
    if (count > 0) return count;
  }
  const matches = body.match(PAGE_ORDER_REGEX);
  return matches ? matches.length : 0;
}
