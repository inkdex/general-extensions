/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type FeaturedCarouselItem,
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
  type SearchMetadata,
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
    return encoded !== char ? encoded : "-";
  });

export const decodeId = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseCoverUrl = (novel: Novel): string => {
  const path = novel.cover_url ?? novel.image_url ?? novel.novel_image;
  if (!path) return "";
  return path.startsWith("http") ? path : `${DOMAIN}${path.startsWith("/") ? "" : "/"}${path}`;
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

const parseViews = (novel: Novel): number | undefined => {
  const raw = novel.views_number ?? novel.views;
  const value = raw == null ? NaN : Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

const formatCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
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

const ratingToUnit = (value?: number | null): number | undefined => {
  if (!value || !Number.isFinite(value)) return undefined;
  return Math.min(1, Math.max(0, value / 5));
};

const contentRatingForGenres = (genres: string[]): ContentRating => {
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
  novels.map((novel) => {
    // Native chapters are addressed by 1-based position, so the count is the
    // list length; fall back to total_chapters when the array is omitted.
    const listLength = novel.chapter_names?.length ?? 0;
    const chapterCount =
      listLength > 0
        ? listLength
        : parseInt(String(novel.total_chapters ?? "").replace(/\D/g, ""), 10) || 0;
    const date = novel.updated_at ? new Date(novel.updated_at) : undefined;
    const genres = parseGenres(novel);
    return {
      mangaId: encodeId(String(novel.id)),
      title: decodeText(novel.title),
      imageUrl: parseCoverUrl(novel),
      contentRating: contentRatingForGenres(genres),
      genres,
      author: decodeText(novel.author) || undefined,
      summary: cleanDescription(novel.description) || undefined,
      rating: novel.rating ?? undefined,
      views: parseViews(novel),
      chapterCount,
      publishDate: date && !Number.isNaN(date.getTime()) ? date : undefined,
    };
  });

export const filterAdultItems = <T extends { contentRating?: ContentRating }>(
  items: T[],
  hideAdult: boolean,
): T[] =>
  hideAdult ? items.filter((item) => item.contentRating === ContentRating.EVERYONE) : items;

export const toFeaturedItem = (
  item: NovelListItem,
  variant: "popular" | "editors",
): DiscoverSectionItem => {
  const ratingInfo =
    item.rating === undefined
      ? undefined
      : { symbol: "star.fill" as const, text: item.rating.toFixed(1) };
  const secondaryInfo =
    variant === "popular"
      ? item.author
        ? { symbol: "person.fill" as const, text: item.author }
        : undefined
      : item.views === undefined
        ? undefined
        : { symbol: "eye.fill" as const, text: formatCount(item.views) };
  const infoItems: FeaturedCarouselItem["infoItems"] =
    ratingInfo && secondaryInfo
      ? [ratingInfo, secondaryInfo]
      : ratingInfo
        ? [ratingInfo]
        : secondaryInfo
          ? [secondaryInfo]
          : undefined;
  return {
    type: "featuredCarouselItem",
    mangaId: item.mangaId,
    imageUrl: item.imageUrl,
    title: item.title,
    supertitle:
      variant === "editors" ? item.author : item.genres.slice(0, 3).join(", ") || undefined,
    summary: item.summary,
    infoItems,
    contentRating: item.contentRating,
  };
};

export const toCardItem = (
  item: NovelListItem,
  variant: "rating" | "chapters",
): DiscoverSectionItem => {
  const lead =
    variant === "chapters"
      ? item.chapterCount > 0
        ? `Ch. ${item.chapterCount}`
        : undefined
      : item.rating
        ? `★ ${item.rating.toFixed(1)}`
        : undefined;
  return {
    type: "simpleCarouselItem",
    mangaId: item.mangaId,
    imageUrl: item.imageUrl,
    title: item.title,
    subtitle:
      [lead, item.genres[0]].filter((value): value is string => Boolean(value)).join(" • ") ||
      undefined,
    contentRating: item.contentRating,
  };
};

export const toChapterUpdateItem = (item: NovelListItem): DiscoverSectionItem | undefined => {
  if (item.chapterCount <= 0) return undefined;
  return {
    type: "chapterUpdatesCarouselItem",
    mangaId: item.mangaId,
    chapterId: String(item.chapterCount),
    imageUrl: item.imageUrl,
    title: item.title,
    subtitle:
      [`Ch. ${item.chapterCount}`, item.author]
        .filter((value): value is string => Boolean(value))
        .join(" • ") || undefined,
    publishDate: item.publishDate,
    contentRating: item.contentRating,
  };
};

export const toGenreCarouselItems = (genres: Tag[]): DiscoverSectionItem[] =>
  genres.map((genre) => ({
    type: "genresCarouselItem",
    name: genre.title,
    searchQuery: {
      title: "",
      metadata: { genres: { [genre.id]: "included" } } satisfies SearchMetadata,
    },
    contentRating: contentRatingForGenres([decodeId(genre.id)]),
  }));

export const toSearchResultItem = (item: NovelListItem): SearchResultItem => ({
  mangaId: item.mangaId,
  title: item.title,
  imageUrl: item.imageUrl,
  subtitle:
    [item.rating ? `★ ${item.rating.toFixed(1)}` : undefined, item.genres[0]]
      .filter((value): value is string => Boolean(value))
      .join(" • ") || undefined,
  contentRating: item.contentRating,
});

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

  const percentage = ratingToUnit(novel.rating);
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
  (novel.chapter_names ?? []).map((rawName, index) => {
    const { chapNum, title } = cleanChapterName((rawName ?? "").trim());
    const chapterNumber = chapNum ?? index + 1;
    // Native reader IDs are 1-based positions even when the printed number differs.
    return {
      chapterId: String(index + 1),
      sourceManga,
      langCode: "en",
      chapNum: chapterNumber,
      title: title || `Chapter ${chapterNumber}`,
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
      title: title || `Chapter ${chapNum}`,
      version: displayName,
      volume: 0,
      sortingIndex: index,
    };
  });
};

export const mergeChapterVersions = (...lists: Chapter[][]): Chapter[] =>
  lists
    .flat()
    .sort((left, right) => (left.sortingIndex ?? 0) - (right.sortingIndex ?? 0))
    .map((chapter, sortingIndex) => ({ ...chapter, sortingIndex }));

// The reader parses chapters as XHTML, so escape content into closed tags.
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

// Mirror sources arrive as HTML; serialize through cheerio so the original
// structure survives instead of being flattened to plain text.
const htmlToXhtml = (html: string, heading: string): string => {
  const $ = cheerio.load(html, null, false);
  return wrapXhtml($.html({ xml: true }), $("h1, h2").length > 0 ? "" : heading);
};

export const parseChapterDetails = (
  response: ChapterDetailResponse,
  chapter: Chapter,
): ChapterDetails => {
  const content = (response.chapter?.content ?? response.content ?? "").trim();
  if (!content) {
    throw new Error(`No content returned for chapter ${chapter.chapterId}`);
  }
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
    const value = genre.value.trim();
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
    .map(([id]) => decodeId(id));
