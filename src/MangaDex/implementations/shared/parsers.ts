/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, type SourceManga, type Tag, type TagSection } from "@paperback/types";

import { getImageQualityEnding, ROMANIZED_CODES } from "./lookups";
import type {
  AltTitle,
  ChapterAttributes,
  DatumAttributes,
  Links,
  MangaDetailsResponse,
  MangaItem,
  Relationship,
  StatisticsResponse,
  Status,
} from "./models";
import { COVER_BASE_URL, MANGADEX_DOMAIN } from "./models";
import {
  getLanguagePriority,
  getMangaThumbnail,
  getNativeTitleDisplay,
  getRelevanceScoringEnabled,
  getRomanizedPriorityEnabled,
  getShowChapter,
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

export const contentRatingMap: Record<string, ContentRating> = {
  safe: ContentRating.EVERYONE,
  suggestive: ContentRating.MATURE,
  erotica: ContentRating.ADULT,
  pornographic: ContentRating.ADULT,
};

const statusIconMap: Record<string, string> = {
  completed: "✅",
  ongoing: "▶️",
  hiatus: "⏸️",
  cancelled: "❌",
};

// NBSP + ZWJ pair the renderer needs to push subtitle to line 2. Keeps card heights uniform.
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

// Empty string when no cover_art. Paperback then shows its built in placeholder.
export function extractCoverImageUrl(
  relationships: Relationship[] | undefined,
  mangaId: string,
  thumbnailQuality: string,
): string {
  const coverFileName = relationships?.find((x): x is Relationship => x?.type === "cover_art")
    ?.attributes?.fileName;
  if (!coverFileName) return "";
  return `${COVER_BASE_URL}/${mangaId}/${coverFileName}${getImageQualityEnding(thumbnailQuality)}`;
}

const ratingIconMap: Record<string, string> = {
  safe: "🟢",
  suggestive: "🟡",
  erotica: "🟠",
  pornographic: "🔞",
};

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
    ""
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

    // With chapterDetailsMap, a miss = filtered language. Do NOT fall back to the manga level.
    let chapterVolume: string | undefined;
    let chapterNumber: string | undefined;
    if (chapterDetailsMap) {
      const latestChapterId = manga.attributes.latestUploadedChapter;
      const latestChapterDetails = latestChapterId ? chapterDetailsMap[latestChapterId] : undefined;
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

    const rating = ratingJson?.statistics?.[mangaId]?.rating?.average
      ? (ratingJson.statistics[mangaId].rating.average * 10).toFixed(0) + "%"
      : "";

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
        // Unknown ratings default to ADULT, so new MangaDex values stay gated.
        contentRating:
          contentRatingMap[(mangaDetails.contentRating as string)?.toLowerCase() ?? ""] ??
          ContentRating.ADULT,
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
): SourceManga => {
  if (!json.data || !json.data.attributes) {
    throw new Error(`MangaDex returned no manga data for ${mangaId}`);
  }
  const mangaDetails: DatumAttributes = json.data.attributes;

  const mangaItemDetails = parseMangaItemDetails(mangaId, mangaDetails, settings);

  const joinCreditNames = (type: string): string | undefined =>
    json.data?.relationships
      ?.filter((x): x is Relationship => x?.type === type)
      .map((x) => x.attributes?.name)
      .filter(Boolean)
      .join(", ") || undefined;

  let author = joinCreditNames("author");
  let artist = joinCreditNames("artist");

  // Pass synopsis through unchanged so the update batch comparison matches, with no placeholder.
  let synopsis = mangaItemDetails.synopsis;

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
  const image = extractCoverImageUrl(json.data.relationships, mangaId, thumbnailQuality);

  const rating = ratingJson?.statistics?.[mangaId]?.rating?.average
    ? ratingJson.statistics[mangaId].rating.average / 10
    : undefined;

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
      // Raw rating for the chapter provider's gate. latestUploadedChapter omitted = null.
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
}

export function readMangaTitleSettings(): MangaDetailsSettings {
  return {
    titleLanguages: getTitleLanguages(),
    romanizedPriorityEnabled: getRomanizedPriorityEnabled(),
    languagePriority: getLanguagePriority(),
    nativeTitleDisplay: getNativeTitleDisplay(),
  };
}

// Adds mangaThumbnail for the cover URL build.
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

  const desc = decodeHTML(descriptionMatch).replace(/\[\/?[bus]]/g, "");

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

  let synopsis = desc;
  if (trackers.length > 0) {
    const trackingLine = `Tracking available for:\n${trackers.join("\n")}`;
    synopsis = synopsis ? `${synopsis}\n\n${trackingLine}` : trackingLine;
  }

  if (
    resolvedSettings.nativeTitleDisplay === "description" &&
    preferredLanguageTitle &&
    preferredLanguageTitle !== primaryTitle
  ) {
    synopsis = synopsis ? `${preferredLanguageTitle}\n\n${synopsis}` : preferredLanguageTitle;
  }

  const status = mangaDetails.status;

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
    // Default unknown ratings to ADULT (see parseMangaList for why).
    contentRating: contentRatingMap[rawContentRating] ?? ContentRating.ADULT,
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
  const title = attributes.title?.trim() || "";
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
