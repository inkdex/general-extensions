import {
  ButtonRow,
  Form,
  LabelRow,
  Section,
  SelectRow,
  URL,
  WebViewRow,
  type Chapter,
  type FormItemElement,
  type FormSectionElement,
  type SourceManga,
} from "@paperback/types";
import { getSelectedCover, removeSelectedCover, setSelectedCover } from "../MangaDexSettings";
import { ChapterProvider } from "../providers/ChapterProvider";
import { MangaProvider } from "../providers/MangaProvider";
import { COVER_BASE_URL, fetchJSON, MANGADEX_API } from "../utils/CommonUtil";

/**
 * Form for viewing and managing manga reading progress
 * Allows changing reading status, rating, and viewing chapters
 */
export class MangaProgressForm extends Form {
  private isChaptersLoaded: boolean = false;
  private isChaptersLoading: boolean = false;
  private loadError: string | null = null;
  private isCoversLoaded: boolean = false;
  private isCoversLoading: boolean = false;
  private coversLoadError: string | null = null;
  private covers: MangaDex.CoverArtItem[] | null = null;
  private selectedCoverId: string | undefined;

  constructor(
    private sourceManga: SourceManga,
    private currentStatus: string = "none",
    private readChapterIds: Set<string> | null = null,
    private chapters: Chapter[] | null = null,
    private chapterProvider?: ChapterProvider,
    private currentRating: number = -1,
  ) {
    super();
    this.isChaptersLoaded = chapters !== null && readChapterIds !== null;

    if (this.isChaptersLoaded) {
      this.chapters = chapters || [];
      this.readChapterIds = readChapterIds || new Set();
    }

    const selectedCover = getSelectedCover(this.sourceManga.mangaId);
    this.selectedCoverId = selectedCover?.id;
  }

  override get requiresExplicitSubmission(): boolean {
    return true;
  }

  /**
   * Helper to determine if text will be too long for UI layout
   */
  private isTextTooLong(title: string, value: string): boolean {
    const getVisualLength = (text: string): number => {
      let length = 0;
      for (const char of text) {
        if (/[wmWM]/.test(char)) {
          length += 1.5;
        } else if (/[iltfjrI!.,']/.test(char)) {
          length += 0.5;
        } else {
          length += 1;
        }
      }
      return length;
    };

    return getVisualLength(title) + getVisualLength(value) + 2 > 45;
  }

  /**
   * Cleans description text by removing URLs and manga title references
   */
  private cleanDescription(description: string | undefined): string {
    if (!description) return "";

    const mangaTitle = this.sourceManga.mangaInfo.primaryTitle;
    const cleanedDescription = description
      .replace(/(https?:\/\/|www\.)[^\s]+/g, "")
      .replace(new RegExp(this.escapeRegExp(mangaTitle), "gi"), "")
      .replace(new RegExp(this.escapeRegExp(mangaTitle.replace(/[^\w\s]/g, "")), "gi"), "")
      .trim();

    return cleanedDescription.length < 10 ? "" : cleanedDescription;
  }

  /**
   * Escapes special characters in a string for safe use in RegExp
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  override getSections(): FormSectionElement[] {
    const formattedStatus = this.currentStatus
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const tagRows: FormItemElement<unknown>[] = [];
    if (this.sourceManga.mangaInfo.tagGroups?.length) {
      for (const tagGroup of this.sourceManga.mangaInfo.tagGroups) {
        if (tagGroup.tags.length) {
          tagRows.push(
            LabelRow(`tag_group_${tagGroup.id}`, {
              title: tagGroup.title,
              subtitle: tagGroup.tags.map((tag) => tag.title).join(", "),
            }),
          );
        }
      }
    }

    const formattedRating =
      this.currentRating === -1
        ? "Not rated"
        : this.currentRating === 0
          ? "Remove Rating"
          : `${this.currentRating}0%`;

    const sections: FormSectionElement[] = [
      Section("manga_info", [
        this.isTextTooLong("Title", this.sourceManga.mangaInfo.primaryTitle)
          ? LabelRow("title", {
              title: "Title",
              subtitle: this.sourceManga.mangaInfo.primaryTitle,
            })
          : LabelRow("title", {
              title: "Title",
              value: this.sourceManga.mangaInfo.primaryTitle,
            }),
        this.isTextTooLong("Author", this.sourceManga.mangaInfo.author || "Unknown")
          ? LabelRow("author", {
              title: "Author",
              subtitle: this.sourceManga.mangaInfo.author || "Unknown",
            })
          : LabelRow("author", {
              title: "Author",
              value: this.sourceManga.mangaInfo.author || "Unknown",
            }),
        ...(this.sourceManga.mangaInfo.artist
          ? [
              LabelRow("artist", {
                title: "Artist",
                value: this.sourceManga.mangaInfo.artist,
              }),
            ]
          : []),
        LabelRow("status", {
          title: "Status",
          value: this.sourceManga.mangaInfo.status || "Unknown",
        }),
        ...(this.sourceManga.mangaInfo.rating !== undefined
          ? [
              LabelRow("rating", {
                title: "Rating",
                value: `${(this.sourceManga.mangaInfo.rating * 100).toFixed(0)}%`,
              }),
            ]
          : []),
        LabelRow("content_rating", {
          title: "Content Rating",
          value: this.sourceManga.mangaInfo.contentRating,
        }),
        ...tagRows,
      ]),
    ];

    if (this.sourceManga.mangaInfo.secondaryTitles?.length) {
      sections.push(
        Section("alternative_titles", [
          LabelRow("alt_titles", {
            title: "Alternative Titles",
            subtitle: this.sourceManga.mangaInfo.secondaryTitles.join("| "),
          }),
        ]),
      );
    }

    sections.push(
      Section("synopsis", [
        LabelRow("synopsis", {
          title: "Synopsis",
          subtitle: this.sourceManga.mangaInfo.synopsis || "No synopsis available",
        }),
      ]),
    );

    sections.push(
      Section("reading_status", [
        LabelRow("current_status", {
          title: "Current Status",
          value: formattedStatus,
        }),
        SelectRow("reading_status", {
          title: "Change Status",
          subtitle: `Currently: ${formattedStatus}`,
          value: [this.currentStatus],
          options: [
            { id: "reading", title: "Reading" },
            { id: "on_hold", title: "On Hold" },
            { id: "plan_to_read", title: "Plan to Read" },
            { id: "dropped", title: "Dropped" },
            { id: "re_reading", title: "Re-Reading" },
            { id: "completed", title: "Completed" },
            { id: "none", title: "Not added" },
            { id: "remove", title: "Remove from Library" },
          ],
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as MangaProgressForm, "handleStatusChange"),
        }),
      ]),
    );

    sections.push(
      Section("rating_section", [
        LabelRow("current_rating", {
          title: "Current Rating",
          value: formattedRating,
        }),
        SelectRow("change_rating", {
          title: "Set Rating",
          subtitle: `Currently: ${formattedRating}`,
          value: [this.currentRating.toString()],
          options: [
            { id: "-1", title: "Not Rated" },
            { id: "0", title: "0% - Remove Rating" },
            { id: "1", title: "10%" },
            { id: "2", title: "20%" },
            { id: "3", title: "30%" },
            { id: "4", title: "40%" },
            { id: "5", title: "50%" },
            { id: "6", title: "60%" },
            { id: "7", title: "70%" },
            { id: "8", title: "80%" },
            { id: "9", title: "90%" },
            { id: "10", title: "100%" },
          ],
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as MangaProgressForm, "handleRatingChange"),
        }),
      ]),
    );

    if (!this.isCoversLoaded && !this.isCoversLoading) {
      sections.push(
        Section("load_covers", [
          ButtonRow("load_covers_button", {
            title: "Load Cover Artwork",
            onSelect: Application.Selector(this as MangaProgressForm, "handleLoadCovers"),
          }),
        ]),
      );
    } else if (this.isCoversLoading) {
      sections.push(
        Section("loading_covers_section", [
          LabelRow("loading_covers", {
            title: "Loading...",
            subtitle: "Fetching cover artwork, please wait",
          }),
        ]),
      );
    } else if (this.coversLoadError) {
      sections.push(
        Section("covers_error_section", [
          LabelRow("covers_error", {
            title: "Error",
            subtitle: this.coversLoadError,
          }),
          ButtonRow("try_again_covers", {
            title: "Try Again",
            onSelect: Application.Selector(this as MangaProgressForm, "handleLoadCovers"),
          }),
        ]),
      );
    } else if (this.isCoversLoaded && this.covers && this.covers.length > 0) {
      const coversItems: FormItemElement<unknown>[] = [];

      coversItems.push(
        LabelRow("covers_list_header", {
          title: "Cover Artwork",
          subtitle: `${this.covers.length} covers available - Select a cover to use`,
        }),
      );

      const coverOptions = [
        { id: "", title: "Default Cover" },
        ...this.covers.map((cover) => {
          const cleanedDescription = this.cleanDescription(cover.attributes.description);
          const descriptionPart = cleanedDescription ? ` - ${cleanedDescription}` : "";
          return {
            id: cover.id,
            title: `Vol ${cover.attributes.volume || "?"}${descriptionPart}`,
          };
        }),
      ];

      coversItems.push(
        SelectRow("selected_cover", {
          title: "Selected Cover",
          subtitle: this.selectedCoverId
            ? coverOptions.find((opt) => opt.id === this.selectedCoverId)?.title || "Custom Cover"
            : "Default Cover",
          value: [this.selectedCoverId || ""],
          options: coverOptions,
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as MangaProgressForm, "handleCoverChange"),
        }),
      );

      coversItems.push(
        LabelRow("cover_preview_label", {
          title: "Cover Preview",
          subtitle: "Tap a cover below to view it in full size",
        }),
      );

      this.covers.forEach((cover, index) => {
        const coverUrl = `${COVER_BASE_URL}/${this.sourceManga.mangaId}/${cover.attributes.fileName}`;

        const isSelected = this.selectedCoverId ? this.selectedCoverId === cover.id : index === 0;

        const cleanedDescription = this.cleanDescription(cover.attributes.description);
        const descriptionPart = cleanedDescription ? ` - ${cleanedDescription}` : "";

        coversItems.push(
          WebViewRow(`cover_webview_${cover.id}`, {
            title: `${isSelected ? "✓ " : ""}Vol ${cover.attributes.volume || "?"}${descriptionPart}`,
            request: {
              url: coverUrl,
              method: "GET",
            },
            onComplete: Application.Selector(this as MangaProgressForm, "handleWebViewComplete"),
            onCancel: Application.Selector(this as MangaProgressForm, "handleWebViewCancel"),
          }),
        );
      });

      sections.push(Section("cover_list", coversItems));
    } else if (this.isCoversLoaded && this.covers) {
      sections.push(
        Section("no_covers", [
          LabelRow("no_covers_available", {
            title: "No covers available",
            subtitle: "No cover artwork was found for this manga",
          }),
        ]),
      );
    }

    const totalChapters =
      (this.sourceManga.chapterCount ?? 0) > 0
        ? this.sourceManga.chapterCount
        : this.isChaptersLoaded && this.chapters && this.chapters.length > 0
          ? this.chapters.length
          : 0;

    let unreadChapters = this.sourceManga.unreadChapterCount || 0;
    if (unreadChapters === 0 && this.isChaptersLoaded && this.chapters && this.readChapterIds) {
      unreadChapters = this.chapters.filter(
        (chapter) => !this.readChapterIds?.has(chapter.chapterId),
      ).length;
    }

    let newChapters = this.sourceManga.newChapterCount || 0;
    if (newChapters === 0 && this.isChaptersLoaded && this.chapters && this.readChapterIds) {
      newChapters = this.chapters.filter(
        (chapter) => !this.readChapterIds?.has(chapter.chapterId),
      ).length;
    }

    sections.push(
      Section("chapter_stats", [
        LabelRow("total_chapters", {
          title: "Total Chapters",
          value: `${totalChapters}`,
        }),
        LabelRow("unread_chapters", {
          title: "Unread Chapters",
          value: `${unreadChapters}`,
        }),
        LabelRow("new_chapters", {
          title: "New Chapters",
          value: `${newChapters}`,
        }),
      ]),
    );

    if (!this.isChaptersLoaded && !this.isChaptersLoading) {
      sections.push(
        Section("load_chapters", [
          ButtonRow("load_chapters_button", {
            title: "Load Chapter Details",
            onSelect: Application.Selector(this as MangaProgressForm, "handleLoadChapters"),
          }),
        ]),
      );
    } else if (this.isChaptersLoading) {
      sections.push(
        Section("loading_section", [
          LabelRow("loading", {
            title: "Loading...",
            subtitle: "Fetching chapter information, please wait",
          }),
        ]),
      );
    } else if (this.loadError) {
      sections.push(
        Section("error_section", [
          LabelRow("error", {
            title: "Error",
            subtitle: this.loadError,
          }),
          ButtonRow("try_again", {
            title: "Try Again",
            onSelect: Application.Selector(this as MangaProgressForm, "handleLoadChapters"),
          }),
        ]),
      );
    }

    if (this.isChaptersLoaded && this.chapters && this.chapters.length > 0) {
      const chapterItems: FormItemElement<unknown>[] = [];

      chapterItems.push(
        LabelRow("chapter_list_header", {
          title: "Chapter List",
          subtitle: `${this.chapters.length} chapters available - Read chapters are marked with ✓`,
        }),
      );

      for (const chapter of this.chapters) {
        const isRead = this.readChapterIds?.has(chapter.chapterId) || false;
        const readMark = isRead ? "✓ " : "";

        let chapterTitle = `${readMark}`;

        if (chapter.volume) {
          chapterTitle += `Vol ${chapter.volume} `;
        }

        chapterTitle += `Ch ${chapter.chapNum}`;

        if (chapter.title) {
          chapterTitle += `: ${chapter.title}`;
        }

        chapterItems.push(
          LabelRow(`chapter_${chapter.chapterId}`, {
            title: chapterTitle,
            subtitle: `${chapter.version || ""}`,
          }),
        );
      }

      sections.push(Section("chapter_list", chapterItems));
    } else if (this.isChaptersLoaded && this.chapters) {
      sections.push(
        Section("chapter_list", [
          LabelRow("no_chapters", {
            title: "No chapters available",
            subtitle: "No chapters were found for this manga",
          }),
        ]),
      );
    }

    return sections;
  }

  /**
   * Loads chapter data and read status from MangaDex
   */
  async handleLoadChapters(): Promise<void> {
    if (this.isChaptersLoaded || this.isChaptersLoading) return;

    this.isChaptersLoading = true;
    this.loadError = null;
    this.reloadForm();

    try {
      if (!this.chapterProvider) {
        const mangaProvider = new MangaProvider();
        this.chapterProvider = new ChapterProvider(mangaProvider);
      }

      const readUrl = new URL(MANGADEX_API)
        .addPathComponent("manga")
        .addPathComponent(this.sourceManga.mangaId)
        .addPathComponent("read")
        .toString();

      this.readChapterIds = new Set<string>();
      const readResponse = await fetchJSON<MangaDex.MangaReadResponse>({
        url: readUrl,
        method: "GET",
      });

      if (readResponse.result === "ok" && readResponse.data) {
        this.readChapterIds = new Set(readResponse.data);
      }

      this.chapters = await this.chapterProvider.getChapters(this.sourceManga, undefined, true);

      this.isChaptersLoaded = true;
      this.isChaptersLoading = false;
      this.reloadForm();
    } catch (error) {
      this.isChaptersLoaded = false;
      this.isChaptersLoading = false;
      this.loadError = `Error loading chapter data: ${String(error)}`;
      this.chapters = [];
      this.readChapterIds = new Set();
      this.reloadForm();
    }
  }

  /**
   * Loads cover artwork for the manga
   */
  async handleLoadCovers(): Promise<void> {
    if (this.isCoversLoaded || this.isCoversLoading) return;

    this.isCoversLoading = true;
    this.coversLoadError = null;
    this.reloadForm();

    try {
      const coversUrl = new URL(MANGADEX_API)
        .addPathComponent("cover")
        .setQueryItem("manga[]", this.sourceManga.mangaId)
        .setQueryItem("limit", "100")
        .setQueryItem("order[volume]", "desc")
        .setQueryItem("order[createdAt]", "desc")
        .toString();

      const coversResponse = await fetchJSON<MangaDex.CoverArtResponse>({
        url: coversUrl,
        method: "GET",
      });

      if (coversResponse.result === "ok" && coversResponse.data) {
        this.covers = coversResponse.data;
      } else {
        throw new Error("Failed to load covers");
      }

      this.isCoversLoaded = true;
      this.isCoversLoading = false;
      this.reloadForm();
    } catch (error) {
      this.isCoversLoaded = false;
      this.isCoversLoading = false;
      this.coversLoadError = `Error loading cover artwork: ${String(error)}`;
      this.covers = [];
      this.reloadForm();
    }
  }

  /**
   * Handles updating the user's rating for the manga
   */
  async handleRatingChange(value: string[]): Promise<void> {
    if (value.length === 0) return;

    const newRating = parseInt(value[0], 10);
    if (newRating === this.currentRating) return;

    this.currentRating = newRating;
    this.reloadForm();
  }

  /**
   * Handles updating the user's reading status for the manga
   */
  async handleStatusChange(value: string[]): Promise<void> {
    if (value.length === 0) return;

    const newStatus = value[0];
    if (newStatus === this.currentStatus) return;

    this.currentStatus = newStatus;
    this.reloadForm();
  }

  /**
   * Handles when a cover is selected
   */
  async handleCoverChange(value: string[]): Promise<void> {
    if (value.length === 0) return;

    const newCoverId = value[0];
    if (newCoverId === this.selectedCoverId) return;

    if (newCoverId === "") {
      removeSelectedCover(this.sourceManga.mangaId);
      this.selectedCoverId = undefined;
    } else {
      const selectedCover = this.covers?.find((cover) => cover.id === newCoverId);
      if (selectedCover) {
        setSelectedCover(this.sourceManga.mangaId, newCoverId, selectedCover.attributes.fileName);
        this.selectedCoverId = newCoverId;
      }
    }

    this.reloadForm();
  }

  /**
   * Handles WebView completion for cover preview
   */
  async handleWebViewComplete(): Promise<void> {}

  /**
   * Handles WebView cancellation for cover preview
   */
  async handleWebViewCancel(): Promise<void> {}

  override formDidCancel(): void {}

  /**
   * Submits changes to reading status and rating to MangaDex
   */
  override async formDidSubmit(): Promise<void> {
    try {
      if (this.currentStatus !== "none") {
        const url = new URL(MANGADEX_API);
        url.addPathComponent("manga");
        url.addPathComponent(this.sourceManga.mangaId);
        url.addPathComponent("status");
        const statusUrl = url.toString();

        const statusRequest = {
          url: statusUrl,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: {
            status: this.currentStatus === "remove" ? null : this.currentStatus,
          },
        };

        try {
          const statusResponse = await fetchJSON<MangaDex.MangaStatusUpdateResponse>(statusRequest);
          if (statusResponse.result !== "ok") {
            throw new Error(
              `Failed to update reading status: ${JSON.stringify(statusResponse.errors)}`,
            );
          }
        } catch (error) {
          throw new Error(`Failed to update reading status: ${String(error)}`);
        }
      }

      if (this.currentRating !== -1) {
        const ratingUrl = new URL(MANGADEX_API)
          .addPathComponent("rating")
          .addPathComponent(this.sourceManga.mangaId)
          .toString();

        if (this.currentRating > 0) {
          try {
            const ratingResponse = await fetchJSON<MangaDex.MangaRatingUpdateResponse>({
              url: ratingUrl,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: {
                rating: this.currentRating,
              },
            });

            if (ratingResponse.result !== "ok") {
              console.log(
                `Warning: Failed to set rating: ${JSON.stringify(ratingResponse.errors)}`,
              );
            }
          } catch (error) {
            console.log(`Error setting rating: ${String(error)}`);
          }
        } else if (this.currentRating === 0) {
          try {
            const ratingResponse = await fetchJSON<MangaDex.MangaRatingUpdateResponse>({
              url: ratingUrl,
              method: "DELETE",
            });

            if (ratingResponse.result !== "ok") {
              console.log(
                `Warning: Failed to remove rating: ${JSON.stringify(ratingResponse.errors)}`,
              );
            }
          } catch (error) {
            console.log(`Error removing rating: ${String(error)}`);
          }
        }
      }
    } catch (error) {
      console.log(`Error updating manga progress: ${String(error)}`);
      throw new Error(`Failed to update manga progress: ${String(error)}`);
    }
  }
}
