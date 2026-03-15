import {
  ContentRating,
  URL,
  type Chapter,
  type ChapterDetails,
  type MangaInfo,
  type SourceManga,
  type UpdateManager,
} from "@paperback/types";
import { MDLanguages } from "../MangaDexHelper";
import { parseMangaItemDetails } from "../MangaDexParser";
import {
  getBlockedGroups,
  getDataSaver,
  getForcePort443,
  getFuzzyBlockingEnabled,
  getGroupBlockingEnabled,
  getLanguages,
  getMetadataUpdater,
  getOptimizeUpdates,
  getRatings,
  getSkipNewChapters,
  getSkipPublicationStatus,
  getSkipSameChapter,
  getSkipUnreadChapters,
  getUpdateBatchSize,
} from "../MangaDexSettings";
import { fetchJSON, isLegacyId, MANGADEX_API, resolveLegacyId } from "../utils/CommonUtil";
import { relevanceScore } from "../utils/titleRelevanceScore";
import { MangaProvider } from "./MangaProvider";

/**
 * Handles fetching and processing of manga chapters
 */
export class ChapterProvider {
  private mangaProvider: MangaProvider;

  constructor(mangaProvider: MangaProvider) {
    this.mangaProvider = mangaProvider;
  }

  /**
   * Fetches chapters for a manga, optionally updating metadata
   */
  async getChapters(
    sourceManga: SourceManga,
    sinceDate?: Date,
    skipMetadataUpdate: boolean = false,
  ): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId;

    if (isLegacyId(mangaId)) {
      const resolvedId = await resolveLegacyId(mangaId);
      if (resolvedId) {
        console.log(`getChapters: resolved legacy ID "${mangaId}" to "${resolvedId}"`);
        sourceManga.mangaId = resolvedId;
        const chapters = await this.getChapters(sourceManga, sinceDate, skipMetadataUpdate);
        sourceManga.mangaId = mangaId;
        return chapters;
      }

      console.warn(`getChapters: could not resolve legacy ID "${mangaId}"`);
      return [];
    }

    if (!sourceManga.mangaInfo) {
      sourceManga.mangaInfo = {} as MangaInfo;
    }
    if (!sourceManga.mangaInfo.additionalInfo) {
      sourceManga.mangaInfo.additionalInfo = {};
    }

    const metadataUpdaterEnabled = !skipMetadataUpdate && getMetadataUpdater();
    if (
      metadataUpdaterEnabled ||
      !sourceManga.mangaInfo ||
      !sourceManga.mangaInfo.status ||
      !sourceManga.mangaInfo.rating ||
      !sourceManga.mangaInfo.shareUrl
    ) {
      const updatedManga = await this.mangaProvider.getMangaDetails(mangaId);
      sourceManga.mangaInfo = updatedManga.mangaInfo;
    }

    const languages: string[] = getLanguages();
    const skipSameChapter = getSkipSameChapter();
    const ratings: string[] = getRatings();

    // Inverse mapping: Paperback ContentRating -> MangaDex rating strings
    const paperbackToMangaDexRatings: Record<ContentRating, string[]> = {
      [ContentRating.EVERYONE]: ["safe"],
      [ContentRating.MATURE]: ["suggestive"],
      [ContentRating.ADULT]: ["erotica", "pornographic"],
    };

    const mangaPbRating = sourceManga.mangaInfo.contentRating;
    const mangaMdRatings = paperbackToMangaDexRatings[mangaPbRating] ?? [];
    const isRatingAllowed = mangaMdRatings.some((mdRating) => ratings.includes(mdRating));
    if (!isRatingAllowed) {
      throw new Error(
        `If you see UNKNOWN at the top left under the Read button, go back and then re-open this manga. Otherwise, this manga has a content rating (${mangaPbRating}) which might not be enabled in your source settings`,
      );
    }

    const groupBlockingEnabled = getGroupBlockingEnabled();
    const fuzzyBlockingEnabled = getFuzzyBlockingEnabled();
    const blockedGroups = groupBlockingEnabled ? Object.keys(getBlockedGroups() || {}) : [];
    const blockedGroupsData = groupBlockingEnabled ? getBlockedGroups() : {};
    const collectedChapters = new Set<string>();
    const chapters: Chapter[] = [];

    let latestChapter: { id: string; createdAt: Date } | null = null;
    let offset = 0;
    let sortingIndex = 0;
    let hasResults = true;
    let prevChapNum = 0;
    //let totalChaptersFetched = 0;
    //let hasExternalChapters = false;

    let verifiedLatestChapterId: string | null = null;
    if (getOptimizeUpdates()) {
      try {
        const unfilteredRequest = {
          url: new URL(MANGADEX_API)
            .addPathComponent("manga")
            .addPathComponent(mangaId)
            .addPathComponent("feed")
            .setQueryItems({
              "contentRating[]": ["safe", "suggestive", "erotica", "pornographic"],
            })
            .setQueryItem("limit", "25")
            .setQueryItem("offset", "0")
            .setQueryItem("includes[]", "manga")
            .setQueryItem("order[createdAt]", "desc")
            .setQueryItem("order[volume]", "desc")
            .setQueryItem("order[chapter]", "desc")
            .setQueryItem("includeFutureUpdates", "1")
            .toString(),
          method: "GET",
        };
        const unfilteredJson = await fetchJSON<MangaDex.ChapterResponse>(unfilteredRequest);

        if (unfilteredJson.data && unfilteredJson.data.length > 0) {
          for (const chapterData of unfilteredJson.data) {
            const chapterIdFromFeed = chapterData.id;
            const mangaRel = chapterData.relationships?.find((rel) => rel.type === "manga");
            const latestChapterIdOnManga = (
              mangaRel?.attributes as { latestUploadedChapter?: string } | undefined
            )?.latestUploadedChapter;
            if (
              chapterIdFromFeed &&
              latestChapterIdOnManga &&
              chapterIdFromFeed === latestChapterIdOnManga
            ) {
              verifiedLatestChapterId = chapterIdFromFeed;
              break;
            }
          }
        }
        if (skipMetadataUpdate || !getMetadataUpdater()) {
          if (unfilteredJson.data && unfilteredJson.data.length > 0) {
            const chapterData = unfilteredJson.data[0];
            const mangaItem = chapterData.relationships?.find(
              (rel: MangaDex.ChapterRelationship) => rel.type === "manga",
            ) as MangaDex.MangaItem | undefined;

            if (mangaItem?.attributes && mangaItem.id) {
              const mangaDetails = mangaItem.attributes;
              const mangaItemDetails = parseMangaItemDetails(mangaId, mangaDetails);

              sourceManga.mangaInfo.primaryTitle = mangaItemDetails.primaryTitle;
              sourceManga.mangaInfo.secondaryTitles = mangaItemDetails.secondaryTitles;
              sourceManga.mangaInfo.synopsis = mangaItemDetails.synopsis ?? "No Description";
              sourceManga.mangaInfo.status = mangaDetails.status;
              sourceManga.mangaInfo.tagGroups = mangaItemDetails.tagGroups;
              sourceManga.mangaInfo.contentRating = mangaItemDetails.contentRating;
              sourceManga.mangaInfo.shareUrl = mangaItemDetails.shareUrl;
            }
          }
        }
      } catch {
        verifiedLatestChapterId = null;
      }
    }

    while (hasResults) {
      const request = {
        url: new URL(MANGADEX_API)
          .addPathComponent("manga")
          .addPathComponent(mangaId)
          .addPathComponent("feed")
          .setQueryItem("limit", "500")
          .setQueryItem("offset", offset.toString())
          .setQueryItem("includes[]", "scanlation_group")
          .setQueryItem("excludedGroups[]", blockedGroups.length > 0 ? blockedGroups : [])
          .setQueryItem("order[volume]", "desc")
          .setQueryItem("order[chapter]", "desc")
          .setQueryItem("order[createdAt]", "desc")
          .setQueryItem("contentRating[]", ratings)
          .setQueryItem("translatedLanguage[]", languages)
          //.setQueryItem("includeFutureUpdates", "0")
          //.setQueryItem("includeEmptyPages", "0")
          .toString(),
        method: "GET",
      };

      const json = await fetchJSON<MangaDex.ChapterResponse>(request);

      offset += 500;

      if (json.data === undefined) throw new Error(`Failed to create chapters for ${mangaId}`);

      for (const chapter of json.data) {
        //totalChaptersFetched++;
        const chapterId = chapter.id;
        const chapterDetails = chapter.attributes;
        //if (
        //    chapterDetails.externalUrl &&
        //    chapterDetails.externalUrl.trim() !== ""
        //) {
        //    hasExternalChapters = true;
        //}
        const time = new Date(chapterDetails.publishAt);
        const createdAt = new Date(chapterDetails.createdAt);

        if (!latestChapter || createdAt > latestChapter.createdAt) {
          latestChapter = {
            id: chapterId,
            createdAt: createdAt,
          };

          if (verifiedLatestChapterId) {
            sourceManga.mangaInfo.additionalInfo = {
              latestUploadedChapter: verifiedLatestChapterId,
            };
          } else {
            sourceManga.mangaInfo.additionalInfo = {
              latestUploadedChapter: chapterId,
            };
          }
        }

        if (!languages.includes(chapterDetails.translatedLanguage)) {
          continue;
        }

        const name = Application.decodeHTMLEntities(chapterDetails.title ?? "") ?? "";
        let chapNum = Number(chapterDetails.chapter);
        if (isNaN(chapNum)) {
          chapNum = prevChapNum - 0.001;
        } else {
          prevChapNum = chapNum;
        }

        const volume = Number(chapterDetails.volume);
        const langCode = MDLanguages.getFlagCode(chapterDetails.translatedLanguage);
        const group = chapter.relationships
          .filter((x: MangaDex.ChapterRelationship) => x.type.valueOf() === "scanlation_group")
          .map((x: MangaDex.ChapterRelationship) => x.attributes?.name)
          .join(", ");
        const pages = Number(chapterDetails.pages);
        const identifier = `${volume}-${chapNum}-${chapterDetails.translatedLanguage}`;

        if (collectedChapters.has(identifier) && skipSameChapter) continue;

        if (groupBlockingEnabled && fuzzyBlockingEnabled && group) {
          let shouldSkip = false;

          for (const blockedGroupId of blockedGroups) {
            const blockedGroupName = blockedGroupsData[blockedGroupId]?.attributes?.name;
            if (blockedGroupName && group) {
              const score = relevanceScore(group, blockedGroupName);
              if (score >= 70) {
                shouldSkip = true;
                break;
              }
            }
          }

          if (shouldSkip) continue;
        }

        if (pages > 0) {
          chapters.push({
            chapterId,
            sourceManga,
            title: name,
            chapNum,
            volume,
            langCode,
            version: group,
            publishDate: time,
            sortingIndex,
          });
          collectedChapters.add(identifier);
          sortingIndex--;
        }
      }

      if (json.total <= offset) {
        hasResults = false;
      }
    }

    const filteredChapters =
      sinceDate instanceof Date
        ? chapters.filter((chapter) => !chapter.publishDate || chapter.publishDate >= sinceDate)
        : chapters;

    const total = filteredChapters.length;

    return filteredChapters.map((chapter, index) => {
      chapter.sortingIndex = total - index;
      return chapter;
    });
  }

  /**
   * Gets page details for a specific chapter
   */
  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const chapterId = chapter.chapterId;
    const mangaId = chapter.sourceManga.mangaId;

    if (isLegacyId(chapterId)) {
      console.warn(`getChapterDetails: skipping legacy numeric chapter ID "${chapterId}"`);
      return { id: chapterId, mangaId, pages: [] };
    }

    const dataSaver = getDataSaver();
    const forcePort = getForcePort443();

    const request = {
      url: `${MANGADEX_API}/at-home/server/${chapterId}${forcePort ? "?forcePort443=true" : ""}`,
      method: "GET",
    };

    const json = await fetchJSON<MangaDex.ChapterDetailsResponse>(request);
    const serverUrl = json.baseUrl;
    const chapterDetails = json.chapter;

    let pages: string[];
    if (dataSaver) {
      pages = chapterDetails.dataSaver.map(
        (x: string) => `${serverUrl}/data-saver/${chapterDetails.hash}/${x}`,
      );
    } else {
      pages = chapterDetails.data.map(
        (x: string) => `${serverUrl}/data/${chapterDetails.hash}/${x}`,
      );
    }

    return { id: chapterId, mangaId: mangaId, pages };
  }

  /**
   * Optimizes update process by filtering which manga need updates
   */
  async processTitlesForUpdates(
    updateManager: UpdateManager,
    _lastUpdateDate?: Date,
  ): Promise<void> {
    const sourceManga = updateManager.getQueuedItems();

    const mangaMap = new Map<string, SourceManga>();
    const mangaIds: string[] = [];
    for (const manga of sourceManga) {
      if (isLegacyId(manga.mangaId)) {
        const resolvedId = await resolveLegacyId(manga.mangaId);
        if (resolvedId) {
          console.log(
            `processTitlesForUpdates: resolved legacy ID "${manga.mangaId}" to "${resolvedId}"`,
          );
          mangaIds.push(resolvedId);
          mangaMap.set(resolvedId, manga);
        } else {
          console.warn(
            `processTitlesForUpdates: skipping unresolvable legacy ID "${manga.mangaId}"`,
          );
          await updateManager.setNewChapters(manga.mangaId, []);
        }
        continue;
      }
      mangaIds.push(manga.mangaId);
      mangaMap.set(manga.mangaId, manga);
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
        const offset: number = 0;
        const needsUpdate: string[] = []; // Processed by default, but keep in case we can do something later
        const skipUpdate: string[] = [];

        const request = {
          url: new URL(MANGADEX_API)
            .addPathComponent("manga")
            .setQueryItem("limit", batchSize.toString())
            .setQueryItem("availableTranslatedLanguage[]", languages)
            .setQueryItem("offset", offset.toString())
            .setQueryItem("contentRating[]", ratings)
            .setQueryItem("ids[]", batchIds)
            .toString(),
          method: "GET",
        };

        const json = await fetchJSON<MangaDex.SearchResponse>(request);

        if (json.data) {
          for (const mangaData of json.data) {
            const sourceManga = mangaMap.get(mangaData.id);
            if (!sourceManga) continue;

            const latestApiChapter = mangaData.attributes.latestUploadedChapter;
            const latestStoredChapter =
              sourceManga.mangaInfo?.additionalInfo?.latestUploadedChapter;

            let metadataHasChanged = false;
            if (sourceManga.mangaInfo) {
              const apiMangaDetails = parseMangaItemDetails(mangaData.id, mangaData.attributes);
              const storedMangaInfo = sourceManga.mangaInfo;

              if (storedMangaInfo.primaryTitle !== apiMangaDetails.primaryTitle) {
                metadataHasChanged = true;
              }

              const storedSecondaryTitle = [...(storedMangaInfo.secondaryTitles ?? [])]
                .sort()
                .join(",");
              const apiSecondaryTitle = [...(apiMangaDetails.secondaryTitles ?? [])]
                .sort()
                .join(",");
              if (storedSecondaryTitle !== apiSecondaryTitle) {
                metadataHasChanged = true;
              }

              if ((storedMangaInfo.synopsis ?? "") !== apiMangaDetails.synopsis) {
                metadataHasChanged = true;
              }

              if (storedMangaInfo.status !== apiMangaDetails.status) {
                metadataHasChanged = true;
              }

              if (storedMangaInfo.contentRating !== apiMangaDetails.contentRating) {
                metadataHasChanged = true;
              }

              const storedTagIds = (
                storedMangaInfo.tagGroups ? (storedMangaInfo.tagGroups[0]?.tags ?? []) : []
              )
                .map((t) => t.id)
                .sort()
                .join(",");
              const apiTagIds = (apiMangaDetails.tagGroups[0]?.tags ?? [])
                .map((t) => t.id)
                .sort()
                .join(",");
              if (storedTagIds !== apiTagIds) {
                metadataHasChanged = true;
              }

              if ((storedMangaInfo.shareUrl ?? "") !== apiMangaDetails.shareUrl) {
                metadataHasChanged = true;
              }
            }

            let skipUnread = false;
            if (
              skipUnreadChapters > 0 &&
              sourceManga.unreadChapterCount !== undefined &&
              sourceManga.chapterCount
            ) {
              if (skipUnreadChapters === 1) {
                skipUnread = sourceManga.unreadChapterCount > 0;
              } else {
                const unreadPercentage =
                  (sourceManga.unreadChapterCount / sourceManga.chapterCount) * 100;
                skipUnread = unreadPercentage >= skipUnreadChapters;
              }
            }

            let skipNew = false;
            if (
              skipNewChapters > 0 &&
              sourceManga.newChapterCount !== undefined &&
              sourceManga.chapterCount
            ) {
              if (skipNewChapters === 1) {
                skipNew = sourceManga.newChapterCount > 0;
              } else {
                const newPercentage =
                  (sourceManga.newChapterCount / sourceManga.chapterCount) * 100;
                skipNew = newPercentage >= skipNewChapters;
              }
            }

            const chapterChanged = latestApiChapter && latestApiChapter !== latestStoredChapter;
            const shouldUpdateBasedOnContent = chapterChanged || metadataHasChanged;

            if (
              shouldUpdateBasedOnContent &&
              !skipPublicationStatus.includes(mangaData.attributes.status) &&
              !skipUnread &&
              !skipNew
            ) {
              needsUpdate.push(mangaData.id);
            } else {
              skipUpdate.push(mangaData.id);
            }
          }
        }

        for (const mangaId of skipUpdate) {
          const originalManga = mangaMap.get(mangaId);
          await updateManager.setNewChapters(originalManga?.mangaId ?? mangaId, []);
        }
      }
    }
  }
}
