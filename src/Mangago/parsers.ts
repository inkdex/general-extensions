/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type MangaInfo,
  type SearchResultItem,
  type SourceManga,
  type Tag,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { DOMAIN } from "./models";
import { absoluteUrl, canonicalReaderUrl, extractMangaId } from "./utils/urls";

const KNOWN_GROUPS = [
  {
    title: "Official",
    patterns: [/official/i],
  },
  {
    title: "Asura Scans",
    patterns: [/asura scans/i, /\basura\b/i],
  },
  {
    title: "Reaper Scans",
    patterns: [/reaper scans/i, /\breaper\b/i],
  },
  {
    title: "Speedcat",
    patterns: [/speedcat/i],
  },
  {
    title: "Death by Roses",
    patterns: [/death by roses/i],
  },
  {
    title: "Bored Corona Kids",
    patterns: [/bored corona kids/i],
  },
];

const OFFICIAL_UPLOADERS = new Set(
  [
    "Akumakira",
    "Jujucat",
    "Abijyn",
    "Jihoonx",
    "Lemonade",
    "Tortureritual",
    "Inori008",
    "Icarus",
    "laura",
    "Kanbe daiSUKE",
    "nanachi",
    "bloomingdale",
    "nekobasu",
    "attackonlevisass",
    "Leah",
    "areum",
    "Soo",
    "sera",
    "Lynn",
  ].map((uploader) => uploader.replace(/\s+/g, " ").trim().toLowerCase()),
);

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function makeSafeId(raw: string): string {
  return (
    safeDecodeURIComponent(raw)
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/\s+/g, "-")
      .replace(/_/g, "-")
      .replace(/[^a-z0-9._\-@()[\]%?#+=/&:]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "unknown"
  );
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeGroup(raw: string): string {
  const text = normalizeWhitespace(raw);
  const lowerText = text.toLowerCase();

  if (!text) return "";

  for (const group of KNOWN_GROUPS) {
    if (group.patterns.some((pattern) => pattern.test(lowerText))) {
      return group.title;
    }
  }

  return text;
}

function detectGroupFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();

  for (const group of KNOWN_GROUPS) {
    if (group.patterns.some((pattern) => pattern.test(lowerTitle))) {
      return group.title;
    }
  }

  return "";
}

function isLikelyChapterNote(value: string): boolean {
  return (
    /\b(afterword|bonus|epilogue|extra|finale|interlude|note|omake|oneshot|one-shot|prologue|side\s*story|special|teaser)\b/i.test(
      value,
    ) || /\bend\s+of\s+season\b|\bseason\s+finale\b/i.test(value)
  );
}

function cleanUploaderCandidate(value: string): string {
  return normalizeWhitespace(value);
}

function isDateLike(value: string): boolean {
  const text = cleanUploaderCandidate(value);
  if (!text) return false;

  return (
    /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(text) ||
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(text) ||
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}$/i.test(
      text,
    ) ||
    /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{2,4}$/i.test(
      text,
    ) ||
    /^(today|yesterday)$/i.test(text) ||
    /^\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i.test(text)
  );
}

function detectGroupFromBracket(title: string): string {
  const bracketMatches = title.matchAll(/(?:\[([^\]]{2,80})\]|\(([^()]{2,80})\))/g);

  for (const match of bracketMatches) {
    const value = normalizeWhitespace(match[1] ?? match[2] ?? "");
    if (!value) continue;

    const knownGroup = detectGroupFromTitle(value);
    if (knownGroup) return knownGroup;

    if (/\b(scans?|scanlations?|translations?|translators?|team|group)\b/i.test(value)) {
      return normalizeGroup(value);
    }

    if (!isDateLike(value) && !isLikelyChapterNote(value)) return normalizeGroup(value);
  }

  return "";
}

function buildVersion(group: string, uploader: string): string | undefined {
  if (!group) return uploader || undefined;
  if (!uploader || group.toLowerCase() === uploader.toLowerCase()) return group;

  return `${group} - ${uploader}`;
}

function isOfficialUploader(uploader: string): boolean {
  return OFFICIAL_UPLOADERS.has(uploader.replace(/\s+/g, " ").trim().toLowerCase());
}

export function buildChapterVersion(rawUploader: string, rawTitle = ""): string | undefined {
  const uploader = normalizeGroup(rawUploader);
  const detectedGroup =
    detectGroupFromBracket(rawTitle) ||
    detectGroupFromTitle(rawTitle) ||
    (isOfficialUploader(rawUploader) ? "Official" : "");

  return buildVersion(detectedGroup, uploader);
}

function firstUploaderCandidate(candidates: string[], chapterTitle: string): string {
  return (
    candidates.map(cleanUploaderCandidate).find(
      (candidate) =>
        candidate &&
        candidate !== chapterTitle &&
        // Skip the substring test when the chapter title is empty — otherwise
        // `candidate.includes("")` is always true and every uploader is rejected.
        (!chapterTitle || !candidate.includes(chapterTitle)) &&
        !isDateLike(candidate),
    ) ?? ""
  );
}

function extractUploader($row: cheerio.Cheerio<any>): string {
  const chapterTitle = cleanUploaderCandidate($row.find("a.chico").first().text());

  const profileUploader = firstUploaderCandidate(
    $row
      .find("a[href*='/home/'], a[href*='/user/'], a[href*='/profile/']")
      .not("a.chico")
      .toArray()
      .map((element) => $row.find(element).text()),
    chapterTitle,
  );
  if (profileUploader) return profileUploader;

  const explicitCandidates = $row
    .find(
      "td.no a, td.no, td.uk-table-shrink a, td.uk-table-shrink, td[class*='upload'] a, td[class*='upload'], td[class*='group'] a, td[class*='group']",
    )
    .toArray()
    .map((element) => $row.find(element).text());

  const explicitUploader = firstUploaderCandidate(explicitCandidates, chapterTitle);
  if (explicitUploader) return explicitUploader;

  const linkUploader = firstUploaderCandidate(
    $row
      .find("td a")
      .not("a.chico")
      .toArray()
      .map((element) => $row.find(element).text()),
    chapterTitle,
  );
  if (linkUploader) return linkUploader;

  return firstUploaderCandidate(
    $row
      .find("td")
      .not((_, cell) => $row.find(cell).find("a.chico").length > 0)
      .toArray()
      .map((cell) => $row.find(cell).text()),
    chapterTitle,
  );
}

function toPathname(href: string): string {
  const normalizedHref = href.trim();
  if (!normalizedHref) return "";

  try {
    return new URL(normalizedHref, DOMAIN).pathname;
  } catch {
    const extracted = extractMangaId(normalizedHref);

    try {
      return new URL(extracted, DOMAIN).pathname;
    } catch {
      return extracted;
    }
  }
}

function originalChapterUrlFromHref(href: string, chapterId: string): string {
  // Test "//" before "/" so a protocol-relative href isn't swallowed by the
  // single-slash branch.
  if (href.startsWith("//")) return chapterUrlFromId(`https:${href}`);
  if (href.startsWith("/")) return chapterUrlFromId(href);
  if (href.startsWith("http://") || href.startsWith("https://")) return chapterUrlFromId(href);

  return chapterUrlFromId(chapterId);
}

// Pin any reader URL/path to www.mangago.me rather than trusting a stored host.
// (See canonicalReaderUrl.)
function normalizeReaderUrl(url: string): string {
  return canonicalReaderUrl(url);
}

export interface MangagoListing extends SearchResultItem {
  // Reader path of the tile's latest chapter, when present — lets the New
  // Chapters section render as a tappable chapter-updates list.
  chapterId?: string;
  // Update time and genres, only available on the /list/latest/ update page.
  publishDate?: Date;
  genres?: string[];
}

export function parseListings(html: string): MangagoListing[] {
  const $ = cheerio.load(html);
  const items: MangagoListing[] = [];
  const seen = new Set<string>();

  function cleanText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
  }

  function pushListing($item: cheerio.Cheerio<any>): void {
    const $link =
      $item.find("a.thm-effect").first().length > 0
        ? $item.find("a.thm-effect").first()
        : $item.find("a[href*='/read-manga/']").first();

    if ($link.length === 0) return;

    const href = $link.attr("href") ?? "";
    try {
      const path = new URL(href, DOMAIN).pathname;
      if (/\/pg-\d+\/?$/i.test(path)) return;
    } catch {
      if (/\/pg-\d+\/?$/i.test(href)) return;
    }
    const mangaId = toPathname(href);
    if (!mangaId || seen.has(mangaId)) return;

    const $img =
      $link.find("img").first().length > 0 ? $link.find("img").first() : $item.find("img").first();

    const title = cleanText(
      $link.attr("title") ??
        $img.attr("alt") ??
        $item.find("a[title]").first().attr("title") ??
        $item.find(".title, .manga-title, .name, h3, h4").first().text() ??
        $link.text(),
    );

    if (!title) return;

    const imageUrl = absoluteUrl(
      $img.attr("data-src") ??
        $img.attr("data-cfsrc") ??
        $img.attr("data-lazy-src") ??
        $img.attr("srcset")?.split(/\s+/)[0] ??
        $img.attr("src") ??
        "",
    );

    const $chapterLink = $item
      .find("p.chapter a, .chapter a, a[href*='/read-manga/'][href*='/c']")
      .first();
    // The loose href fallback can match the title link itself for slugs that
    // contain "/c"; treat it as a chapter only when it isn't the manga's path.
    const chapterPath = $chapterLink.attr("href") ? toPathname($chapterLink.attr("href")!) : "";
    const isChapter = chapterPath !== "" && chapterPath !== mangaId;
    const subtitle = isChapter ? cleanText($chapterLink.text()) : "";
    const chapterId = isChapter ? chapterPath : undefined;

    seen.add(mangaId);
    items.push({
      mangaId,
      title,
      imageUrl,
      subtitle: subtitle || undefined,
      chapterId: chapterId || undefined,
    });
  }

  $(".updatesli, .pic_list > li, div.pic_list .updatesli, .also-like li").each((_, element) => {
    pushListing($(element));
  });

  if (items.length > 0) return items;

  $("a.thm-effect, a[href*='/read-manga/']").each((_, element) => {
    const $link = $(element);
    const $item = $link.closest("li, div, article");

    pushListing($item.length > 0 ? $item : $link);
  });

  return items;
}

export function hasNextPage(html: string): boolean {
  const $ = cheerio.load(html);

  return (
    $(".current + li > a").length > 0 ||
    $(".pagination .next a, .pagination a.next, a[rel='next']").length > 0 ||
    // Last-resort "next"-text match, but ONLY inside a pagination container —
    // scanning every <a> on the page would treat a stray "Next Chapter"/title
    // link as another results page and paginate forever.
    $(".pagination a, .page a, .pager a")
      .toArray()
      .some((a) => /next/i.test($(a).text()))
  );
}

export function mangaUrlFromId(mangaId: string): string {
  if (mangaId.startsWith("http")) return mangaId;
  return `${DOMAIN}${mangaId}`;
}

// The update list shows relative times ("5 minutes", "2 hours", "3 days").
const RELATIVE_UNIT_MS: Record<string, number> = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
  year: 31_536_000_000,
};

function parseRelativeTime(text: string): Date | undefined {
  const match = text.toLowerCase().match(/(\d+)\s*(second|minute|hour|day|week|month|year)/);
  if (match) {
    const amount = Number(match[1]);
    const unitMs = RELATIVE_UNIT_MS[match[2]!];
    if (unitMs) return new Date(Date.now() - amount * unitMs);
  }
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? undefined : new Date(parsed);
}

// The /list/latest/ "Last Updates" page uses a detailed `.box` row per title,
// carrying the update time, genres, and latest-chapter links — richer than the
// /genre/ grid, so the New Chapters section uses it for a real updates list.
export function parseLatestUpdates(html: string): MangagoListing[] {
  const $ = cheerio.load(html);
  const items: MangagoListing[] = [];
  const seen = new Set<string>();
  const clean = (value: string): string => value.replace(/\s+/g, " ").trim();

  // Mobile/desktop layouts differ; both wrap the title in .row-1 with the other
  // rows as siblings and the cover preceding. Anchor on the title for a stable scope.
  $(".row-1 .tit a").each((_, element) => {
    const $titleLink = $(element);
    const href = $titleLink.attr("href") ?? "";
    if (!href.includes("/read-manga/")) return;

    const mangaId = toPathname(href);
    if (!mangaId || seen.has(mangaId)) return;

    const title = clean($titleLink.attr("title") ?? $titleLink.text());
    if (!title) return;

    const $content = $titleLink.closest(".row-1").parent();

    const $img = $content.prev().find("img").first();
    const imageUrl = absoluteUrl($img.attr("data-src") ?? $img.attr("src") ?? "");

    const $chapter = $content.find("a.chico").first();
    const subtitle = clean($chapter.text());
    const chapterId = $chapter.attr("href") ? toPathname($chapter.attr("href")!) : undefined;

    // "Update Date: <relative time>" — in .row-1 (desktop) or a sibling .row-3 (mobile).
    let publishDate: Date | undefined;
    $content.find(".blue").each((_, label) => {
      const $label = $(label);
      if ($label.text().trim().toLowerCase().startsWith("update date")) {
        publishDate = parseRelativeTime(
          clean($label.parent().text()).replace(/^update date:\s*/i, ""),
        );
      }
    });

    const genres = $content
      .find(".row-4 .gray")
      .text()
      .split(/[/,]/)
      .map((genre) => clean(genre))
      .filter(Boolean);

    seen.add(mangaId);
    items.push({
      mangaId,
      title,
      imageUrl,
      subtitle: subtitle || undefined,
      chapterId: chapterId || undefined,
      publishDate,
      genres: genres.length ? genres : undefined,
    });
  });

  return items;
}

// Detail-page rating (span.rating_num, 0–10) + status, for the hero pills.
export interface FeaturedDetail {
  rating?: string;
  status?: string;
  author?: string;
  summary?: string;
}

// Detail-page fields used to enrich the Featured hero: rating (span.rating_num,
// 0–10), status, author, and summary.
export function parseFeaturedDetail(html: string): FeaturedDetail {
  const $ = cheerio.load(html);

  const ratingText = $(".rating_num").first().text().replace(/\s+/g, "");
  const rating = /^\d+(?:\.\d+)?$/.test(ratingText) ? ratingText : undefined;

  let status: string | undefined;
  let author: string | undefined;
  $(".manga_right tr, .manga_info li").each((_, element) => {
    const $el = $(element);
    const label = $el.find("label, b").first().text().trim().toLowerCase();
    if (label.startsWith("status")) {
      const value = $el.find("span").first().text().trim();
      if (value) status = value;
    } else if (label.startsWith("author")) {
      const names = $el
        .find("a")
        .map((_index, anchor) => $(anchor).text().trim())
        .get()
        .filter(Boolean);
      if (names.length > 0) author = names.join(", ");
    }
  });

  const summaryEl = $(".manga_summary").first();
  summaryEl.find("font").remove();
  const summary = summaryEl.text().trim() || undefined;

  return { rating, status, author, summary };
}

export function chapterUrlFromId(chapterId: string): string {
  if (chapterId.startsWith("http")) return normalizeReaderUrl(chapterId);

  return normalizeReaderUrl(`${DOMAIN}${chapterId.startsWith("/") ? chapterId : `/${chapterId}`}`);
}

export function parseMangaDetails(html: string, mangaId: string): SourceManga {
  const $ = cheerio.load(html);
  const normalizedMangaId = toPathname(mangaId) || mangaId;

  const info = $("#information");

  const title = $(".w-title h1").first().text().trim() || normalizedMangaId;
  const coverImg = info.find("img").first();

  const imageUrl = absoluteUrl(
    coverImg.attr("data-src") ??
      coverImg.attr("data-cfsrc") ??
      coverImg.attr("data-lazy-src") ??
      coverImg.attr("srcset")?.split(/\s+/)[0] ??
      coverImg.attr("src") ??
      "",
  );

  const summary = info.find(".manga_summary").first();
  summary.find("font").remove();

  const description = summary.text().trim();

  let status: MangaInfo["status"] = "UNKNOWN";
  let author = "";
  let artist = "";
  const secondaryTitles: string[] = [];
  const tags: Tag[] = [];
  const tagTitles: string[] = [];

  info.find(".manga_info li, .manga_right tr").each((_, element) => {
    const $el = $(element);
    const label = $el.find("b, label").first().text().trim().toLowerCase();
    const value = $el.find("span").first().text().trim();

    if (label.startsWith("status")) {
      const statusValue = value.toLowerCase();

      if (statusValue === "ongoing") status = "ONGOING";
      else if (statusValue === "completed") status = "COMPLETED";
    }

    if (label.startsWith("author")) {
      author = $el
        .find("a")
        .map((_, a) => $(a).text().trim())
        .get()
        .join(", ");
    }

    if (label.startsWith("artist")) {
      artist = $el
        .find("a")
        .map((_, a) => $(a).text().trim())
        .get()
        .join(", ");
    }

    // Alternative / other names — improves search and tracker (AniList/MAL)
    // matching. Best-effort: if the row's markup doesn't match, the list just
    // stays empty (no regression). mangago separates names with ; / or newlines.
    if (label.startsWith("alternative") || label.includes("other name")) {
      const raw = value || $el.text().replace(/^[^:]*:/, "");
      for (const name of raw.split(/[;/\n]+/).map((s) => s.trim())) {
        if (name && !secondaryTitles.includes(name)) secondaryTitles.push(name);
      }
    }

    if (label.startsWith("genre")) {
      $el.find("a").each((_, a) => {
        const genreTitle = $(a).text().trim();
        if (!genreTitle) return;

        const href = $(a).attr("href") ?? "";
        const rawId = href.match(/\/genre\/([^/?]+)/)?.[1] ?? genreTitle;
        const id = makeSafeId(rawId);

        tagTitles.push(genreTitle);
        tags.push({ id, title: genreTitle });
      });
    }
  });

  const isAdult = tagTitles.some((x) => ["Adult", "Smut", "Yaoi"].includes(x));
  const isMature = tagTitles.some((x) => x === "Ecchi");

  // rating_num is 0–10; MangaInfo.rating is 0–1 (rendered as a percentage star).
  const ratingNum = parseFloat(
    $(".rating_num")
      .first()
      .text()
      .replace(/[^\d.]/g, ""),
  );
  const rating = Number.isFinite(ratingNum) ? Math.min(1, Math.max(0, ratingNum / 10)) : 0;

  return {
    mangaId: normalizedMangaId,
    mangaInfo: {
      primaryTitle: title,
      secondaryTitles,
      thumbnailUrl: imageUrl,
      synopsis: description,
      author,
      artist,
      status,
      rating,
      contentRating: isAdult
        ? ContentRating.ADULT
        : isMature
          ? ContentRating.MATURE
          : ContentRating.EVERYONE,
      tagGroups: [
        {
          id: "genres",
          title: "Genres",
          tags,
        },
      ],
    },
  };
}

function parseChapterTitle(input: string): {
  chapter?: number;
  title?: string;
} {
  const trimmed = input.trim();
  const colon = trimmed.indexOf(":");

  let left = colon >= 0 ? trimmed.slice(0, colon).trim() : trimmed;
  const right = colon >= 0 ? trimmed.slice(colon + 1).trim() : "";

  let chapter: number | undefined;
  let title: string | undefined;

  const volumeMatch = /^Vol\.\s*(?:(\d+(?:\.\d+)?)|TBA|N\/?A|NA)?\s*/i.exec(left);
  if (volumeMatch) {
    left = left.slice(volumeMatch[0].length).trimStart();
  }

  if (/^Ch\./i.test(left)) {
    left = left.slice(3).trimStart();
    const match = /^(\d+(?:\.\d+)?)/.exec(left);
    if (match) {
      chapter = Number(match[1]);
      left = left.slice(match[1].length).trimStart();
    }
  }

  if (right && left) title = `${left}: ${right}`;
  else if (right) title = right;
  else if (left) title = left;

  return { chapter, title };
}

function parseChapterNumber(name: string): number {
  // No chapterId/slug fallback: the slug's number is usually an internal upload
  // id, not the chapter number. When the visible name carries no number we leave
  // it 0 (handled specially by the sort).
  const rawNumber =
    name.match(/chapter\s*(\d+(?:\.\d+)?)/i)?.[1] ??
    name.match(/ch\.\s*(\d+(?:\.\d+)?)/i)?.[1] ??
    name.match(/(\d+(?:\.\d+)?)/)?.[1];

  const number = rawNumber ? Number(rawNumber) : 0;
  return Number.isFinite(number) ? number : 0;
}

function compareChapterGroups(a: Chapter, b: Chapter): number {
  const aOfficial = a.version?.startsWith("Official") ?? false;
  const bOfficial = b.version?.startsWith("Official") ?? false;

  if (aOfficial && !bOfficial) return -1;
  if (!aOfficial && bOfficial) return 1;

  return (a.version ?? "").localeCompare(b.version ?? "");
}

export function parseChapters(html: string, sourceManga: SourceManga): Chapter[] {
  const $ = cheerio.load(html);
  const chapters: Chapter[] = [];

  $("table#chapter_table > tbody > tr, table.uk-table > tbody > tr").each((_, element) => {
    const $row = $(element);
    const $link = $row.find("a.chico").first();

    const href = ($link.attr("href") ?? "").trim();
    if (!href) return;

    const chapterId = toPathname(href);
    if (!chapterId) return;

    const originalChapterUrl = originalChapterUrlFromHref(href, chapterId);
    const rawTitle = $link.text().trim();
    const parsed = parseChapterTitle(rawTitle);
    const rawUploader = extractUploader($row);
    const version = buildChapterVersion(rawUploader, rawTitle);
    const chapNum = parsed.chapter ?? parseChapterNumber(rawTitle);
    const title = parsed.title || rawTitle;

    const dateText = $row.find("td").last().text().trim();
    const parsedDate = dateText ? new Date(dateText) : undefined;
    const publishDate =
      parsedDate && Number.isFinite(parsedDate.getTime()) ? parsedDate : undefined;

    const chapter = {
      chapterId,
      sourceManga,
      title,
      chapNum,
      volume: 0,
      version,
      publishDate,
      langCode: "en",
      sortingIndex: 0,
      additionalInfo: {
        originalChapterUrl,
      },
    } as Chapter & {
      additionalInfo: {
        originalChapterUrl: string;
      };
    };

    chapters.push(chapter);
  });

  chapters.sort((a, b) => {
    if (a.chapNum === 0 && b.chapNum === 0) return compareChapterGroups(a, b);
    if (a.chapNum === 0) return 1;
    if (b.chapNum === 0) return -1;
    if (a.chapNum !== b.chapNum) return b.chapNum - a.chapNum;

    return compareChapterGroups(a, b);
  });

  return chapters.map((chapter, index) => ({
    ...chapter,
    sortingIndex: chapters.length - index,
  }));
}
