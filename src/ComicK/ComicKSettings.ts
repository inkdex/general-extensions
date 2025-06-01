import {
    ButtonRow,
    createFormState,
    Form,
    FormSectionElement,
    InputRow,
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

export function getUploaderInput(): string {
    return getState("uploader", "");
}

export function getUploaders(): string[] {
    return getState("uploaders", []);
}

export function getUploadersWhitelisted(): boolean {
    return getState("uploaders_whitelisted", false);
}

export function getSelectedUploaders(): string[] {
    return getState("uploaders_selected", []);
}

export function getUploadersFiltering(): boolean {
    return getState("uploaders_toggled", false);
}

export function getAggresiveUploadersFiltering(): boolean {
    return getState("aggressive_uploaders_filtering", false);
}

export function getStrictNameMatching(): boolean {
    return getState("strict_name_matching", false);
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
            Section("uploaderForm", [
                NavigationRow("uploaderForm", {
                    title: "Uploader Settings",
                    form: new UploaderForm(),
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

export class ChapterForm extends Form {
    override getSections(): FormSectionElement[] {
        const hideUnreleasedChapters = getHideUnreleasedChapters();
        const showVolumeNumber = getShowVolumeNumber();
        const showTitle = getShowTitle();

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

    async onShowVolumeNumber(value: boolean) {
        Application.setState(value, "show_volume_number");
    }

    async onShowTitle(value: boolean) {
        Application.setState(value, "show_title");
    }
}

export class LanguageForm extends Form {
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

export class UploaderForm extends Form {
    uploaderState = createFormState(this, "");

    override getSections(): FormSectionElement[] {
        const chapterScoreEnabled = getChapterScoreFiltering();
        const [uploader, , selectorUploader] = this.uploaderState;

        const chapterScoreFilteringSection = Section(
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
                        this as UploaderForm,
                        "onChapterScoreFiltering",
                    ),
                }),
            ],
        );

        if (chapterScoreEnabled) {
            return [chapterScoreFilteringSection];
        }

        return [
            chapterScoreFilteringSection,
            Section("modify_uploaders", [
                SelectRow("uploaders", {
                    title: "Select Uploaders",
                    value: getSelectedUploaders(),
                    options: getUploaders().map((uploader) => ({
                        id: uploader,
                        title: uploader,
                    })),
                    minItemCount: 0,
                    // @ts-expect-error We do not know the max number of uploaders that can be selected
                    maxItemCount: undefined,
                    onValueChange: Application.Selector(
                        this as UploaderForm,
                        "onSelectedUploaders",
                    ),
                }),
                InputRow("uploader", {
                    title: "Uploader Name",
                    value: uploader(),
                    onValueChange: selectorUploader,
                }),
                ButtonRow("add_uploader", {
                    title: "Add Uploader",
                    onSelect: Application.Selector(
                        this as UploaderForm,
                        "onAddUploader",
                    ),
                }),
                ButtonRow("remove_uploader", {
                    title: "Remove Uploader",
                    onSelect: Application.Selector(
                        this as UploaderForm,
                        "onRemoveUploader",
                    ),
                }),
            ]),
            Section("select_uploaders", [
                ToggleRow("toggle_uploaders_filtering", {
                    title: "Enable Uploader filtering",
                    value: getUploadersFiltering(),
                    onValueChange: Application.Selector(
                        this as UploaderForm,
                        "onUploadersFiltering",
                    ),
                }),
                ToggleRow("uploaders_switch", {
                    title: "Enable whitelist mode",
                    value: getUploadersWhitelisted(),
                    onValueChange: Application.Selector(
                        this as UploaderForm,
                        "onUploadersWhitelisted",
                    ),
                }),
                ToggleRow("toggle_uploaders_filtering_aggressiveness", {
                    title: "Toggle aggressive filtering",
                    value: getAggresiveUploadersFiltering(),
                    onValueChange: Application.Selector(
                        this as UploaderForm,
                        "onAggressiveFiltering",
                    ),
                }),
                ToggleRow("strict_name_matching", {
                    title: "Strict uploader name matching",
                    value: getStrictNameMatching(),
                    onValueChange: Application.Selector(
                        this as UploaderForm,
                        "onStrictNameMatching",
                    ),
                }),
            ]),
        ];
    }

    async onAddUploader() {
        const [uploader, setUploader] = this.uploaderState;
        const uploaders = getUploaders();
        if (uploader().trim().length == 0) {
            throw new Error("Uploader name cannot be blank.");
        }
        if (!/^[a-zA-Z0-9]+$/.test(uploader())) {
            throw new Error("Uploader name must be alphanumeric.");
        }
        if (uploader() in uploaders) {
            throw new Error(`Uploader ${uploader()} already exists.`);
        }

        Application.setState([...uploaders, uploader()], "uploaders");

        await setUploader("");
    }

    async onRemoveUploader() {
        const [uploader, setUploader] = this.uploaderState;
        const uploaders = getUploaders();
        if (uploader().trim().length == 0) {
            throw new Error("Uploader name cannot be blank.");
        }
        if (!uploaders.includes(uploader())) {
            throw new Error(`Uploader ${uploader()} does not exist.`);
        }

        Application.setState(
            uploaders.filter((i) => i !== uploader()),
            "uploaders",
        );

        await setUploader("");
    }

    async onChapterScoreFiltering(value: boolean) {
        Application.setState(value, "chapter_score_filtering");
        this.reloadForm();
    }

    async onSelectedUploaders(value: string[]) {
        Application.setState(value, "uploaders_selected");
    }

    async onUploadersFiltering(value: boolean) {
        Application.setState(value, "uploaders_toggled");
    }

    async onUploadersWhitelisted(value: boolean) {
        Application.setState(value, "uploaders_whitelisted");
    }

    async onAggressiveFiltering(value: boolean) {
        Application.setState(value, "aggressive_uploaders_filtering");
    }

    async onStrictNameMatching(value: boolean) {
        Application.setState(value, "strict_name_matching");
    }
}

export class DebugForm extends Form {
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
