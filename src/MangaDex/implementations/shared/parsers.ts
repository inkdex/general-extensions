/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, type SourceManga, type Tag, type TagSection } from "@paperback/types";

import { getImageQualityEnding, RATINGS, ROMANIZED_CODES, STATUSES } from "./lookups";
import type {
  AggregateResponse,
  AltTitle,
  ChapterAttributes,
  ChapterData,
  CoverSearchResponse,
  DatumAttributes,
  Links,
  MangaDetailsResponse,
  MangaItem,
  Relationship,
  StatisticsResponse,
} from "./models";
import { COVER_BASE_URL, MANGADEX_DOMAIN, Status } from "./models";
import {
  getLanguagePriority,
  getMangaThumbnail,
  getNativeTitleDisplay,
  getRelevanceScoringEnabled,
  getRomanizedPriorityEnabled,
  getShowAltTitlesInSynopsis,
  getShowChapter,
  getShowFinalChapterInSynopsis,
  getShowRatingIcons,
  getShowSearchRatingInSubtitle,
  getShowStatusIcons,
  getShowVolume,
  getTitleLanguages,
} from "./state";
import { decodeHTML, precomputeQuery, relevanceScore } from "./utils";

type MangaItemWithAdditionalInfo = {
  mangaId: string;
  title: string;
  imageUrl: string;
  subtitle?: string;
  contentRating?: ContentRating;
};

type MangaItemDetails = {
  primaryTitle: string;
  preferredLanguageTitle?: string;
  secondaryTitles: string[];
  synopsis: string;
  status: Status;
  contentRating: ContentRating;
  // Raw rating preserved. Paperback's enum collapses erotica and pornographic into ADULT.
  mdContentRating: string;
  tagGroups: TagSection[];
  shareUrl: string;
};

// Derived from RATINGS so adding a MangaDex rating updates every consumer at once.
export const contentRatingMap: Record<string, ContentRating> = Object.fromEntries(
  RATINGS.map((r) => [r.enum, r.paperback]),
);

// Maps a lowercased MangaDex rating to Paperback's enum. Unknown values default
// to ADULT so a new MangaDex rating stays gated until it is explicitly mapped.
function resolvePaperbackRating(rawContentRating: string): ContentRating {
  return contentRatingMap[rawContentRating] ?? ContentRating.ADULT;
}

export const paperbackToMangaDexRatings: Record<ContentRating, string[]> = (() => {
  const out: Record<ContentRating, string[]> = {
    [ContentRating.EVERYONE]: [],
    [ContentRating.MATURE]: [],
    [ContentRating.ADULT]: [],
  };
  for (const r of RATINGS) {
    out[r.paperback].push(r.enum);
  }
  return out;
})();

const statusIconMap: Record<string, string> = Object.fromEntries(
  STATUSES.map((s) => [s.enum, s.icon]),
);

const ratingIconMap: Record<string, string> = Object.fromEntries(
  RATINGS.map((r) => [r.enum, r.icon]),
);

// Both metadata refresh paths in chapter-providing/main.ts must use this so the rule
// matches the /aggregate-based promotion in parseMangaItemDetails.
export function reconcileStoredCompletedStatus(
  apiStatus: Status,
  storedStatus: string | undefined,
): Status {
  if (apiStatus === Status.Completed && storedStatus === Status.PublishingFinished) {
    return Status.PublishingFinished;
  }
  return apiStatus;
}

// lastVolume limits the match so a title that resets chapter numbers cannot
// give a false positive. A null lastChapter returns false (cannot verify).
function aggregateContainsLastChapter(
  aggregate: AggregateResponse | undefined,
  lastChapter: string | null | undefined,
  lastVolume?: string | null,
): boolean {
  if (!lastChapter) return false;
  const allVolumes = Object.values(aggregate?.volumes ?? {});
  if (allVolumes.length === 0) return false;
  const candidates =
    lastVolume !== null && lastVolume !== undefined && lastVolume !== ""
      ? allVolumes.filter((v) => v.volume === lastVolume || v.volume === "none" || v.volume === "")
      : allVolumes;
  // hasOwnProperty.call avoids matches via Object.prototype.
  return candidates.some((v) =>
    Object.prototype.hasOwnProperty.call(v.chapters ?? {}, lastChapter),
  );
}

// 31 spaces + trailing ZWJ + subtitle to line 2. Keeps card heights uniform.
const ZWJ_PADDING = " ".repeat(30) + " ‍";

// Assertion function narrows json.data to T[] so the caller can use it directly.
export function assertDataArray<T>(
  json: { data?: unknown },
  contextLabel: string,
): asserts json is { data: T[] } {
  if (!Array.isArray(json.data)) {
    throw new Error(`Failed to load results for ${contextLabel}, check MangaDex status`);
  }
}

function buildCoverImageUrl(mangaId: string, fileName: string, thumbnailQuality: string): string {
  return `${COVER_BASE_URL}/${mangaId}/${fileName}${getImageQualityEnding(thumbnailQuality)}`;
}

// Empty string when no cover_art. Paperback then shows its built in placeholder.
function extractCoverImageUrl(
  relationships: Relationship[] | undefined,
  mangaId: string,
  thumbnailQuality: string,
): string {
  const coverFileName = relationships?.find((x): x is Relationship => x?.type === "cover_art")
    ?.attributes?.fileName;
  if (!coverFileName) return "";
  return buildCoverImageUrl(mangaId, coverFileName, thumbnailQuality);
}

// Build the full cover gallery URLs for MangaInfo.artworkUrls. Covers are sorted by
// numeric volume ascending with null/empty/non-numeric volumes last, so the gallery reads
// volume 1, 2, 3 rather than the API's null first, string sorted order. Returns undefined
// when there is nothing to show
export function buildArtworkUrls(
  mangaId: string,
  coverJson: CoverSearchResponse | undefined,
  quality: string,
): string[] | undefined {
  const covers = coverJson?.data;
  if (!Array.isArray(covers) || covers.length === 0) return undefined;
  const sorted = [...covers].sort((a, b) => {
    const av = parseFloat(a?.attributes?.volume ?? "");
    const bv = parseFloat(b?.attributes?.volume ?? "");
    const an = Number.isNaN(av);
    const bn = Number.isNaN(bv);
    if (an && bn) return 0;
    if (an) return 1;
    if (bn) return -1;
    return av - bv;
  });
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const cover of sorted) {
    const fileName = cover?.attributes?.fileName;
    if (!fileName) continue;
    const url = buildCoverImageUrl(mangaId, fileName, quality);
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }
  return urls.length > 0 ? urls : undefined;
}

// Returns the first manga relationship with a non-empty id, or undefined.
// Use this when the caller needs the relationship's attributes too, not just the id.
export function findMangaRelationship<T extends { id?: string; type?: string }>(
  relationships: ReadonlyArray<T | undefined | null> | undefined,
): T | undefined {
  if (!Array.isArray(relationships)) return undefined;
  for (const rel of relationships) {
    if (rel && rel.type === "manga" && typeof rel.id === "string" && rel.id.length > 0) {
      return rel;
    }
  }
  return undefined;
}

// Lowercases so caller comparisons stay stable across the call sites that
// walk chapter.relationships looking for a "manga" entry.
export function findMangaRelationshipId(
  relationships: ReadonlyArray<{ id?: string; type?: string } | undefined | null> | undefined,
): string | undefined {
  return findMangaRelationship(relationships)?.id?.toLowerCase();
}

// Returns every manga relationship in declared order. CustomList responses
// pack the curator's manga as relationships, so callers map .id to collect ids.
export function filterMangaRelationships<T extends { type?: string }>(
  relationships: ReadonlyArray<T | undefined | null> | undefined,
): T[] {
  if (!Array.isArray(relationships)) return [];
  return relationships.filter((r): r is T => !!r && r.type === "manga");
}

// Walks a chapter feed in source order, returning unique manga IDs and the
// first chapter seen for each
export function collectUniqueMangaIdsFromChapters(
  chapters: ReadonlyArray<ChapterData | undefined | null> | undefined,
): { ids: string[]; chapterByMangaId: Map<string, ChapterData> } {
  const chapterByMangaId = new Map<string, ChapterData>();
  const ids: string[] = [];
  if (!Array.isArray(chapters)) return { ids, chapterByMangaId };
  for (const chapter of chapters) {
    if (!chapter) continue;
    const mangaId = findMangaRelationshipId(chapter.relationships);
    if (!mangaId || chapterByMangaId.has(mangaId)) continue;
    chapterByMangaId.set(mangaId, chapter);
    ids.push(mangaId);
  }
  return { ids, chapterByMangaId };
}

const getFirstLanguageMatch = (
  values: Record<string, string | undefined> | undefined,
  languages: readonly string[],
): string | undefined => {
  if (!values) return undefined;
  for (const lang of languages) {
    const match = values[lang];
    if (match) return match;
  }
  return undefined;
};

const getFirstLanguageMatchFromAlt = (
  altTitles: AltTitle[] | undefined,
  languages: readonly string[],
): string | undefined => {
  if (!altTitles) return undefined;
  for (const lang of languages) {
    for (const alt of altTitles) {
      if (!alt || typeof alt !== "object") continue;
      const match = (alt as Record<string, string | undefined>)[lang];
      if (match) return match;
    }
  }
  return undefined;
};

const getFirstValue = (
  values: Record<string, string | undefined> | undefined,
): string | undefined => Object.values(values ?? {}).find((v) => v);

// Raw (undecoded) first truthy value across all alt titles. Last resort before
// the "Untitled" placeholder so a manga with only alt titles still gets a name.
const getFirstAltValue = (altTitles: AltTitle[] | undefined): string | undefined =>
  altTitles
    ?.filter((x): x is AltTitle => !!x && typeof x === "object")
    .flatMap((x) => Object.values(x))
    .find((v): v is string => typeof v === "string" && v.length > 0);

const flattenDecodedAltTitles = (altTitles: AltTitle[] | undefined): string[] =>
  altTitles
    ?.filter((x): x is AltTitle => !!x && typeof x === "object")
    .flatMap((x) => Object.values(x))
    .filter((v): v is string => typeof v === "string")
    .map(decodeHTML) ?? [];

// Title resolution: romanized opt in, then preferred languages, then any value. Raw, not decoded.
const resolvePrimaryTitleRaw = (
  title: Record<string, string | undefined> | undefined,
  altTitles: AltTitle[] | undefined,
  languages: readonly string[],
  romanizedEnabled: boolean,
): string => {
  const romanizedMatch = romanizedEnabled
    ? (getFirstLanguageMatch(title, ROMANIZED_CODES) ??
      getFirstLanguageMatchFromAlt(altTitles, ROMANIZED_CODES))
    : undefined;
  return (
    romanizedMatch ??
    getFirstLanguageMatch(title, languages) ??
    getFirstLanguageMatchFromAlt(altTitles, languages) ??
    getFirstValue(title) ??
    getFirstAltValue(altTitles) ??
    "Untitled"
  );
};

export const parseMangaList = (
  object: MangaItem[],
  thumbnailSelector: () => string,
  queryTitle?: string,
  ratingJson?: StatisticsResponse,
  chapterDetailsMap?: Record<string, ChapterAttributes>,
): MangaItemWithAdditionalInfo[] => {
  const results: { manga: MangaItemWithAdditionalInfo; relevance: number }[] = [];

  // Precompute once. relevanceScore runs for every manga and alt title.
  const precomputedQuery =
    queryTitle && getRelevanceScoringEnabled() ? precomputeQuery(queryTitle) : null;

  const thumbnailQuality = thumbnailSelector();
  const languages = getTitleLanguages();
  const romanizedPriorityEnabled = getRomanizedPriorityEnabled();
  const showStatusIcons = getShowStatusIcons();
  const showRatingIcons = getShowRatingIcons();
  const showChapter = getShowChapter();
  const showVolume = getShowVolume();
  const showSearchRatingInSubtitle = getShowSearchRatingInSubtitle();
  const relevanceScoringEnabled = getRelevanceScoringEnabled();

  for (const manga of object) {
    if (!manga || !manga.attributes) continue;
    const mangaId = manga.id;
    const mangaDetails = manga.attributes;
    const title = decodeHTML(
      resolvePrimaryTitleRaw(
        mangaDetails.title as Record<string, string | undefined>,
        mangaDetails.altTitles,
        languages,
        romanizedPriorityEnabled,
      ),
    );

    const image = extractCoverImageUrl(manga.relationships, mangaId, thumbnailQuality);

    const statusIcon = showStatusIcons
      ? statusIconMap[(mangaDetails.status as string)?.toLowerCase() ?? ""] || ""
      : "";
    const ratingIcon = showRatingIcons
      ? ratingIconMap[(mangaDetails.contentRating as string)?.toLowerCase() ?? ""] || ""
      : "";

    let chapterVolume: string | undefined;
    let chapterNumber: string | undefined;
    if (chapterDetailsMap) {
      const latestChapterId = manga.attributes.latestUploadedChapter;
      const latestChapterDetails = latestChapterId ? chapterDetailsMap[latestChapterId] : undefined;
      // A missing map entry (chapter deleted/withheld since the manga fetch) intentionally
      // leaves the subtitle blank. Do NOT fall back to the manga-level lastVolume/lastChapter
      // here, that would show a stale value.
      if (latestChapterDetails) {
        chapterVolume = latestChapterDetails.volume ?? undefined;
        chapterNumber = latestChapterDetails.chapter ?? undefined;
      }
    } else {
      chapterVolume = mangaDetails.lastVolume ?? undefined;
      chapterNumber = mangaDetails.lastChapter ?? undefined;
    }

    const chapterInfo = parseChapterTitle(
      { title: undefined, volume: chapterVolume, chapter: chapterNumber },
      { showVolume, showChapter, compact: showSearchRatingInSubtitle },
    );

    const averageRating = ratingJson?.statistics?.[mangaId]?.rating?.average;
    const rating = typeof averageRating === "number" ? (averageRating * 10).toFixed(0) + "%" : "";

    const iconPrefix = `${ratingIcon}${statusIcon}${rating}`;
    const subtitle = (iconPrefix ? `${iconPrefix} ${chapterInfo}` : chapterInfo).trim();

    let displayTitle = title;
    if (
      showChapter ||
      showVolume ||
      showRatingIcons ||
      showSearchRatingInSubtitle ||
      showStatusIcons ||
      (title.length > 0 && title.length < 35)
    ) {
      displayTitle += ZWJ_PADDING;
    }

    let relevance = 0;
    if (precomputedQuery) {
      // Score every alt title and take the max. Decode so encoded duplicates collapse.
      relevance = flattenDecodedAltTitles(mangaDetails.altTitles).reduce(
        (max, alt) => Math.max(max, relevanceScore(alt, precomputedQuery)),
        relevanceScore(title, precomputedQuery),
      );
    }

    results.push({
      manga: {
        mangaId: mangaId,
        title: displayTitle,
        imageUrl: image,
        subtitle: subtitle,
        contentRating: resolvePaperbackRating(
          (mangaDetails.contentRating as string)?.toLowerCase() ?? "",
        ),
      },
      relevance: relevance,
    });
  }

  if (queryTitle && relevanceScoringEnabled) {
    results.sort((a, b) => b.relevance - a.relevance);
  }
  return results.map((r) => r.manga);
};

export const parseMangaDetails = (
  mangaId: string,
  json: MangaDetailsResponse,
  ratingJson?: StatisticsResponse,
  settings?: MangaDetailsSettings,
  aggregate?: AggregateResponse,
  // When set, replaces the default cover_art relationship's fileName.
  coverFileNameOverride?: string,
  artworkUrls?: string[],
): SourceManga => {
  if (!json.data || !json.data.attributes) {
    throw new Error(`MangaDex returned no manga data for ${mangaId}`);
  }
  const mangaDetails: DatumAttributes = json.data.attributes;

  const mangaItemDetails = parseMangaItemDetails(mangaId, mangaDetails, settings, aggregate);

  const joinCreditNames = (type: string): string | undefined =>
    json.data?.relationships
      ?.filter((x): x is Relationship => x?.type === type)
      .map((x) => x.attributes?.name)
      .filter(Boolean)
      .join(", ") || undefined;

  let author = joinCreditNames("author");
  let artist = joinCreditNames("artist");

  // Pass synopsis through unchanged so the update batch comparison matches, with no placeholder.
  const synopsis = mangaItemDetails.synopsis;

  const nativeTitleDisplay = settings?.nativeTitleDisplay ?? getNativeTitleDisplay();
  const preferredTitle = mangaItemDetails.preferredLanguageTitle;
  if (preferredTitle && preferredTitle !== mangaItemDetails.primaryTitle) {
    if (nativeTitleDisplay === "author") {
      author = preferredTitle;
      artist = undefined;
    } else if (nativeTitleDisplay === "author_desc") {
      const credits: string[] = [];
      if (author) credits.push(author);
      if (artist && artist !== author) credits.push(artist);
      const suffix = credits.length > 0 ? ` (${credits.join(", ")})` : "";
      author = `${preferredTitle}${suffix}`;
      artist = undefined;
    }
  }

  const thumbnailQuality = settings?.mangaThumbnail ?? getMangaThumbnail();
  const image = coverFileNameOverride
    ? buildCoverImageUrl(mangaId, coverFileNameOverride, thumbnailQuality)
    : extractCoverImageUrl(json.data.relationships, mangaId, thumbnailQuality);

  const averageRating = ratingJson?.statistics?.[mangaId]?.rating?.average;
  const rating = typeof averageRating === "number" ? averageRating / 10 : undefined;

  return {
    mangaId: mangaId,
    mangaInfo: {
      primaryTitle: mangaItemDetails.primaryTitle,
      secondaryTitles: mangaItemDetails.secondaryTitles,
      thumbnailUrl: image,
      author,
      artist,
      synopsis,
      status: mangaItemDetails.status,
      tagGroups: mangaItemDetails.tagGroups,
      contentRating: mangaItemDetails.contentRating,
      shareUrl: mangaItemDetails.shareUrl,
      rating,
      artworkUrls,
      // Raw rating for the chapter provider's rating check. latestUploadedChapter omitted = null.
      additionalInfo: mangaDetails.latestUploadedChapter
        ? {
            mdContentRating: mangaItemDetails.mdContentRating,
            latestUploadedChapter: mangaDetails.latestUploadedChapter,
          }
        : { mdContentRating: mangaItemDetails.mdContentRating },
    },
  };
};

// mangaThumbnail is optional, only readMangaDetailsSettings() populates it (used for cover URL build).
export interface MangaDetailsSettings {
  titleLanguages: readonly string[];
  romanizedPriorityEnabled: boolean;
  languagePriority: readonly string[];
  nativeTitleDisplay: string;
  mangaThumbnail?: string;
  showAltTitlesInSynopsis?: boolean;
  showFinalChapterInSynopsis?: boolean;
}

export function readMangaTitleSettings(): MangaDetailsSettings {
  return {
    titleLanguages: getTitleLanguages(),
    romanizedPriorityEnabled: getRomanizedPriorityEnabled(),
    languagePriority: getLanguagePriority(),
    nativeTitleDisplay: getNativeTitleDisplay(),
    showAltTitlesInSynopsis: getShowAltTitlesInSynopsis(),
    showFinalChapterInSynopsis: getShowFinalChapterInSynopsis(),
  };
}

export function readMangaDetailsSettings(): MangaDetailsSettings {
  return {
    ...readMangaTitleSettings(),
    mangaThumbnail: getMangaThumbnail(),
  };
}

export function parseMangaItemDetails(
  mangaId: string,
  mangaDetails: DatumAttributes,
  settings?: MangaDetailsSettings,
  aggregate?: AggregateResponse,
): MangaItemDetails {
  const resolvedSettings = settings ?? readMangaTitleSettings();
  const languages = resolvedSettings.titleLanguages;

  const primaryTitle: string = decodeHTML(
    resolvePrimaryTitleRaw(
      mangaDetails.title as Record<string, string | undefined>,
      mangaDetails.altTitles,
      languages,
      resolvedSettings.romanizedPriorityEnabled,
    ),
  );

  const priorityLanguages = resolvedSettings.languagePriority;
  const preferredMatch =
    getFirstLanguageMatch(
      mangaDetails.title as Record<string, string | undefined>,
      priorityLanguages,
    ) ?? getFirstLanguageMatchFromAlt(mangaDetails.altTitles, priorityLanguages);
  const preferredLanguageTitle = preferredMatch ? decodeHTML(preferredMatch) : undefined;

  // Decode before dedup. Encoded duplicates of the primary title would survive otherwise.
  const secondaryTitles: string[] = Array.from(
    new Set(flattenDecodedAltTitles(mangaDetails.altTitles).filter((v) => v !== primaryTitle)),
  );

  const description = mangaDetails.description as Record<string, string | undefined> | undefined;
  const descriptionMatch = getFirstLanguageMatch(description, languages) ?? description?.en ?? "";

  // The bounded [^\][]* (not [^\]]*) stops an attribute value at the next bracket, so the
  // regex runs in linear time. The unbounded form backtracks badly and can hang the host JS
  // thread (a ReDoS) on a description full of unclosed tag openers like "[a=[a=[a=".
  const desc = decodeHTML(descriptionMatch).replace(
    /\[\/?(?:[a-z][a-z0-9]*|\*)(?:=[^\][]*)?\]/gi,
    "",
  );

  const links = mangaDetails.links as Links | undefined;
  const trackers = (
    [
      ["al", "AniList"],
      ["mu", "MangaUpdates"],
      ["mal", "MyAnimeList"],
    ] as const
  )
    .filter(([key]) => Boolean(links?.[key]))
    .map(([, name]) => name);

  // Array order is the display order seen by the user.
  const synopsisParts: string[] = [];

  if (resolvedSettings.showAltTitlesInSynopsis && secondaryTitles.length > 0) {
    // Drop the preferred title if it is already shown standalone below.
    const altsToShow =
      resolvedSettings.nativeTitleDisplay === "description" && preferredLanguageTitle
        ? secondaryTitles.filter((t) => t !== preferredLanguageTitle)
        : secondaryTitles;
    if (altsToShow.length > 0) {
      synopsisParts.push(`Alternative Titles:\n${altsToShow.join("\n")}`);
    }
  }

  if (
    resolvedSettings.nativeTitleDisplay === "description" &&
    preferredLanguageTitle &&
    preferredLanguageTitle !== primaryTitle
  ) {
    synopsisParts.push(preferredLanguageTitle);
  }

  if (desc) synopsisParts.push(desc);

  if (trackers.length > 0) {
    synopsisParts.push(`Tracking available for:\n${trackers.join("\n")}`);
  }

  if (resolvedSettings.showFinalChapterInSynopsis && mangaDetails.status === Status.Completed) {
    const tags: string[] = [];
    const lastVol = mangaDetails.lastVolume?.trim();
    const lastCh = mangaDetails.lastChapter?.trim();
    if (lastVol) tags.push(`Vol.${lastVol}`);
    if (lastCh) tags.push(`Ch.${lastCh}`);
    if (tags.length > 0) synopsisParts.push(`Final: ${tags.join(" ")}`);
  }

  const synopsis = synopsisParts.join("\n\n");

  // completed becomes publishing_finished when /aggregate disagrees.
  const status: Status =
    mangaDetails.status === Status.Completed &&
    aggregate !== undefined &&
    !aggregateContainsLastChapter(aggregate, mangaDetails.lastChapter, mangaDetails.lastVolume)
      ? Status.PublishingFinished
      : mangaDetails.status;

  // Group by MangaDex category (format, genre, theme, content). Unknown becomes "Tags".
  const tagsByGroup = new Map<string, Tag[]>();
  for (const apiTag of mangaDetails.tags ?? []) {
    const groupId = apiTag.attributes?.group ?? "tags";
    let groupTags = tagsByGroup.get(groupId);
    if (!groupTags) {
      groupTags = [];
      tagsByGroup.set(groupId, groupTags);
    }
    groupTags.push({
      id: apiTag.id,
      title: apiTag.attributes?.name?.en ?? "Unknown",
    });
  }
  const tagGroups: TagSection[] = Array.from(tagsByGroup.entries())
    .map(([groupId, groupTags]) => {
      groupTags.sort((a, b) => a.title.localeCompare(b.title));
      const title =
        groupId === "tags" ? "Tags" : groupId.charAt(0).toUpperCase() + groupId.slice(1);
      return { id: groupId, title, tags: groupTags };
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const rawContentRating = (mangaDetails.contentRating as string)?.toLowerCase() ?? "";
  return {
    primaryTitle,
    preferredLanguageTitle,
    secondaryTitles,
    synopsis,
    status,
    tagGroups,
    contentRating: resolvePaperbackRating(rawContentRating),
    mdContentRating: rawContentRating,
    shareUrl: `${MANGADEX_DOMAIN}/title/${mangaId}`,
  };
}

export interface ChapterTitleOptions {
  showVolume?: boolean;
  showChapter?: boolean;
  // Shortens "Vol."/"Ch." to "V."/"C." so busy subtitles still fit on one row.
  compact?: boolean;
}

export function parseChapterTitle(
  attributes: Partial<ChapterAttributes>,
  options?: ChapterTitleOptions,
): string {
  const title = decodeHTML(attributes.title?.trim() || "");
  const showVolume = options?.showVolume ?? getShowVolume();
  const showChapter = options?.showChapter ?? getShowChapter();
  const compact = options?.compact ?? getShowSearchRatingInSubtitle();

  const volumePrefix = compact ? "V." : "Vol.";
  const chapterPrefix = compact ? "C." : "Ch.";
  const volume = showVolume && attributes.volume ? `${volumePrefix} ${attributes.volume} ` : "";
  const chapter = showChapter && attributes.chapter ? `${chapterPrefix} ${attributes.chapter}` : "";
  const prefix = `${volume}${chapter}`.trim();

  // Only emit " - " when a prefix exists. Otherwise "- Title" leaks for titled chapters.
  if (prefix && title) return `${prefix} - ${title}`;
  return prefix || title;
}
