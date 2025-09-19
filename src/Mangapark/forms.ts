import {
    Form,
    FormSectionElement,
    LabelRow,
    NavigationRow,
    Section,
    SelectRow,
} from "@paperback/types";
import { STATIC_SEARCH_DETAILS } from "./model";

export function getBlacklistGenres(): string[] {
    return (
        (Application.getState("blacklistGenres") as string[] | undefined) ?? []
    );
}

export function getWhitelistGenres(): string[] {
    return (
        (Application.getState("whitelistGenres") as string[] | undefined) ?? []
    );
}

export function getGenres(): { id: string; label: string }[] {
    return STATIC_SEARCH_DETAILS.genres;
}

export function setGenres(genres: { id: string; label: string }[]): void {
    Application.setState(genres, "genres");
}

export function setLanguages(languages: string[]): void {
    Application.setState(languages, "languages");
}

export function setWhitelistGenres(genres: string[]): void {
    Application.setState(genres, "whitelistGenres");
}

export function setBlacklistGenres(genres: string[]): void {
    Application.setState(genres, "blacklistGenres");
}

export function getDemographics(): { id: string; label: string }[] {
    return STATIC_SEARCH_DETAILS.demographics;
}

export function setDemographics(
    demographics: { id: string; label: string }[],
): void {
    Application.setState(demographics, "demographics");
}

export function getBlacklistDemographics(): string[] {
    return (
        (Application.getState("blacklistDemographics") as
            | string[]
            | undefined) ?? []
    );
}

export function getWhitelistDemographics(): string[] {
    return (
        (Application.getState("whitelistDemographics") as
            | string[]
            | undefined) ?? []
    );
}

export function setBlacklistDemographics(demographics: string[]): void {
    Application.setState(demographics, "blacklistDemographics");
}

export function setWhitelistDemographics(demographics: string[]): void {
    Application.setState(demographics, "whitelistDemographics");
}

// Chapter Filtering Setting
export function getEnableChapterFiltering(): boolean {
    return (
        (Application.getState("enableChapterFiltering") as
            | boolean
            | undefined) ?? false
    );
}

export function setEnableChapterFiltering(value: boolean): void {
    Application.setState(value, "enableChapterFiltering");
}

// Main Settings Form
export class SettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("mainSettings", [
                LabelRow("settingsLabel", {
                    title: "Mangapark Settings",
                    subtitle: "Configure extension behavior",
                }),
                NavigationRow("contentSettings", {
                    title: "Content Settings",
                    subtitle: "Chapters display preferences",
                    form: new ContentSettingsForm(),
                }),
            ]),
        ];
    }
}

// Content Settings Form
export class ContentSettingsForm extends Form {
    private chapterFilteringState: {
        value: boolean;
        updateValue: (newValue: string[]) => Promise<void>;
    };
    private blacklistGenresState: {
        value: string[];
        updateValue: (newValue: string[]) => Promise<void>;
    };
    private whitelistGenresState: {
        value: string[];
        updateValue: (newValue: string[]) => Promise<void>;
    };
    private blacklistDemographicsState: {
        value: string[];
        updateValue: (newValue: string[]) => Promise<void>;
    };
    private whitelistDemographicsState: {
        value: string[];
        updateValue: (newValue: string[]) => Promise<void>;
    };

    constructor() {
        super();
        const filteringEnabled = getEnableChapterFiltering();
        this.chapterFilteringState = {
            value: filteringEnabled,
            updateValue: async (newValue: string[]) => {
                const enabled = (newValue?.[0] ?? "off") === "on";
                this.chapterFilteringState.value = enabled;
                setEnableChapterFiltering(enabled);
            },
        };
        const blacklistGenres = getBlacklistGenres();
        this.blacklistGenresState = {
            value: blacklistGenres,
            updateValue: async (newValue: string[]) => {
                this.blacklistGenresState.value = newValue;
                setBlacklistGenres(newValue);
            },
        };
        const whitelistGenres = getWhitelistGenres();
        this.whitelistGenresState = {
            value: whitelistGenres,
            updateValue: async (newValue: string[]) => {
                this.whitelistGenresState.value = newValue;
                setWhitelistGenres(newValue);
            },
        };
        const blacklistDemographics = getBlacklistDemographics();
        this.blacklistDemographicsState = {
            value: blacklistDemographics,
            updateValue: async (newValue: string[]) => {
                this.blacklistDemographicsState.value = newValue;
                setBlacklistDemographics(newValue);
            },
        };
        const whitelistDemographics = getWhitelistDemographics();
        this.whitelistDemographicsState = {
            value: whitelistDemographics,
            updateValue: async (newValue: string[]) => {
                this.whitelistDemographicsState.value = newValue;
                setWhitelistDemographics(newValue);
            },
        };
    }

    async updateChapterFiltering(value: string[]): Promise<void> {
        const enabled = (value?.[0] ?? "off") === "on";
        this.chapterFilteringState.value = enabled;
        setEnableChapterFiltering(enabled);
    }

    async updateBlacklistGenres(value: string[]): Promise<void> {
        this.blacklistGenresState.value = value;
        setBlacklistGenres(value);
    }

    async updateWhitelistGenres(value: string[]): Promise<void> {
        this.whitelistGenresState.value = value;
        setWhitelistGenres(value);
    }

    async updateBlacklistDemographics(value: string[]): Promise<void> {
        this.blacklistDemographicsState.value = value;
        setBlacklistDemographics(value);
    }

    async updateWhitelistDemographics(value: string[]): Promise<void> {
        this.whitelistDemographicsState.value = value;
        setWhitelistDemographics(value);
    }

    override getSections(): FormSectionElement[] {
        return [
            Section("contentSettings", [
                LabelRow("contentSettingsLabel", {
                    title: "Content Settings",
                    subtitle: "Configure your reading experience",
                }),
                SelectRow("enableChapterFiltering", {
                    title: "Enable Chapter Filtering",
                    subtitle: this.chapterFilteringState.value
                        ? "On: Show one version per chapter with prioritization"
                        : "Off: Show all versions",
                    value: [this.chapterFilteringState.value ? "on" : "off"],
                    options: [
                        { id: "on", title: "On" },
                        { id: "off", title: "Off" },
                    ],
                    minItemCount: 1,
                    maxItemCount: 1,
                    onValueChange: Application.Selector(
                        this as ContentSettingsForm,
                        "updateChapterFiltering",
                    ),
                }),
                SelectRow("whitelistGenres", {
                    title: "Whitelist Genres",
                    subtitle: "Select genres to include in your search results",
                    value: this.whitelistGenresState.value,
                    options: getGenres().map((genre) => ({
                        id: genre.id,
                        title: genre.label,
                    })),
                    minItemCount: 0,
                    maxItemCount: Math.max(1, getGenres().length),
                    onValueChange: Application.Selector(
                        this as ContentSettingsForm,
                        "updateWhitelistGenres",
                    ),
                }),
                SelectRow("blacklistGenres", {
                    title: "Blacklist Genres",
                    subtitle:
                        "Select genres to exclude from your search results",
                    value: this.blacklistGenresState.value,
                    options: getGenres().map((genre) => ({
                        id: genre.id,
                        title: genre.label,
                    })),
                    minItemCount: 0,
                    maxItemCount: Math.max(1, getGenres().length),
                    onValueChange: Application.Selector(
                        this as ContentSettingsForm,
                        "updateBlacklistGenres",
                    ),
                }),
                SelectRow("whitelistDemographics", {
                    title: "Whitelist Demographics",
                    subtitle:
                        "Select demographics to include in your search results",
                    value: this.whitelistDemographicsState.value,
                    options: getDemographics().map((demo) => ({
                        id: demo.id,
                        title: demo.label,
                    })),
                    minItemCount: 0,
                    maxItemCount: Math.max(1, getDemographics().length),
                    onValueChange: Application.Selector(
                        this as ContentSettingsForm,
                        "updateWhitelistDemographics",
                    ),
                }),
                SelectRow("blacklistDemographics", {
                    title: "Blacklist Demographics",
                    subtitle:
                        "Select demographics to exclude from your search results",
                    value: this.blacklistDemographicsState.value,
                    options: getDemographics().map((demo) => ({
                        id: demo.id,
                        title: demo.label,
                    })),
                    minItemCount: 0,
                    maxItemCount: Math.max(1, getDemographics().length),
                    onValueChange: Application.Selector(
                        this as ContentSettingsForm,
                        "updateBlacklistDemographics",
                    ),
                }),
            ]),
        ];
    }
}
