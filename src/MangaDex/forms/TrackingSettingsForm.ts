import { Form, Section, SelectRow, ToggleRow, type FormSectionElement } from "@paperback/types";
import { MDRatings } from "../MangaDexHelper";
import {
  getAccessToken,
  getChapterPreloadingEnabled,
  getMangaProgressEnabled,
  getTrackingContentRatings,
  getTrackingEnabled,
  setChapterPreloadingEnabled,
  setMangaProgressEnabled,
  setTrackingContentRatings,
  setTrackingEnabled,
} from "../MangaDexSettings";
import { State } from "../utils/StateUtil";

/**
 * Form for configuring reading tracking settings
 * Controls how manga reading progress is tracked and synced
 */
export class TrackingSettingsForm extends Form {
  // Settings state objects
  private trackingEnabledState = new State<boolean>(this, "tracking_enabled", getTrackingEnabled());
  private mangaProgressEnabledState = new State<boolean>(
    this,
    "manga_progress_enabled",
    getMangaProgressEnabled(),
  );
  private chapterPreloadingEnabledState = new State<boolean>(
    this,
    "chapter_preloading_enabled",
    getChapterPreloadingEnabled(),
  );
  private trackingContentRatingsState = new State<string[]>(
    this,
    "tracking_content_ratings",
    getTrackingContentRatings(),
  );

  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "tracking_settings",
          footer:
            "Note: Tracking only supports reading status, API has read history disabled. This means manga progress will point the first chapter for now.",
        },
        [
          ToggleRow("tracking_enabled", {
            title: "Enable Tracking",
            value: this.trackingEnabledState.value,
            onValueChange: Application.Selector(
              this as TrackingSettingsForm,
              "handleTrackingEnabledChange",
            ),
          }),
          ToggleRow("manga_progress_enabled", {
            title: "Enable Manga Progress",
            subtitle:
              "Continue reading from your saved chapter progress in the paper airplane icon",
            value: this.mangaProgressEnabledState.value,
            onValueChange: Application.Selector(
              this as TrackingSettingsForm,
              "handleMangaProgressEnabledChange",
            ),
          }),
          ToggleRow("chapter_preloading_enabled", {
            title: "Enable Chapter Preloading",
            subtitle: "Preload chapter data when viewing manga progress. Disable to load faster",
            value: this.chapterPreloadingEnabledState.value,
            onValueChange: Application.Selector(
              this as TrackingSettingsForm,
              "handleChapterPreloadingEnabledChange",
            ),
          }),
          SelectRow("tracking_content_ratings", {
            title: "Content Ratings to Track",
            value: this.trackingContentRatingsState.value,
            options: MDRatings.getEnumList()
              .map((x) => ({
                id: x,
                title: MDRatings.getName(x),
              }))
              .concat([{ id: "unknown", title: "Unknown" }]),
            minItemCount: 0,
            maxItemCount: 5,
            onValueChange: Application.Selector(
              this as TrackingSettingsForm,
              "handleTrackingContentRatingsChange",
            ),
          }),
        ],
      ),
    ];
  }

  // Settings change handlers
  async handleTrackingEnabledChange(value: boolean): Promise<void> {
    if (!getAccessToken()) {
      throw new Error("You need to be logged in to enable tracking");
    }
    await this.trackingEnabledState.updateValue(value);
    setTrackingEnabled(value);
    this.reloadForm();
  }

  async handleMangaProgressEnabledChange(value: boolean): Promise<void> {
    if (!getAccessToken()) {
      throw new Error("You need to be logged in to enable manga progress");
    }
    await this.mangaProgressEnabledState.updateValue(value);
    setMangaProgressEnabled(value);
    this.reloadForm();
  }

  async handleChapterPreloadingEnabledChange(value: boolean): Promise<void> {
    await this.chapterPreloadingEnabledState.updateValue(value);
    setChapterPreloadingEnabled(value);
    this.reloadForm();
  }

  async handleTrackingContentRatingsChange(value: string[]): Promise<void> {
    await this.trackingContentRatingsState.updateValue(value);
    setTrackingContentRatings(value);
    this.reloadForm();
  }
}
