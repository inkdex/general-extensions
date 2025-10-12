import {
    Form,
    Section,
    ToggleRow,
    type FormSectionElement,
} from "@paperback/types";
import {
    getRelevanceScoringEnabled,
    getShowChapter,
    getShowRatingIcons,
    getShowSearchRatingInSubtitle,
    getShowStatusIcons,
    getShowVolume,
    setRelevanceScoringEnabled,
    setShowChapter,
    setShowRatingIcons,
    setShowSearchRatingInSubtitle,
    setShowStatusIcons,
    setShowVolume,
} from "../MangaDexSettings";
import { State } from "../utils/StateUtil";

/**
 * Form for configuring search result settings
 * Controls display options and sort order for search results
 */
export class SearchSettingsForm extends Form {
    // Settings state objects
    private volumeState = new State<boolean>(
        this,
        "show_volume_in_subtitle",
        getShowVolume(),
    );
    private chapterState = new State<boolean>(
        this,
        "show_chapter_in_subtitle",
        getShowChapter(),
    );
    private statusIconsState = new State<boolean>(
        this,
        "show_status_icons",
        getShowStatusIcons(),
    );
    private ratingIconsState = new State<boolean>(
        this,
        "show_content_rating_icons",
        getShowRatingIcons(),
    );
    private relevanceScoringState = new State<boolean>(
        this,
        "relevance_scoring_enabled",
        getRelevanceScoringEnabled(),
    );
    private showSearchRatingSubtitleState = new State<boolean>(
        this,
        "show_search_rating_subtitle",
        getShowSearchRatingInSubtitle(),
    );

    override getSections(): FormSectionElement[] {
        return [
            Section("sorting", [
                ToggleRow("relevance_scoring_enabled", {
                    title: "Enable Relevance Scoring",
                    subtitle:
                        "Improved sort order for search results based on title relevance",
                    value: this.relevanceScoringState.value,
                    onValueChange: Application.Selector(
                        this as SearchSettingsForm,
                        "handleRelevanceScoringChange",
                    ),
                }),
            ]),
            Section("subtitle_content", [
                ToggleRow("show_volume_in_subtitle", {
                    title: "Show Volume in Subtitle",
                    subtitle:
                        "This may not be accurate for your language due to API",
                    value: this.volumeState.value,
                    onValueChange: Application.Selector(
                        this as SearchSettingsForm,
                        "handleVolumeChange",
                    ),
                }),
                ToggleRow("show_chapter_in_subtitle", {
                    title: "Show Chapter in Subtitle",
                    subtitle:
                        "This may not be accurate for your language due to API",
                    value: this.chapterState.value,
                    onValueChange: Application.Selector(
                        this as SearchSettingsForm,
                        "handleChapterChange",
                    ),
                }),
                ToggleRow("show_search_rating_subtitle", {
                    title: "Show Rating in Subtitle",
                    subtitle:
                        "Displays the manga's average rating. Increases loading time by a few seconds",
                    value: this.showSearchRatingSubtitleState.value,
                    onValueChange: Application.Selector(
                        this as SearchSettingsForm,
                        "handleShowSearchRatingSubtitleChange",
                    ),
                }),
            ]),
            Section("subtitle_icons", [
                ToggleRow("show_status_icons", {
                    title: "Show Status Icons in Subtitle",
                    subtitle:
                        "✅ Completed, ▶️ Ongoing, ⏸️ Hiatus, ❌ Cancelled",
                    value: this.statusIconsState.value,
                    onValueChange: Application.Selector(
                        this as SearchSettingsForm,
                        "handleStatusIconsChange",
                    ),
                }),
                ToggleRow("show_content_rating_icons", {
                    title: "Show Content Rating Icons in Subtitle",
                    subtitle: "🟢 Safe, 🟡 Suggestive, 🟠 Erotica, 🔞 Adult",
                    value: this.ratingIconsState.value,
                    onValueChange: Application.Selector(
                        this as SearchSettingsForm,
                        "handleRatingIconsChange",
                    ),
                }),
            ]),
        ];
    }

    // Settings change handlers
    async handleVolumeChange(value: boolean): Promise<void> {
        await this.volumeState.updateValue(value);
        setShowVolume(value);
        this.reloadForm();
    }

    async handleChapterChange(value: boolean): Promise<void> {
        await this.chapterState.updateValue(value);
        setShowChapter(value);
        this.reloadForm();
    }

    async handleStatusIconsChange(value: boolean): Promise<void> {
        await this.statusIconsState.updateValue(value);
        setShowStatusIcons(value);
        this.reloadForm();
    }

    async handleRatingIconsChange(value: boolean): Promise<void> {
        await this.ratingIconsState.updateValue(value);
        setShowRatingIcons(value);
        this.reloadForm();
    }

    async handleRelevanceScoringChange(value: boolean): Promise<void> {
        await this.relevanceScoringState.updateValue(value);
        setRelevanceScoringEnabled(value);
        this.reloadForm();
    }

    async handleShowSearchRatingSubtitleChange(value: boolean): Promise<void> {
        await this.showSearchRatingSubtitleState.updateValue(value);
        setShowSearchRatingInSubtitle(value);
        this.reloadForm();
    }
}
