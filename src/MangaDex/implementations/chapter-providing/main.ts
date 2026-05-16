/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  Chapter,
  ChapterDetails,
  MangaInfo,
  SourceManga,
  UpdateManager,
} from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { getMangaDetails } from "../manga/main";
import { MDLanguages } from "../shared/languages";
import { resolveChapterId, resolveMangaId, resolveMangaIds } from "../shared/legacy";
import type {
  ChapterDetailsResponse,
  ChapterRelationship,
  ChapterResponse,
  DatumAttributes,
  MangaDetailsResponse,
  SearchResponse,
} from "../shared/models";
import {
  assertDataArray,
  findMangaRelationship,
  parseMangaItemDetails,
  readMangaTitleSettings,
  reconcileStoredCompletedStatus,
  type MangaDetailsSettings,
} from "../shared/parsers";
import {
  getBlockedGroups,
  getBlockedUploaders,
  getDataSaver,
  getForcePort443,
  getFuzzyBlockingEnabled,
  getGroupBlockingEnabled,
  getIncludeUnavailable,
  getLanguages,
  getMetadataUpdater,
  getOptimizeUpdates,
  getRatings,
  getSkipNewChapters,
  getSkipPublicationStatus,
  getSkipSameChapter,
  getSkipUnreadChapters,
  getUpdateBatchSize,
} from "../shared/state";
import {
  buildAtHomeServerUrl,
  buildMangaByIdUrl,
  buildMangaFeedUrl,
  buildMangaListUrl,
} from "../shared/urls";
import {
  FEED_PAGE_LIMIT,
  MAX_API_OFFSET,
  decodeHTML,
  formatPublishAtSince,
  isNotFoundError,
  parseDateOrUndefined,
  precomputeQuery,
  shouldSkipByCount,
} from "../shared/utils";
import {
  assignChapterNumber,
  buildChapterIdentifier,
  extractScanlationGroupNames,
  normalizePagesCount,
} from "./parsers";
import { isGroupNameBlocked, isRatingAllowed } from "./utils";

async function fetchLatestUploadedChapter(mangaId: string): Promise<string | null> {
  const json = await fetchJSON<MangaDetailsResponse>({
    url: buildMangaByIdUrl(mangaId).toString(),
    method: "GET",
  });
  return json.data?.attributes?.latestUploadedChapter ?? null;
}

type InlinedMangaAttributes = DatumAttributes & {
  tags?: unknown;
  latestUploadedChapter?: string;
};

// The first feed page inlines the full manga entity into the "manga"
// relationship slot so the cast is guarded.
function readInlinedMangaItem(
  rel: ChapterRelationship | undefined,
): { id: string; attributes: InlinedMangaAttributes } | undefined {
  if (!rel || typeof rel.id !== "string" || !rel.attributes || typeof rel.attributes !== "object") {
    return undefined;
  }
  return { id: rel.id, attributes: rel.attributes as unknown as InlinedMangaAttributes };
}

export async function getChapters(
  sourceManga: SourceManga,
  sinceDate?: Date,
  skipMetadataUpdate: boolean = false,
): Promise<Chapter[]> {
  // Update in place so the Chapter[] points at the current UUID, not a stale legacy id.
  const mangaId = await resolveMangaId(sourceManga.mangaId);
  if (sourceManga.mangaId !== mangaId) {
    sourceManga.mangaId = mangaId;
  }

  if (!sourceManga.mangaInfo) {
    sourceManga.mangaInfo = {} as MangaInfo;
  }
  if (!sourceManga.mangaInfo.additionalInfo) {
    sourceManga.mangaInfo.additionalInfo = {};
  }

  const metadataUpdaterEnabled = !skipMetadataUpdate && getMetadataUpdater();
  const needsFullRefresh =
    metadataUpdaterEnabled ||
    !sourceManga.mangaInfo.status ||
    !sourceManga.mangaInfo.contentRating ||
    !sourceManga.mangaInfo.shareUrl;
  let mangaDetailsFreshlyFetched = false;
  if (needsFullRefresh) {
    // parseMangaDetails omits latestUploadedChapter when no chapters exist, so delete to sync.
    const previousAdditionalInfo = sourceManga.mangaInfo?.additionalInfo;
    const updatedManga = await getMangaDetails(mangaId);
    sourceManga.mangaInfo = updatedManga.mangaInfo;
    const mergedAdditionalInfo: Record<string, string> = {
      ...previousAdditionalInfo,
      ...updatedManga.mangaInfo.additionalInfo,
    };
    if (
      updatedManga.mangaInfo.additionalInfo &&
      !("latestUploadedChapter" in updatedManga.mangaInfo.additionalInfo)
    ) {
      delete mergedAdditionalInfo.latestUploadedChapter;
    }
    sourceManga.mangaInfo.additionalInfo = mergedAdditionalInfo;
    mangaDetailsFreshlyFetched = true;
  }

  const languages: string[] = getLanguages();
  const languageSet = new Set(languages);
  const skipSameChapter = getSkipSameChapter();
  const ratings: string[] = getRatings();

  // Deferred so we can first refresh mdContentRating from the inline manga relationship.
  let ratingGateEvaluated = false;
  const evaluateRatingGate = (): void => {
    if (ratingGateEvaluated) return;
    ratingGateEvaluated = true;
    const storedMdRating = sourceManga.mangaInfo.additionalInfo?.mdContentRating as
      | string
      | undefined;
    const mangaPbRating = sourceManga.mangaInfo.contentRating;
    if (!isRatingAllowed(storedMdRating, mangaPbRating, ratings)) {
      const ratingForMessage = storedMdRating ?? mangaPbRating;
      throw new Error(
        `Content rating (${ratingForMessage}) not enabled in source settings (if it shows UNKNOWN, open the manga again).`,
      );
    }
  };
  const optimizeUpdates = getOptimizeUpdates();
  const willRefreshInlineMetadata = !needsFullRefresh && optimizeUpdates;
  if (!willRefreshInlineMetadata) {
    evaluateRatingGate();
  }

  const groupBlockingEnabled = getGroupBlockingEnabled();
  const fuzzyBlockingEnabled = getFuzzyBlockingEnabled();
  const blockedGroupsData = groupBlockingEnabled ? (getBlockedGroups() ?? {}) : {};
  const blockedGroups = Object.keys(blockedGroupsData);
  const blockedUploaders = getBlockedUploaders();
  const includeUnavailable = getIncludeUnavailable();
  // Precompute queries once. The .length value doubles as the "feature off" check inside the loop.
  const blockedGroupQueries =
    groupBlockingEnabled && fuzzyBlockingEnabled
      ? blockedGroups
          .map((id) => blockedGroupsData[id]?.attributes?.name)
          .filter((name): name is string => !!name)
          .map((name) => precomputeQuery(name))
      : [];
  const groupBlockCache = new Map<string, boolean>();
  const collectedChapters: Set<string> | null = skipSameChapter ? new Set<string>() : null;
  const chapters: Chapter[] = [];

  let offset = 0;
  let hasResults = true;
  let prevChapNum = 0;
  // Synthetic suffix for unnumbered chapters. Avoids collisions with fractionals.
  let unnumberedIndex = 0;
  // Paperback sorts on volume when any chapter has one, so a single volume tagged chapter
  // floats above the volume-null rest. If any chapter is missing volume, flatten all to 0.
  let anyMissingVolume = false;

  let verifiedLatestChapterId: string | null = null;
  // True when the title restarts chapter numbering each volume. Read from the inline
  // manga relationship so the dedup key can keep volume and not drop real chapters.
  let resetChapterNumbersOnVolume = false;
  // Only the first page includes "manga". The relationship is identical across pages.
  const baseIncludes = ["scanlation_group"];
  // "manga" rides along on page 1 for the inline metadata refresh and for the
  // chapterNumbersResetOnNewVolume flag the dedup key needs when skip same chapter is on.
  const needsInlineManga = optimizeUpdates || skipSameChapter;
  const firstPageIncludes = needsInlineManga ? [...baseIncludes, "manga"] : baseIncludes;

  const inlineMetadataSettings: MangaDetailsSettings | undefined = willRefreshInlineMetadata
    ? readMangaTitleSettings()
    : undefined;

  // Local filter is a backstop for chapters that come back without publishAt.
  const publishAtSince = formatPublishAtSince(sinceDate);

  while (hasResults) {
    const includes = offset === 0 ? firstPageIncludes : baseIncludes;
    const request = {
      url: buildMangaFeedUrl({
        mangaId,
        offset,
        includes,
        blockedGroups,
        blockedUploaders,
        ratings,
        languages,
        publishAtSince,
        includeUnavailable,
      }).toString(),
      method: "GET",
    };

    const json = await fetchJSON<ChapterResponse>(request);

    offset += FEED_PAGE_LIMIT;

    assertDataArray(json, mangaId);

    // Read the inline manga relationship (no separate /manga call) for the metadata
    // refresh, the latest chapter check, and the volume reset dedup flag.
    if (needsInlineManga && offset === FEED_PAGE_LIMIT) {
      const mangaItem = readInlinedMangaItem(
        findMangaRelationship<ChapterRelationship>(
          json.data.flatMap((c) => c?.relationships ?? []),
        ),
      );
      const idMatches = mangaItem?.id?.toLowerCase() === mangaId;
      const mangaAttrs = mangaItem?.attributes;
      // Guard against MangaDex inlining a different manga's relationship.
      if (idMatches && mangaAttrs) {
        resetChapterNumbersOnVolume = mangaAttrs.chapterNumbersResetOnNewVolume === true;
      }
      if (optimizeUpdates && idMatches && mangaAttrs?.latestUploadedChapter) {
        verifiedLatestChapterId = mangaAttrs.latestUploadedChapter;
      }
      // Skip if tags array is missing. An empty tagGroups would mismatch /manga forever.
      if (willRefreshInlineMetadata && idMatches && mangaAttrs && Array.isArray(mangaAttrs.tags)) {
        const mangaItemDetails = parseMangaItemDetails(mangaId, mangaAttrs, inlineMetadataSettings);
        sourceManga.mangaInfo.primaryTitle = mangaItemDetails.primaryTitle;
        sourceManga.mangaInfo.secondaryTitles = mangaItemDetails.secondaryTitles;
        sourceManga.mangaInfo.synopsis = mangaItemDetails.synopsis;
        // Keep a prior publishing_finished correction unless the API
        // status actually changed.
        sourceManga.mangaInfo.status = reconcileStoredCompletedStatus(
          mangaAttrs.status,
          sourceManga.mangaInfo.status,
        );
        sourceManga.mangaInfo.tagGroups = mangaItemDetails.tagGroups;
        sourceManga.mangaInfo.contentRating = mangaItemDetails.contentRating;
        sourceManga.mangaInfo.shareUrl = mangaItemDetails.shareUrl;
        // Raw rating: Paperback's enum collapses erotica/pornographic into ADULT.
        sourceManga.mangaInfo.additionalInfo = {
          ...sourceManga.mangaInfo.additionalInfo,
          mdContentRating: mangaItemDetails.mdContentRating,
        };
      }
      // Run the gate on page 1 even if empty, so the "rating not enabled" error surfaces.
      evaluateRatingGate();
    }

    for (const chapter of json.data) {
      if (!chapter || !chapter.attributes) continue;
      const chapterId = chapter.id;
      const chapterDetails = chapter.attributes;
      // undefined (not epoch 0) for missing dates so the sinceDate backstop keeps them.
      const time = parseDateOrUndefined(chapterDetails.publishAt);

      // Feed URL already filters, but verify in case one slips through.
      if (!languageSet.has(chapterDetails.translatedLanguage)) {
        continue;
      }

      const rawTitle = decodeHTML(chapterDetails.title ?? "");
      // MangaDex marks pure oneshots by returning volume, chapter, and title all empty.
      const isPureOneshot = !chapterDetails.volume && !chapterDetails.chapter && !rawTitle;
      const name = isPureOneshot ? "Oneshot" : rawTitle;
      const { chapNum, isUnnumbered } = assignChapterNumber(chapterDetails.chapter, prevChapNum);
      if (isUnnumbered && skipSameChapter) {
        unnumberedIndex++;
      }
      prevChapNum = chapNum;

      const volume = Number(chapterDetails.volume) || 0;
      const langCode = MDLanguages.getFlagCode(chapterDetails.translatedLanguage);
      const groupNames = extractScanlationGroupNames(chapter);
      const group = groupNames.join(", ");
      const pages = normalizePagesCount(chapterDetails.pages);
      let identifier: string | undefined;
      if (skipSameChapter) {
        identifier = buildChapterIdentifier(
          chapNum,
          isUnnumbered,
          name,
          chapterDetails.translatedLanguage ?? "",
          unnumberedIndex,
          volume,
          resetChapterNumbersOnVolume,
        );
        if (collectedChapters!.has(identifier)) continue;
      }

      // Match per group. The joined string "Group A, Group B" never fuzzy matches "Group A".
      if (
        groupNames.length > 0 &&
        blockedGroupQueries.length > 0 &&
        groupNames.some((n) => isGroupNameBlocked(n, blockedGroupQueries, groupBlockCache))
      ) {
        continue;
      }

      const externalUrl = chapterDetails.externalUrl;
      const isUnavailable = pages === 0 || !!externalUrl || chapterDetails.isUnavailable === true;
      // Externally hosted chapters can have pages > 0 (a promo image),
      // so the toggle must gate all unavailable cases, not just pages=0.
      const shouldInclude = !isUnavailable || includeUnavailable;
      if (shouldInclude) {
        // Count toward the volume flatten only once a chapter actually ships,
        // so a filtered entry can't drop every volume to 0.
        if (!chapterDetails.volume) anyMissingVolume = true;
        const titleForChapter = isUnavailable ? `[Unavailable] ${name}` : name;
        chapters.push({
          chapterId,
          sourceManga,
          title: titleForChapter,
          chapNum,
          volume,
          langCode,
          version: group,
          publishDate: time,
          sortingIndex: 0,
        });
        if (identifier !== undefined) collectedChapters!.add(identifier);
      }
    }

    // MangaDex caps offset + limit at MAX_API_OFFSET, so stop before the next request would 400.
    if (
      json.data.length < FEED_PAGE_LIMIT ||
      typeof json.total !== "number" ||
      json.total <= offset ||
      offset >= MAX_API_OFFSET
    ) {
      hasResults = false;
    }
  }

  // Uses the manga level latestUploadedChapter from API. The optimizeUpdates path compares against it.
  let nextLatestChapter: string | null | undefined = verifiedLatestChapterId ?? undefined;
  if (nextLatestChapter === undefined && optimizeUpdates) {
    // Feed empty in user's languages, so reuse fresh additionalInfo or fetch /manga/{id}.
    if (mangaDetailsFreshlyFetched) {
      nextLatestChapter = sourceManga.mangaInfo.additionalInfo?.latestUploadedChapter ?? null;
    } else {
      try {
        nextLatestChapter = await fetchLatestUploadedChapter(mangaId);
      } catch {
        // Stay undefined. A transient error must not wipe the saved value.
      }
    }
  }
  if (typeof nextLatestChapter === "string") {
    sourceManga.mangaInfo.additionalInfo = {
      ...sourceManga.mangaInfo.additionalInfo,
      latestUploadedChapter: nextLatestChapter,
    };
  } else if (
    nextLatestChapter === null &&
    sourceManga.mangaInfo.additionalInfo &&
    "latestUploadedChapter" in sourceManga.mangaInfo.additionalInfo
  ) {
    // Server confirms zero chapters, so drop the stored id and updates stop flagging "changed".
    const next = { ...sourceManga.mangaInfo.additionalInfo };
    delete next.latestUploadedChapter;
    sourceManga.mangaInfo.additionalInfo = next;
  }

  const filteredChapters =
    sinceDate instanceof Date
      ? chapters.filter((chapter) => !chapter.publishDate || chapter.publishDate >= sinceDate)
      : chapters;
  if (anyMissingVolume) {
    // Use 0, not undefined. The host renders "TBA" when the volume property is missing,
    for (const chapter of filteredChapters) {
      chapter.volume = 0;
    }
  }
  filteredChapters.forEach((chapter, index) => {
    chapter.sortingIndex = filteredChapters.length - index;
  });
  return filteredChapters;
}

export async function getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
  const [chapterId, mangaId] = await Promise.all([
    resolveChapterId(chapter.chapterId),
    resolveMangaId(chapter.sourceManga.mangaId),
  ]);
  if (chapter.chapterId !== chapterId) chapter.chapterId = chapterId;
  if (chapter.sourceManga.mangaId !== mangaId) chapter.sourceManga.mangaId = mangaId;

  const dataSaver = getDataSaver();
  const forcePort = getForcePort443();

  const request = {
    url: buildAtHomeServerUrl(chapterId, forcePort),
    method: "GET",
  };

  const json = await fetchJSON<ChapterDetailsResponse>(request);
  if (!json.baseUrl || !json.chapter || !json.chapter.hash) {
    throw new Error(`MangaDex returned malformed chapter response for ${chapterId}`);
  }
  const serverUrl = json.baseUrl;
  const chapterDetails = json.chapter;
  // Fall back to full quality if dataSaver is empty. New chapters often ship that way.
  const useDataSaver =
    dataSaver && Array.isArray(chapterDetails.dataSaver) && chapterDetails.dataSaver.length > 0;
  const sourceArray = useDataSaver ? chapterDetails.dataSaver : chapterDetails.data;
  if (!Array.isArray(sourceArray) || sourceArray.length === 0) {
    throw new Error(`MangaDex returned no pages for chapter ${chapterId}`);
  }

  const qualityPath = useDataSaver ? "data-saver" : "data";
  const pages = sourceArray.map(
    (x: string) => `${serverUrl}/${qualityPath}/${chapterDetails.hash}/${x}`,
  );

  return { id: chapterId, mangaId: mangaId, pages };
}

export async function processTitlesForUpdates(
  updateManager: UpdateManager,
  // We compare chapter ids, not timestamps.
  _lastUpdateDate?: Date,
): Promise<void> {
  const sourceManga = updateManager.getQueuedItems();

  // Unresolved ids = deleted (empty chapters). Network errors propagate to retry the pass.
  const idMap = await resolveMangaIds(sourceManga.map((m) => m.mangaId));

  const mangaMap = new Map<string, SourceManga>();
  const mangaIds: string[] = [];
  const skipped: string[] = [];
  for (const manga of sourceManga) {
    const resolved = idMap[manga.mangaId];
    if (!resolved) {
      skipped.push(manga.mangaId);
      continue;
    }
    if (manga.mangaId !== resolved) manga.mangaId = resolved;
    mangaIds.push(manga.mangaId);
    mangaMap.set(manga.mangaId, manga);
  }
  if (skipped.length > 0) {
    await Promise.all(skipped.map((mangaId) => updateManager.setNewChapters(mangaId, [])));
  }

  const optimizeUpdates = getOptimizeUpdates();

  if (optimizeUpdates) {
    const ratings: string[] = getRatings();
    const languages: string[] = getLanguages();
    const skipPublicationStatus = getSkipPublicationStatus();
    const batchSize = getUpdateBatchSize();
    const skipNewChapters = getSkipNewChapters();
    const skipUnreadChapters = getSkipUnreadChapters();

    for (let i = 0; i < mangaIds.length; i += batchSize) {
      const batchIds = mangaIds.slice(i, i + batchSize);
      const idsToSkip: string[] = [];

      const request = {
        url: buildMangaListUrl({
          limit: batchSize,
          languages,
          ratings,
          ids: batchIds,
          // Update probes don't render covers, so skip the cover_art include.
          includes: [],
        }).toString(),
        method: "GET",
      };

      let json: SearchResponse;
      try {
        json = await fetchJSON<SearchResponse>(request);
      } catch {
        // Batch failed. Let Paperback's default flow handle these manga.
        continue;
      }

      const seenIds = new Set<string>();
      if (Array.isArray(json.data)) {
        for (const mangaData of json.data) {
          if (!mangaData || !mangaData.attributes) continue;
          // Lowercase to match resolveMangaIds keys.
          const apiId = mangaData.id.toLowerCase();
          seenIds.add(apiId);
          const storedManga = mangaMap.get(apiId);
          if (!storedManga) continue;

          const latestApiChapter = mangaData.attributes.latestUploadedChapter;
          const latestStoredChapter = storedManga.mangaInfo?.additionalInfo?.latestUploadedChapter;
          // Value compare, not truthiness. The case (stored=id, api=null) happens on DMCA takedown.
          const chapterChanged = (latestApiChapter ?? null) !== (latestStoredChapter ?? null);

          const skipUnread = shouldSkipByCount(
            skipUnreadChapters,
            storedManga.unreadChapterCount,
            storedManga.chapterCount,
          );
          const skipNew = shouldSkipByCount(
            skipNewChapters,
            storedManga.newChapterCount,
            storedManga.chapterCount,
          );
          // Only keep stored when both still mean "complete but unreadable".
          const effectiveStatus = reconcileStoredCompletedStatus(
            mangaData.attributes.status,
            storedManga.mangaInfo?.status,
          );
          const filterSkip =
            skipPublicationStatus.includes(effectiveStatus) || skipUnread || skipNew;

          if (!chapterChanged || filterSkip) {
            idsToSkip.push(apiId);
          }
        }
      }

      // Missing = deleted or filtered out. Small miss counts: verify per id (404 vs 200).
      // Large miss counts: assume a settings change and skip to spare the rate limiter.
      const missingIds = batchIds.filter((id) => !seenIds.has(id));
      const VERIFY_MISSING_THRESHOLD = 10;
      if (missingIds.length > 0 && missingIds.length <= VERIFY_MISSING_THRESHOLD) {
        const verifyResults = await Promise.allSettled(
          missingIds.map((mangaId) => fetchLatestUploadedChapter(mangaId)),
        );
        for (let k = 0; k < verifyResults.length; k++) {
          const result = verifyResults[k];
          if (result.status === "fulfilled") {
            const stored = mangaMap.get(missingIds[k]);
            const latestStored = stored?.mangaInfo?.additionalInfo?.latestUploadedChapter ?? null;
            // Skip when api reports no chapters or when the chapter id matches stored
            if (result.value === null || result.value === latestStored) {
              idsToSkip.push(missingIds[k]);
            }
            continue;
          }
          if (isNotFoundError(result.reason)) {
            idsToSkip.push(missingIds[k]);
          }
        }
      } else if (missingIds.length > VERIFY_MISSING_THRESHOLD) {
        idsToSkip.push(...missingIds);
      }

      await Promise.all(idsToSkip.map((mangaId) => updateManager.setNewChapters(mangaId, [])));
    }
  }
}
