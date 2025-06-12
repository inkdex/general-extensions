import {
    Form,
    FormSectionElement,
    NavigationRow,
    Section,
    SelectRow,
    ToggleRow,
} from "@paperback/types";
import { getState } from "../utils/state";
import { getLanguageOptions } from "./utils/language";

export function getLanguages(): string[] {
    return getState("languages", ["all"]);
}

export function getLanguageHomeFilter(): boolean {
    return getState("language_home_filter", false);
}

export function getShowTitle(): boolean {
    return getState("show_title", false);
}

export function getShowVolumeNumber(): boolean {
    return getState("show_volume_number", false);
}

export function getChapterScoreFiltering(): boolean {
    return getState("chapter_score_filtering", false);
}

export function getHideUnreleasedChapters(): boolean {
    return getState("hide_unreleased_chapters", true);
}

export function getCloudflareRateLimitBackoff(): boolean {
    return getState("cloudflare_rate_limit_backoff", false);
}

export class ComicKSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("languageForm", [
                NavigationRow("languageFprm", {
                    title: "Language Settings",
                    form: new LanguageForm(),
                }),
            ]),
            Section("chapterForm", [
                NavigationRow("chapterForm", {
                    title: "Chapter Settings",
                    form: new ChapterForm(),
                }),
            ]),
            Section("debugForm", [
                NavigationRow("debugForm", {
                    title: "Debug Settings",
                    form: new DebugForm(),
                }),
            ]),
        ];
    }
}

class ChapterForm extends Form {
    override getSections(): FormSectionElement[] {
        const hideUnreleasedChapters = getHideUnreleasedChapters();
        const showVolumeNumber = getShowVolumeNumber();
        const showTitle = getShowTitle();
        const chapterScoreEnabled = getChapterScoreFiltering();

        return [
            Section(
                {
                    id: "chapterUnreleased",
                    footer: "Hide chapters that are not yet released.",
                },
                [
                    ToggleRow("hide_unreleased_chapters", {
                        title: "Hide Unreleased Chapters",
                        value: hideUnreleasedChapters,
                        onValueChange: Application.Selector(
                            this as ChapterForm,
                            "onHideUnreleasedChapters",
                        ),
                    }),
                ],
            ),
            Section(
                {
                    id: "chapter_score_filtering",
                    footer: chapterScoreEnabled
                        ? "Show only the uploader with the most upvotes for each chapter. Disable to manually manage uploader filtering"
                        : "Show only the uploader with the most upvotes for each chapter.",
                },
                [
                    ToggleRow("toggle_chapter_score_filtering", {
                        title: "Enable Chapter Score Filtering",
                        value: chapterScoreEnabled,
                        onValueChange: Application.Selector(
                            this as ChapterForm,
                            "onChapterScoreFiltering",
                        ),
                    }),
                ],
            ),
            Section(
                {
                    id: "chapterContent",
                    footer: "Chapter list formatting.",
                },
                [
                    ToggleRow("show_volume_number", {
                        title: "Show Chapter Volume",
                        value: showVolumeNumber,
                        onValueChange: Application.Selector(
                            this as ChapterForm,
                            "onShowVolumeNumber",
                        ),
                    }),
                    ToggleRow("show_title", {
                        title: "Show Chapter Title",
                        value: showTitle,
                        onValueChange: Application.Selector(
                            this as ChapterForm,
                            "onShowTitle",
                        ),
                    }),
                ],
            ),
        ];
    }

    async onHideUnreleasedChapters(value: boolean) {
        Application.setState(value, "hide_unreleased_chapters");
    }

    async onChapterScoreFiltering(value: boolean) {
        Application.setState(value, "chapter_score_filtering");
    }

    async onShowVolumeNumber(value: boolean) {
        Application.setState(value, "show_volume_number");
    }

    async onShowTitle(value: boolean) {
        Application.setState(value, "show_title");
    }
}

class LanguageForm extends Form {
    override getSections(): FormSectionElement[] {
        const language = getLanguages();
        const languageHomeFilter = getLanguageHomeFilter();

        return [
            Section(
                {
                    id: "languageContent",
                    footer: "When enabled, it will filter New & Hot based on which languages that were chosen.",
                },
                [
                    SelectRow("languages", {
                        title: "Languages",
                        options: getLanguageOptions(),
                        value: language,
                        minItemCount: 1,
                        maxItemCount: 45,
                        onValueChange: Application.Selector(
                            this as LanguageForm,
                            "onSetLanguage",
                        ),
                    }),
                    ToggleRow("language_home_filter", {
                        title: "Filter Homepage Language",
                        value: languageHomeFilter,
                        onValueChange: Application.Selector(
                            this as LanguageForm,
                            "onLanguageHomeFilter",
                        ),
                    }),
                ],
            ),
        ];
    }

    async onSetLanguage(value: string[]) {
        // Get current languages
        const currentLanguages = getLanguages();

        // If "all" is being added, set only "all"
        const added = value.filter((v) => !currentLanguages.includes(v));
        if (added.includes("all")) {
            Application.setState(["all"], "languages");
            return;
        }

        // If "all" is currently selected and other languages are being added,
        // remove "all" from the selection
        let finalValue = value;
        if (currentLanguages.includes("all") && value.length > 1) {
            finalValue = value.filter((lang) => lang !== "all");
        }

        Application.setState(finalValue, "languages");
    }

    async onLanguageHomeFilter(value: boolean) {
        Application.setState(value, "language_home_filter");
    }
}

class DebugForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section({ id: "debug" }, [
                ToggleRow("cloudflare_rate_limit_backoff_switch", {
                    title: "Enable dynamic Cloudflare rate limit handling",
                    value: getCloudflareRateLimitBackoff(),
                    onValueChange: Application.Selector(
                        this as DebugForm,
                        "onCloudflareRateLimitBackoff",
                    ),
                }),
            ]),
        ];
    }

    async onCloudflareRateLimitBackoff(value: boolean) {
        Application.setState(value, "cloudflare_rate_limit_backoff");
    }
}
