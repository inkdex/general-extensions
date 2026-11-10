/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  URL,
  type Chapter,
  type ChapterDetails,
  type SearchResultItem,
  type SourceManga,
  type Tag,
} from "@paperback/types";
import * as cheerio from "cheerio";

import {
  ADULT_EXCLUSIONS,
  DOMAIN,
  MATURE_RATING_GENRES,
  NON_GENRE_VALUES,
  type ChapterDetailResponse,
  type GenreOption,
  type Novel,
  type NovelListItem,
  type NovelSource,
  type SourceChapter,
  type SourceChapterDetailResponse,
  type TriState,
} from "./models";
import { repairMojibake } from "./utils";

// Paperback rejects ids containing characters outside this set.
const SAFE_ID_REGEX = /[^a-zA-Z0-9._\-@()[\]%?#+=/&:]/g;

export const encodeId = (value: string): string =>
  value.replace(SAFE_ID_REGEX, (char) => {
    const encoded = encodeURIComponent(char);
    return encoded !== char ? encoded : `%${char.charCodeAt(0).toString(16).toUpperCase()}`;
  });

export const decodeId = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseCoverUrl = (novel: Novel): string => {
  const path = (novel.cover_url ?? novel.image_url ?? novel.novel_image ?? "").trim();
  if (!path) throw new Error("No cover returned for this novel");
  const url = path.startsWith("//")
    ? `https:${path}`
    : path.startsWith("/")
      ? `${DOMAIN}${path}`
      : path;
  if (!/^https?:\/\/[^/\s?#]+(?:[/?#]|$)/i.test(url)) throw new Error("Invalid novel cover URL");
  return url;
};

const parseGenres = (novel: Novel): string[] => {
  const seen = new Set<string>();
  return (novel.genres ?? "")
    .split(",")
    .map((genre) => genre.trim())
    .filter((genre) => {
      const key = genre.toLowerCase();
      if (!genre || NON_GENRE_VALUES.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const parseStatus = (novel: Novel): string | undefined => {
  const status = (novel.release_status ?? novel.ongoing)?.trim();
  if (!status) return undefined;
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const cleanDescription = (value?: string | null): string => {
  if (!value) return "";
  return Application.decodeHTMLEntities(value)
    .replace(/\s*show more\s*$/i, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
};

const decodeText = (value?: string | null): string =>
  value ? Application.decodeHTMLEntities(value).trim() : "";

export const contentRatingForGenres = (genres: string[]): ContentRating => {
  const normalizedGenres = genres.map((genre) => genre.toLowerCase());
  if (
    normalizedGenres.some(
      (genre) => ADULT_EXCLUSIONS.includes(genre) && !MATURE_RATING_GENRES.includes(genre),
    )
  ) {
    return ContentRating.ADULT;
  }
  if (normalizedGenres.some((genre) => MATURE_RATING_GENRES.includes(genre))) {
    return ContentRating.MATURE;
  }
  return ContentRating.EVERYONE;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const parseNovelList = (novels: Novel[]): NovelListItem[] =>
  novels.flatMap((novel) => {
    const title = decodeText(novel.title);
    if (!title || !String(novel.id ?? "").trim()) return [];
    let imageUrl: string;
    try {
      imageUrl = parseCoverUrl(novel);
    } catch {
      // A malformed card must not reject the entire listing at the native bridge.
      return [];
    }
    const chapterCount = novel.chapter_names?.length || Number(novel.total_chapters) || 0;
    const latestName = novel.chapter_names?.at(-1) ?? "";
    const releaseMatch = novel.latest_release?.match(
      /\b(?:chapter|chap\.?|ch\.?|episode|ep\.?)\s*#?\s*(\d[\d,]*(?:\.\d+)?)/i,
    );
    const date = novel.updated_at ? new Date(novel.updated_at) : undefined;
    const genres = parseGenres(novel);
    const views = Number(novel.views_number ?? novel.views);
    return [
      {
        mangaId: encodeId(String(novel.id)),
        title,
        imageUrl,
        genres,
        contentRating: contentRatingForGenres(genres),
        author: decodeText(novel.author) || undefined,
        summary: cleanDescription(novel.description) || undefined,
        rating:
          novel.rating != null && Number.isFinite(novel.rating) && novel.rating > 0
            ? Math.min(5, Math.max(0, novel.rating))
            : undefined,
        views: Number.isFinite(views) ? views : undefined,
        chapterCount,
        latestChapter: releaseMatch
          ? Number(releaseMatch[1].replace(/,/g, ""))
          : cleanChapterName(latestName).chapNum,
        publishDate: date && !Number.isNaN(date.getTime()) ? date : undefined,
      },
    ];
  });

export const filterNovelList = (
  items: NovelListItem[],
  genres: TriState,
  hideAdult: boolean,
  match = "all",
): NovelListItem[] => {
  const includes = pickGenreValues(genres, "included");
  const excludes = pickGenreValues(genres, "excluded");
  return items.filter((item) => {
    if (hideAdult && item.contentRating !== ContentRating.EVERYONE) return false;
    const values = item.genres.map((genre) => genre.toLowerCase());
    return (
      !excludes.some((genre) => values.includes(genre)) &&
      (!includes.length ||
        (match === "any"
          ? includes.some((genre) => values.includes(genre))
          : includes.every((genre) => values.includes(genre))))
    );
  });
};

export const toSearchResultItem = (item: NovelListItem) =>
  ({
    mangaId: item.mangaId,
    title: item.title,
    imageUrl: item.imageUrl,
    subtitle:
      [
        item.latestChapter != null
          ? `Ch. ${item.latestChapter}`
          : item.chapterCount > 0
            ? `${item.chapterCount} Chapters`
            : undefined,
        item.rating != null ? `★ ${item.rating.toFixed(1)}` : undefined,
      ]
        .filter(Boolean)
        .join(" • ") || undefined,
    contentRating: item.contentRating,
  }) satisfies SearchResultItem;

export const parseMangaDetails = (novel: Novel, mangaId: string): SourceManga => {
  const primaryTitle = decodeText(novel.title) || "Untitled";
  const seen = new Set([primaryTitle.toLowerCase()]);
  const secondaryTitles: string[] = [];
  for (const alias of novel.associated_names ?? []) {
    const title = decodeText(alias);
    const key = title.toLowerCase();
    if (!title || seen.has(key)) continue;
    seen.add(key);
    secondaryTitles.push(title);
  }

  const genres = parseGenres(novel);
  const tags: Tag[] = genres.map((genre) => ({
    id: encodeId(genre.toLowerCase()),
    title: genre,
  }));

  const percentage =
    novel.rating != null && Number.isFinite(novel.rating)
      ? Math.min(1, Math.max(0, novel.rating / 5))
      : undefined;
  const additionalInfo =
    percentage === undefined
      ? undefined
      : {
          rating: `${Math.round(percentage * 100)}%${
            novel.rating_count ? ` · ${novel.rating_count} ratings` : ""
          }`,
        };

  return {
    mangaId,
    mangaInfo: {
      primaryTitle,
      secondaryTitles,
      thumbnailUrl: parseCoverUrl(novel),
      synopsis: cleanDescription(novel.description),
      author: decodeText(novel.author) || undefined,
      status: parseStatus(novel),
      rating: percentage,
      contentRating: contentRatingForGenres(genres),
      contentType: "novel",
      tagGroups: tags.length > 0 ? [{ id: "genres", title: "Genres", tags }] : undefined,
      additionalInfo,
      shareUrl: `${DOMAIN}/novel?id=${novel.id}`,
    },
  };
};

const cleanChapterName = (name: string): { chapNum?: number; title: string } => {
  const decoded = Application.decodeHTMLEntities(name);
  const keywordMatch = decoded.match(
    /^\s*(?:chapter|chap\.?|ch\.?|episode|ep\.?)\s*(\d+(?:\.\d+)?)\s*[-:–.]?\s*/i,
  );
  const match = keywordMatch ?? decoded.match(/^\s*(\d+(?:\.\d+)?)\s*[-:–.]\s+/);
  const parsedNumber = match ? parseFloat(match[1]) : NaN;
  let title = (match ? decoded.slice(match[0].length) : decoded).trim();
  if (Number.isFinite(parsedNumber)) {
    const repeated = title.match(/^(\d+(?:\.\d+)?)\s*[-:–.]\s*/);
    if (repeated && parseFloat(repeated[1]) === parsedNumber) {
      title = title.slice(repeated[0].length);
    }
  }
  return { chapNum: Number.isFinite(parsedNumber) ? parsedNumber : undefined, title };
};

export const parseChapters = (novel: Novel, sourceManga: SourceManga): Chapter[] =>
  (novel.chapter_names?.length
    ? novel.chapter_names
    : Array.from(
        { length: Number(novel.total_chapters) || 0 },
        (_, index) => `Chapter ${index + 1}`,
      )
  ).map((rawName, index) => {
    const { chapNum, title } = cleanChapterName((rawName ?? "").trim());
    const chapterNumber = chapNum ?? index + 1;
    // Native reader IDs are 1-based positions even when the printed number differs.
    return {
      chapterId: String(index + 1),
      sourceManga,
      langCode: "en",
      chapNum: chapterNumber,
      title: title || undefined,
      version: "NovelArchive",
      volume: 0,
      sortingIndex: index,
    };
  });

export const parseSourceChapters = (
  novelSource: NovelSource,
  chapters: SourceChapter[],
  sourceManga: SourceManga,
): Chapter[] => {
  const displayName =
    novelSource.label?.trim() ||
    novelSource.id.replace(/[-_]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
  return chapters.map((chapter, index) => {
    const parsedNumber =
      typeof chapter.number === "number" ? chapter.number : parseFloat(String(chapter.number));
    const chapNum = Number.isFinite(parsedNumber) ? parsedNumber : index + 1;
    const { title } = cleanChapterName((chapter.title ?? "").trim());
    return {
      chapterId: `${encodeId(novelSource.id)}:${encodeId(String(chapter.number))}`,
      sourceManga,
      langCode: "en",
      chapNum,
      title: title || undefined,
      version: displayName,
      volume: 0,
      sortingIndex: index,
    };
  });
};

export const mergeChapterVersions = (...lists: Chapter[][]): Chapter[] =>
  lists
    .flat()
    .sort((left, right) => left.chapNum - right.chapNum)
    .map((chapter, sortingIndex) => ({ ...chapter, sortingIndex }));

const wrapXhtml = (bodyHtml: string, heading: string): string => {
  const title = heading ? `<h2>${escapeXml(heading)}</h2>` : "";
  return `<html xmlns="http://www.w3.org/1999/xhtml"><head><meta charset="utf-8"/></head><body>${title}${bodyHtml}</body></html>`;
};

const textToXhtml = (text: string, heading: string): string =>
  wrapXhtml(
    Application.decodeHTMLEntities(text)
      .replace(/\u00a0/g, " ")
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => `<p>${escapeXml(line)}</p>`)
      .join(""),
    heading,
  );

const validateChapterContent = (content: string): void => {
  if (
    !content.trim() ||
    (content.length < 60 && /chapter\s+(not\s+found|does\s+not\s+exist)/i.test(content))
  )
    throw new Error("No content returned for this chapter");
  if (/Security Check Required\s+Please complete the security check/i.test(content.trim()))
    throw new Error(
      "NovelArchive returned an upstream security check. Try another chapter version or open the site.",
    );
};

// XML serialization closes void elements without losing mirror formatting.
const htmlToXhtml = (html: string, heading: string): string => {
  const $ = cheerio.load(html, null, false);
  $("script, style").remove();
  $("img[src]").each((_, image) => {
    const src = $(image).attr("src")!;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(src))
      $(image).attr("src", new URL(`${DOMAIN}/`).update(src).toString());
  });
  if ($.root().text().trim() || !$("img[src]").length) validateChapterContent($.root().text());
  return wrapXhtml($.html({ xml: true }), $("h1, h2").length > 0 ? "" : heading);
};

export const parseChapterDetails = (
  response: ChapterDetailResponse,
  chapter: Chapter,
): ChapterDetails => {
  const content = (response.chapter?.content ?? response.content ?? "").trim();
  validateChapterContent(content);
  return {
    type: "html",
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    html: textToXhtml(content, chapter.title ?? ""),
  };
};

export const parseSourceChapterDetails = (
  response: SourceChapterDetailResponse,
  chapter: Chapter,
): ChapterDetails => {
  const html = repairMojibake(
    (response.content_html ?? response.chapter?.content_html ?? response.content ?? "").trim(),
  );
  if (!html) {
    throw new Error(`No content returned for chapter ${chapter.chapterId}`);
  }
  return {
    type: "html",
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    html: htmlToXhtml(html, chapter.title ?? ""),
  };
};

export const parseGenreOptions = (genres: GenreOption[]): Tag[] => {
  const seen = new Set<string>();
  return genres.flatMap((genre) => {
    const value = genre.value.trim().toLowerCase();
    const key = value.toLowerCase();
    if (!value || NON_GENRE_VALUES.has(key) || seen.has(key)) return [];
    seen.add(key);
    return [{ id: encodeId(value), title: decodeText(genre.label) || value }];
  });
};

export const pickGenreValues = (
  genres: TriState | undefined,
  state: "included" | "excluded",
): string[] =>
  Object.entries(genres ?? {})
    .filter(([, value]) => value === state)
    .map(([id]) => decodeId(id).toLowerCase());
