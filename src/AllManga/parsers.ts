/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type SearchResultItem,
  type SourceManga,
  type Tag,
} from "@paperback/types";

import {
  DEFAULT_IMAGE_SERVER,
  genreId,
  IMAGE_CDN,
  THUMBNAIL_CDN,
  type ChaptersData,
  type DateParts,
  type EpisodeInfo,
  type MangaCard,
  type MangaDetail,
  type PagesData,
  type PictureUrl,
} from "./models";

const ABSOLUTE_URL_REGEX = /^https?:\/\//;

export function parseThumbnailUrl(thumb?: string | null): string {
  const trimmed = thumb?.trim();
  if (!trimmed) return `${THUMBNAIL_CDN}?w=250`;
  if (ABSOLUTE_URL_REGEX.test(trimmed)) return trimmed;
  return `${THUMBNAIL_CDN}${trimmed.replace(/^\//, "")}?w=250`;
}

function contentRatingForGenres(genres: string[]): ContentRating {
  const lower = genres.map((g) => g.trim().toLowerCase());
  if (lower.some((g) => g === "adult" || g === "hentai" || g === "smut" || g === "yaoi")) {
    return ContentRating.ADULT;
  }
  if (lower.some((g) => g === "ecchi" || g === "mature")) return ContentRating.MATURE;
  return ContentRating.EVERYONE;
}

function parseStatus(status?: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (s.includes("releasing") || s.includes("ongoing")) return "Ongoing";
  if (s.includes("finished") || s.includes("completed")) return "Completed";
  if (s.includes("hiatus")) return "Hiatus";
  if (s.includes("cancel")) return "Cancelled";
  return "Unknown";
}

function extractTextFromHtml(html: string): string {
  if (!html) return "";
  return Application.decodeHTMLEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .trim(),
  );
}

export function formatCount(value: string | number): string {
  const n = typeof value === "number" ? value : parseInt(value, 10);
  if (!Number.isFinite(n)) return String(value);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function dateFromParts(parts?: DateParts | null): Date | undefined {
  if (!parts || parts.year == null) return undefined;
  const date = new Date(
    parts.year,
    parts.month ?? 0,
    parts.date ?? 1,
    parts.hour ?? 0,
    parts.minute ?? 0,
    parts.second ?? 0,
  );
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function applyImageQuality(url: string, quality: string): string {
  if (quality === "original") return url;
  const match = url.match(/^https?:\/\/([^#]+)/);
  if (!match) return url;
  return `${IMAGE_CDN}/${match[1]}?w=${quality}`;
}

export function toSearchResultItem(
  card: MangaCard,
  contentRating: ContentRating,
): SearchResultItem {
  return {
    mangaId: card._id,
    title: Application.decodeHTMLEntities(card.englishName || card.name),
    imageUrl: parseThumbnailUrl(card.thumbnail),
    contentRating,
  };
}

export function parseMangaDetails(mangaId: string, detail: MangaDetail): SourceManga {
  const primaryTitle = Application.decodeHTMLEntities(detail.englishName || detail.name);

  const secondaryTitles = new Set<string>();
  if (detail.englishName && detail.name && detail.englishName !== detail.name) {
    secondaryTitles.add(Application.decodeHTMLEntities(detail.name));
  }
  for (const alt of detail.altNames ?? []) {
    const trimmed = alt.trim();
    if (trimmed) secondaryTitles.add(Application.decodeHTMLEntities(trimmed));
  }

  const genreNames = [...(detail.genres ?? []), ...(detail.tags ?? [])]
    .map((g) => g.trim())
    .filter((g) => g.length > 0);
  const seen = new Set<string>();
  const tags: Tag[] = [];
  for (const name of genreNames) {
    const id = genreId(name);
    if (seen.has(id)) continue;
    seen.add(id);
    tags.push({ id, title: name });
  }

  const author = detail.authors?.[0]?.trim() || undefined;
  const contentRating = contentRatingForGenres(genreNames);

  return {
    mangaId,
    mangaInfo: {
      primaryTitle,
      secondaryTitles: [...secondaryTitles],
      thumbnailUrl: parseThumbnailUrl(detail.thumbnail),
      synopsis: extractTextFromHtml(detail.description ?? ""),
      author,
      artist: author,
      status: parseStatus(detail.status),
      contentRating,
      tagGroups: tags.length > 0 ? [{ id: "genres", title: "Genres", tags }] : [],
      shareUrl: `https://allmanga.to/manga/${mangaId}`,
    },
  };
}

export function parseChapters(sourceManga: SourceManga, data: ChaptersData): Chapter[] {
  const sub = data.manga.availableChaptersDetail?.sub ?? [];

  const infoByNum = new Map<string, EpisodeInfo>();
  for (const info of data.episodeInfos ?? []) {
    infoByNum.set(String(info.episodeIdNum), info);
  }

  const chapters = sub.map((num) => {
    const info = infoByNum.get(num);
    const notes = info?.notes?.trim() ?? "";
    const title = notes && !/\d/.test(notes) ? Application.decodeHTMLEntities(notes) : "";
    const rawDate = info?.uploadDates?.sub;
    const publishDate = rawDate ? new Date(rawDate) : undefined;

    return {
      chapterId: num,
      sourceManga,
      title,
      chapNum: parseFloat(num) || 0,
      volume: 0,
      langCode: "en",
      publishDate: publishDate && !isNaN(publishDate.getTime()) ? publishDate : undefined,
    };
  });

  chapters.sort((a, b) => a.chapNum - b.chapNum);
  return chapters.map((chapter, index) => ({ ...chapter, sortingIndex: index }));
}

function pictureUrlOf(entry: PictureUrl): string | undefined {
  return typeof entry === "string" ? entry : (entry?.url ?? undefined);
}

export function parsePageUrls(data: PagesData, quality: string): string[] {
  const edges = data.chapterPages?.edges ?? [];
  if (edges.length === 0) return [];

  const edge =
    edges.find((e) => {
      const hasAbsolute = (e.pictureUrls ?? []).some((p) => {
        const url = pictureUrlOf(p);
        return url != null && ABSOLUTE_URL_REGEX.test(url);
      });
      return hasAbsolute || e.pictureUrlHead != null;
    }) ?? edges[0];

  const server = edge.pictureUrlHead;
  const imageDomain = server
    ? ABSOLUTE_URL_REGEX.test(server)
      ? `${server.replace(/\/$/, "")}/`
      : `https://${server.replace(/\/$/, "")}/`
    : DEFAULT_IMAGE_SERVER;

  return (edge.pictureUrls ?? [])
    .map(pictureUrlOf)
    .filter((url): url is string => typeof url === "string" && url.length > 0)
    .map((url) => (ABSOLUTE_URL_REGEX.test(url) ? url : imageDomain + url.replace(/^\//, "")))
    .map((url) => applyImageQuality(url, quality));
}
