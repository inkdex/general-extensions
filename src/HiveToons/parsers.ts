/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type SourceManga,
  type Tag,
} from "@paperback/types";
import * as cheerio from "cheerio";

import {
  DOMAIN,
  type HiveToonsChapter,
  type HiveToonsChapterData,
  type HiveToonsPost,
  type MangaListItem,
} from "./models";

export const encodeMangaId = (slug: string): string =>
  encodeURIComponent(slug).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );

export const decodeMangaId = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const normalizeSearchTerm = (term: string): string =>
  term
    .trim()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ");

const isNovel = (post: Pick<HiveToonsPost, "isNovel" | "seriesType">): boolean =>
  post.isNovel === true || (post.seriesType ?? "").toUpperCase() === "NOVEL";

const mapStatus = (status?: string | null): string => {
  switch ((status ?? "").toUpperCase()) {
    case "ONGOING":
    case "COMING_SOON":
      return "Ongoing";
    case "HIATUS":
      return "Hiatus";
    case "COMPLETED":
    case "MASS_RELEASED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "DROPPED":
      return "Dropped";
    default:
      return "Unknown";
  }
};

const formatSeriesSubtitle = (type?: string | null, status?: string | null): string =>
  [type, status]
    .filter((value): value is string => Boolean(value))
    .map((value) =>
      value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .join(" • ");

const normalizeCreatorName = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const cleaned = value.trim();
  if (!cleaned || cleaned === "-" || cleaned.toLowerCase() === "n/a") return undefined;

  const normalized = cleaned
    .replace(/\s+/g, " ")
    .replace(/[,\s]+$/, "")
    .trim();

  if (!normalized || /^(?:update|updating|tba|unknown)$/i.test(normalized)) {
    return undefined;
  }

  return normalized;
};

export const contentRatingForGenres = (genreNames: string[]): ContentRating => {
  const normalized = genreNames.map((name) => name.trim().toLowerCase());
  if (
    normalized.some(
      (name) =>
        name === "adult" ||
        name === "hentai" ||
        name === "shotacon" ||
        name === "smut" ||
        name === "yaoi",
    )
  ) {
    return ContentRating.ADULT;
  }
  if (normalized.some((name) => name === "ecchi" || name === "mature")) {
    return ContentRating.MATURE;
  }
  return ContentRating.EVERYONE;
};

const contentRatingForPost = (post: Pick<HiveToonsPost, "genres">): ContentRating => {
  return contentRatingForGenres((post.genres ?? []).map((genre) => genre.name));
};

const stripHtml = (html: string): string => {
  if (!html) return "";
  return Application.decodeHTMLEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .trim(),
  );
};

export const parseMangaList = (posts: HiveToonsPost[]): MangaListItem[] =>
  posts.map((post) => {
    const novel = isNovel(post);
    const latestChapter = post.chapters?.find((chapter) => chapter.isAccessible === true);
    const subtitle = [
      latestChapter ? `Ch. ${latestChapter.number}` : undefined,
      post.averageRating == null ? undefined : `★ ${post.averageRating}`,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" • ");
    const timestamp = latestChapter
      ? (post.lastChapterAddedAt ?? latestChapter.updatedAt ?? latestChapter.createdAt)
      : undefined;
    const publishDate = timestamp ? new Date(timestamp) : undefined;
    const status = mapStatus(post.seriesStatus);

    return {
      mangaId: encodeMangaId(post.slug),
      title: Application.decodeHTMLEntities(post.postTitle),
      imageUrl: post.featuredImage ?? "",
      subtitle: subtitle || formatSeriesSubtitle(post.seriesType, post.seriesStatus),
      summary: stripHtml(post.postContent ?? "") || undefined,
      author:
        normalizeCreatorName(post.author) ?? (formatSeriesSubtitle(post.seriesType) || undefined),
      rating: post.averageRating ?? undefined,
      status: status === "Unknown" ? undefined : status,
      contentRating: contentRatingForPost(post),
      latestChapterId: latestChapter?.id.toString(),
      publishDate: publishDate && !Number.isNaN(publishDate.getTime()) ? publishDate : undefined,
      isNovel: novel,
    };
  });

export const parseMangaDetails = (post: HiveToonsPost): SourceManga => {
  const primaryTitle = Application.decodeHTMLEntities(post.postTitle);
  const seriesType = post.seriesType?.toLowerCase();
  const genreNames = [
    seriesType && ["manga", "manhua", "manhwa", "novel"].includes(seriesType)
      ? seriesType.replace(/^\w/, (character) => character.toUpperCase())
      : undefined,
    ...(post.genres ?? []).map((genre) => genre.name),
  ].filter((name): name is string => Boolean(name));
  const uniqueGenres = [...new Set(genreNames)];

  const secondaryTitles: string[] = [];
  const seenTitles = new Set([primaryTitle.trim().toLowerCase()]);
  for (const rawTitle of post.alternativeTitles?.split(/\s*[/\n|]\s*/) ?? []) {
    const title = Application.decodeHTMLEntities(rawTitle.trim());
    const normalized = title.toLowerCase();
    if (!title || seenTitles.has(normalized)) continue;
    seenTitles.add(normalized);
    secondaryTitles.push(title);
  }

  const tags: Tag[] = uniqueGenres.map((name) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    title: name,
  }));

  return {
    mangaId: encodeMangaId(post.slug),
    mangaInfo: {
      primaryTitle,
      secondaryTitles,
      thumbnailUrl: post.featuredImage ?? "",
      synopsis: stripHtml(post.postContent ?? ""),
      author: normalizeCreatorName(post.author),
      artist: normalizeCreatorName(post.artist),
      status: mapStatus(post.seriesStatus),
      rating:
        post.averageRating == null || !Number.isFinite(post.averageRating)
          ? undefined
          : Math.min(1, Math.max(0, post.averageRating / 10)),
      contentRating: contentRatingForPost(post),
      contentType: isNovel(post) ? "novel" : "comic",
      tagGroups: tags.length > 0 ? [{ id: "genres", title: "Genres", tags }] : [],
      shareUrl: `${DOMAIN}/series/${post.slug}`,
    },
  };
};

const chapterNumber = (chapter: HiveToonsChapter): number => {
  return typeof chapter.number === "number"
    ? chapter.number
    : parseFloat(String(chapter.number)) || 0;
};

const chapterIsLocked = (chapter: HiveToonsChapter): boolean =>
  chapter.isLocked === true || chapter.isPermanentlyLocked === true || (chapter.price ?? 0) > 0;

export const parseChapterList = (
  chapters: HiveToonsChapter[],
  sourceManga: SourceManga,
  showLocked: boolean,
): Chapter[] => {
  const visible = chapters.filter((chapter) => {
    if (chapter.chapterStatus && chapter.chapterStatus !== "PUBLIC") return false;
    return !chapterIsLocked(chapter) || showLocked;
  });

  const sorted = [...visible].sort((a, b) => {
    const diff = chapterNumber(a) - chapterNumber(b);
    if (diff !== 0) return diff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return sorted.map((chapter, index) => {
    const realTitle = chapter.title?.trim() ?? "";
    const title = chapterIsLocked(chapter) ? `🔒 ${realTitle}`.trim() : realTitle;

    return {
      chapterId: chapter.id.toString(),
      sourceManga,
      title,
      chapNum: chapterNumber(chapter),
      volume: 0,
      langCode: "en",
      sortingIndex: index,
      publishDate: new Date(chapter.createdAt),
    };
  });
};

export const parseChapterDetails = (
  data: HiveToonsChapterData,
  chapter: Chapter,
): ChapterDetails => {
  if (data.isShortLinkLocked) throw new Error("Chapter locked (short link).");
  if (data.isLockedByCoins) throw new Error("Chapter locked — coins required to unlock.");
  if (data.isPermanentlyLocked) throw new Error("Chapter permanently locked.");

  const content = data.content?.trim();
  if (content) {
    const body = cheerio.load(content, null, false).html({ xml: true });
    return {
      type: "html",
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      html: `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${body}</body></html>`,
    };
  }

  const pages = [...(data.images ?? [])]
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map((image) => image.url.replace(/ /g, "%20"))
    .filter((url) => url.length > 0);

  if (pages.length === 0) {
    throw new Error("No chapter content was returned by HiveToons.");
  }

  return {
    id: chapter.chapterId,
    mangaId: chapter.sourceManga.mangaId,
    pages,
  };
};
