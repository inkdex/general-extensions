/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  LabelRow,
  NavigationRow,
  Section,
  URL,
  type FormItemElement,
  type FormSectionElement,
  type SourceManga,
} from "@paperback/types";
import { parseMangaDetails } from "../MangaDexParser";
import { getAccessToken, getUpdateBatchSize } from "../MangaDexSettings";
import { ChapterProvider } from "../providers/ChapterProvider";
import { MangaProvider } from "../providers/MangaProvider";
import { fetchJSON, MANGADEX_API } from "../utils/CommonUtil";
import { MangaProgressForm } from "./MangaProgressForm";

// Order for sorting manga by reading status
const READING_STATUS_ORDER = {
  reading: 1,
  on_hold: 2,
  plan_to_read: 3,
  dropped: 4,
  re_reading: 5,
  completed: 6,
  none: 7,
  remove: 8,
};

interface LibraryManga {
  id: string;
  status: string;
  sourceManga?: SourceManga;
  rating?: number;
}

/**
 * Form to display the user's MangaDex library
 * Shows manga and their reading status
 */
export class LibraryMangaListForm extends Form {
  private mangaProvider: MangaProvider;
  private chapterProvider: ChapterProvider;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;
  private loadingProgress: { current: number; total: number } = {
    current: 0,
    total: 0,
  };
  private libraryManga: LibraryManga[] = [];
  private error: string | null = null;

  constructor(mangaProvider: MangaProvider) {
    super();
    this.mangaProvider = mangaProvider;
    this.chapterProvider = new ChapterProvider(mangaProvider);
  }

  override getSections(): FormSectionElement[] {
    const sections: FormSectionElement[] = [];

    if (!this.isLoaded && !this.isLoading) {
      sections.push(
        Section("load_section", [
          ButtonRow("load_library", {
            title: "Load Library",
            onSelect: Application.Selector(this as LibraryMangaListForm, "handleLoadLibrary"),
          }),
        ]),
      );
    }

    if (this.isLoading) {
      sections.push(
        Section("loading_section", [
          LabelRow("loading", {
            title: "Loading...",
            subtitle: "Fetching your MangaDex library, please wait",
          }),
        ]),
      );
    }

    if (this.error) {
      sections.push(
        Section("error_section", [
          LabelRow("error", {
            title: "Error",
            subtitle: this.error,
          }),
          ButtonRow("try_again", {
            title: "Try Again",
            onSelect: Application.Selector(this as LibraryMangaListForm, "handleLoadLibrary"),
          }),
        ]),
      );
    }

    if (this.isLoaded && this.libraryManga.length > 0) {
      const mangaItems: FormItemElement<unknown>[] = [];

      for (const manga of this.libraryManga) {
        if (manga.sourceManga) {
          const formattedStatus = manga.status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          mangaItems.push(
            NavigationRow(`manga_${manga.id}`, {
              title: manga.sourceManga.mangaInfo.primaryTitle,
              subtitle: `Status: ${formattedStatus}`,
              form: new MangaProgressForm(
                manga.sourceManga,
                manga.status,
                null,
                null,
                this.chapterProvider,
                manga.rating || 0,
              ),
            }),
          );
        }
      }

      if (mangaItems.length > 0) {
        sections.push(Section("library_section", mangaItems));
      }
    } else if (this.isLoaded) {
      sections.push(
        Section("empty_section", [
          LabelRow("empty", {
            title: "No Manga Found",
            subtitle: "Your library is empty or there was an error loading it",
          }),
          ButtonRow("reload", {
            title: "Reload",
            onSelect: Application.Selector(this as LibraryMangaListForm, "handleLoadLibrary"),
          }),
        ]),
      );
    }

    return sections;
  }

  async handleLoadLibrary(): Promise<void> {
    return this.loadLibraryManga();
  }

  /**
   * Loads the user's library manga from MangaDex
   * Fetches details and reading status for each manga
   */
  private async loadLibraryManga(): Promise<void> {
    if (!getAccessToken()) {
      this.error = "You need to be logged in to view your library";
      this.reloadForm();
      return;
    }

    try {
      this.isLoading = true;
      this.error = null;
      this.loadingProgress = { current: 0, total: 0 };
      this.reloadForm();

      const statusUrl = new URL(MANGADEX_API)
        .addPathComponent("manga")
        .addPathComponent("status")
        .toString();

      const statusResponse = await fetchJSON<MangaDex.MangaStatusResponse>({
        url: statusUrl,
        method: "GET",
      });

      if (statusResponse.result !== "ok" || !statusResponse.statuses) {
        throw new Error("Failed to fetch library manga");
      }

      this.libraryManga = Object.entries(statusResponse.statuses)
        .map(([id, status]) => ({
          id,
          status,
        }))
        .filter((manga) => manga.status !== "none" && manga.status !== null);

      this.loadingProgress.total = this.libraryManga.length;

      const BATCH_SIZE = getUpdateBatchSize();

      const mangaIds = this.libraryManga.map((manga) => manga.id);
      const mangaIdToIndexMap = new Map<string, number>();
      this.libraryManga.forEach((manga, index) => {
        mangaIdToIndexMap.set(manga.id, index);
      });

      for (let i = 0; i < mangaIds.length; i += BATCH_SIZE) {
        const batchIds = mangaIds.slice(i, i + BATCH_SIZE);

        const request = {
          url: new URL(MANGADEX_API)
            .addPathComponent("manga")
            .setQueryItem("limit", BATCH_SIZE.toString())
            .setQueryItem("offset", "0")
            .setQueryItem("ids[]", batchIds)
            .setQueryItem("includes[]", ["cover_art", "author", "artist"])
            .toString(),
          method: "GET",
        };

        try {
          const json = await fetchJSON<MangaDex.SearchResponse>(request);

          if (json.data) {
            const ratingRequest = {
              url: new URL(MANGADEX_API)
                .addPathComponent("statistics")
                .addPathComponent("manga")
                .setQueryItem("manga[]", batchIds)
                .toString(),
              method: "GET",
            };

            const ratingJson = await fetchJSON<MangaDex.StatisticsResponse>(ratingRequest);

            try {
              const ratingUrl = new URL(MANGADEX_API)
                .addPathComponent("rating")
                .setQueryItem("manga[]", batchIds)
                .toString();

              const ratingResponse = await fetchJSON<MangaDex.MangaRatingResponse>({
                url: ratingUrl,
                method: "GET",
              });

              if (ratingResponse.result === "ok" && ratingResponse.ratings) {
                for (const mangaId in ratingResponse.ratings) {
                  const index = mangaIdToIndexMap.get(mangaId);
                  if (index !== undefined) {
                    this.libraryManga[index].rating = ratingResponse.ratings[mangaId].rating;
                  }
                }
              }
            } catch (error) {
              console.log(`Error loading manga ratings: ${String(error)}`);
            }

            for (const mangaData of json.data) {
              const index = mangaIdToIndexMap.get(mangaData.id);
              if (index !== undefined) {
                try {
                  const mangaDetailsResponse: MangaDex.MangaDetailsResponse = {
                    result: "ok",
                    data: mangaData,
                    response: "entity",
                  };

                  const sourceManga = parseMangaDetails(
                    mangaData.id,
                    mangaDetailsResponse,
                    ratingJson,
                  );

                  this.libraryManga[index].sourceManga = sourceManga;
                } catch (error) {
                  console.log(`Error processing manga ${mangaData.id}: ${String(error)}`);
                }

                this.loadingProgress.current++;
              }
            }
          }
        } catch (error) {
          console.log(`Error loading batch of manga: ${String(error)}`);
          const failedCount = batchIds.length;
          this.loadingProgress.current += failedCount;
        }
      }

      this.libraryManga.sort((a, b) => {
        const orderA = READING_STATUS_ORDER[a.status as keyof typeof READING_STATUS_ORDER] || 999;
        const orderB = READING_STATUS_ORDER[b.status as keyof typeof READING_STATUS_ORDER] || 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        const titleA = a.sourceManga?.mangaInfo.primaryTitle?.toLowerCase() || "";
        const titleB = b.sourceManga?.mangaInfo.primaryTitle?.toLowerCase() || "";
        return titleA.localeCompare(titleB);
      });

      this.isLoaded = true;
      this.isLoading = false;
      this.reloadForm();
    } catch (error) {
      this.isLoaded = false;
      this.isLoading = false;
      this.error = `Error loading library: ${String(error)}`;
      console.log(`Error loading library: ${String(error)}`);
      this.reloadForm();
    }
  }
}
