import {
    Chapter,
    ChapterReadActionQueueProcessingResult,
    Form,
    MangaProgress,
    SourceManga,
    TrackedMangaChapterReadAction,
    URL,
} from "@paperback/types";
import { MangaProgressForm } from "../forms/MangaProgressForm";
import {
    getAccessToken,
    getChapterPreloadingEnabled,
    getMangaProgressEnabled,
    getTrackingContentRatings,
    getTrackingEnabled,
} from "../MangaDexSettings";
import { fetchJSON, MANGADEX_API } from "../utils/CommonUtil";
import { ChapterProvider } from "./ChapterProvider";

/**
 * Manages reading progress and chapter tracking
 */
export class ProgressProvider {
    private chapterProvider: ChapterProvider;

    constructor(chapterProvider: ChapterProvider) {
        this.chapterProvider = chapterProvider;
    }

    /**
     * Returns the form for managing manga reading progress
     */
    async getMangaProgressManagementForm(
        sourceManga: SourceManga,
    ): Promise<Form> {
        if (!getAccessToken()) {
            throw new Error(
                "You need to be logged in to manage manga progress",
            );
        }

        const statusUrl = new URL(MANGADEX_API)
            .addPathComponent("manga")
            .addPathComponent(sourceManga.mangaId)
            .addPathComponent("status")
            .toString();

        let readingStatus = "reading";
        let readChapterIds: Set<string> | null = null;
        let chapters: Chapter[] | null = null;
        let currentRating = -1;

        const chapterPreloadingEnabled = getChapterPreloadingEnabled();

        try {
            const statusResponse =
                await fetchJSON<MangaDex.MangaStatusGetResponse>({
                    url: statusUrl,
                    method: "GET",
                });

            if (statusResponse.result === "ok") {
                if (statusResponse.status) {
                    readingStatus = statusResponse.status;
                } else {
                    readingStatus = "none";
                }
            }

            try {
                const ratingUrl = new URL(MANGADEX_API)
                    .addPathComponent("rating")
                    .setQueryItem("manga[]", [sourceManga.mangaId])
                    .toString();

                const ratingResponse =
                    await fetchJSON<MangaDex.MangaRatingResponse>({
                        url: ratingUrl,
                        method: "GET",
                    });

                if (ratingResponse.result === "ok" && ratingResponse.ratings) {
                    const userRating =
                        ratingResponse.ratings[sourceManga.mangaId];
                    if (userRating) {
                        currentRating = userRating.rating;
                    }
                }
            } catch (error) {
                console.log(`Error loading rating: ${String(error)}`);
            }

            if (chapterPreloadingEnabled) {
                const readUrl = new URL(MANGADEX_API)
                    .addPathComponent("manga")
                    .addPathComponent(sourceManga.mangaId)
                    .addPathComponent("read")
                    .toString();

                readChapterIds = new Set<string>();
                const readResponse =
                    await fetchJSON<MangaDex.MangaReadResponse>({
                        url: readUrl,
                        method: "GET",
                    });

                if (readResponse.result === "ok" && readResponse.data) {
                    readChapterIds = new Set(readResponse.data);
                }
            }
        } catch (error) {
            console.log(`Error fetching manga progress data: ${String(error)}`);
        }

        if (chapterPreloadingEnabled) {
            try {
                chapters = await this.chapterProvider.getChapters(
                    sourceManga,
                    true,
                );
            } catch (error) {
                console.log(`Error fetching chapters: ${String(error)}`);
            }
        }

        return new MangaProgressForm(
            sourceManga,
            readingStatus,
            readChapterIds,
            chapters,
            chapterPreloadingEnabled ? undefined : this.chapterProvider,
            currentRating,
        );
    }

    /**
     * Gets the current reading progress for a manga
     */
    async getMangaProgress(
        sourceManga: SourceManga,
    ): Promise<MangaProgress | undefined> {
        if (!getMangaProgressEnabled()) {
            return undefined;
        }

        if (!getAccessToken()) {
            console.log("Authentication required to get manga progress");
            return undefined;
        }

        try {
            const url = new URL(MANGADEX_API)
                .addPathComponent("manga")
                .addPathComponent(sourceManga.mangaId)
                .addPathComponent("read")
                .toString();

            const readStatus = await fetchJSON<MangaDex.MangaReadResponse>({
                url,
                method: "GET",
            });

            if (readStatus.result !== "ok" || !readStatus.data) {
                console.log("Failed to get manga read status");
                return undefined;
            }

            const chapters =
                await this.chapterProvider.getChapters(sourceManga);

            if (chapters.length === 0) {
                return undefined;
            }

            let lastReadIndex = chapters.length - 1;

            if (readStatus.data && readStatus.data.length > 0) {
                const readChapterIds = new Set(readStatus.data);

                const readIndices = chapters
                    .map((chapter, index) => ({ id: chapter.chapterId, index }))
                    .filter((item) => readChapterIds.has(item.id))
                    .map((item) => item.index);

                if (readIndices.length > 0) {
                    lastReadIndex = Math.min(...readIndices) - 1;
                    lastReadIndex = Math.max(0, lastReadIndex);
                }
            }

            return {
                sourceManga: sourceManga,
                lastReadChapter: chapters[lastReadIndex],
            };
        } catch (error) {
            console.log(`Error fetching manga progress: ${String(error)}`);
            return undefined;
        }
    }

    /**
     * Processes chapter read status updates to MangaDex
     */
    async processChapterReadActionQueue(
        actions: TrackedMangaChapterReadAction[],
    ): Promise<ChapterReadActionQueueProcessingResult> {
        // Ensure chapter IDs are GUID format to handle errors
        const guidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

        if (!getAccessToken()) {
            return {
                successfulItems: [],
                failedItems: actions
                    .filter(
                        (action) =>
                            action.readChapter?.chapterId &&
                            guidRegex.test(action.readChapter.chapterId),
                    )
                    .map((action) => action.chapterId),
            };
        }

        const successfulItems: string[] = [];
        const failedItems: string[] = [];

        const trackingEnabled = getTrackingEnabled();
        if (!trackingEnabled) {
            return {
                successfulItems: [],
                failedItems: actions
                    .filter(
                        (action) =>
                            action.readChapter?.chapterId &&
                            guidRegex.test(action.readChapter.chapterId),
                    )
                    .map((action) => action.chapterId),
            };
        }

        const allowedContentRatings = getTrackingContentRatings().map(
            (rating) => rating.toLowerCase(),
        );

        const mapContentRating = (apiRating: string): string[] => {
            apiRating = apiRating.toLowerCase();
            switch (apiRating) {
                case "safe":
                    return ["safe"];
                case "mature":
                    return ["suggestive"];
                case "adult":
                    return ["erotica", "pornographic"];
                case "unknown":
                    return ["unknown"];
                default:
                    return [apiRating];
            }
        };

        const chaptersByManga: Record<
            string,
            {
                mangaId: string;
                sourceManga: SourceManga;
                chapterIds: string[];
            }
        > = {};

        for (const action of actions) {
            const chapterId = action.readChapter?.chapterId;
            if (!chapterId || !guidRegex.test(chapterId)) {
                console.warn(
                    `Skipping chapter read action due to invalid or missing chapterId ('${chapterId ?? "undefined"}') for manga: ${action.sourceManga.mangaId}`,
                );
                continue;
            }

            const mangaId = action.sourceManga.mangaId;
            const contentRating = action.sourceManga.mangaInfo?.contentRating;

            if (contentRating) {
                const mappedRatings = mapContentRating(contentRating);
                const isAllowed = mappedRatings.some((rating) =>
                    allowedContentRatings.includes(rating),
                );

                if (allowedContentRatings.length > 0 && !isAllowed) {
                    failedItems.push(chapterId);
                    continue;
                }
            }

            if (!chaptersByManga[mangaId]) {
                chaptersByManga[mangaId] = {
                    mangaId,
                    sourceManga: action.sourceManga,
                    chapterIds: [],
                };
            }

            chaptersByManga[mangaId].chapterIds.push(chapterId);
        }

        for (const mangaGroup of Object.values(chaptersByManga)) {
            try {
                failedItems.push(...mangaGroup.chapterIds);
            } catch {
                failedItems.push(...mangaGroup.chapterIds);
            }
        }

        for (const mangaGroup of Object.values(chaptersByManga)) {
            try {
                const statusUrl = new URL(MANGADEX_API)
                    .addPathComponent("manga")
                    .addPathComponent(mangaGroup.mangaId)
                    .addPathComponent("status")
                    .toString();

                const statusResponse =
                    await fetchJSON<MangaDex.MangaStatusGetResponse>({
                        url: statusUrl,
                        method: "GET",
                    });

                if (statusResponse.result !== "ok") {
                    continue;
                }

                const sourceManga = mangaGroup.sourceManga;
                let unreadCount = sourceManga.unreadChapterCount || 0;

                const chaptersToConsider = mangaGroup.chapterIds.length;
                unreadCount = Math.max(0, unreadCount - chaptersToConsider);

                let newStatus: string | null = null;

                if (!statusResponse.status) {
                    newStatus = unreadCount === 0 ? "completed" : "reading";
                } else if (
                    statusResponse.status === "reading" &&
                    unreadCount === 0
                ) {
                    newStatus = "completed";
                }

                if (newStatus) {
                    await fetchJSON<MangaDex.MangaStatusUpdateResponse>({
                        url: statusUrl,
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: { status: newStatus },
                    });
                }
            } catch (error) {
                console.log(`Error updating manga status: ${String(error)}`);
            }
        }

        return {
            successfulItems,
            failedItems,
        };
    }
}
