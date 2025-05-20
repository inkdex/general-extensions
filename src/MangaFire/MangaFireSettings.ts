import {
    Form,
    FormSectionElement,
    LabelRow,
    NavigationRow,
    Section,
    SelectRow,
} from "@paperback/types";

// Language Helper Class
class MFLanguagesClass {
    Languages = [
        { name: "English", MDCode: "en", flagCode: "🇬🇧", default: true },
        { name: "Français", MDCode: "fr", flagCode: "🇫🇷" },
        { name: "Español", MDCode: "es", flagCode: "🇪🇸" },
        { name: "Español (Latinoamérica)", MDCode: "es-la", flagCode: "🇲🇽" },
        { name: "Português", MDCode: "pt", flagCode: "🇵🇹" },
        { name: "Português (Brasil)", MDCode: "pt-br", flagCode: "🇧🇷" },
        { name: "日本語", MDCode: "ja", flagCode: "🇯🇵" },
    ];

    constructor() {
        // Sort languages by name
        this.Languages = this.Languages.sort((a, b) =>
            a.name > b.name ? 1 : -1,
        );
    }

    getCodeList(): string[] {
        return this.Languages.map((language) => language.MDCode);
    }

    getName(code: string): string {
        return (
            this.Languages.find((language) => language.MDCode === code)?.name ??
            "Unknown"
        );
    }

    getFlagCode(code: string): string {
        return (
            this.Languages.find((language) => language.MDCode === code)
                ?.flagCode ?? "🏳️"
        );
    }

    getDefault(): string[] {
        return this.Languages.filter((language) => language.default).map(
            (language) => language.MDCode,
        );
    }
}

export const MFLanguages = new MFLanguagesClass();

export function getLanguages(): string[] {
    return (
        (Application.getState("languages") as string[] | undefined) ??
        MFLanguages.getDefault()
    );
}

export function setLanguages(languages: string[]): void {
    Application.setState(languages, "languages");
}

// Main Settings Form
export class MangaFireSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("mainSettings", [
                LabelRow("settingsLabel", {
                    title: "MangaFire Settings",
                    subtitle: "Configure your reading experience",
                }),
                NavigationRow("contentSettings", {
                    title: "Content Settings",
                    subtitle: "Languages and display options",
                    form: new ContentSettingsForm(),
                }),
            ]),
        ];
    }
}

// Content Settings Form
export class ContentSettingsForm extends Form {
    private languagesState: {
        value: string[];
        updateValue: (newValue: string[]) => Promise<void>;
    };

    constructor() {
        super();
        const languages = getLanguages();
        this.languagesState = {
            value: languages,
            updateValue: async (newValue: string[]) => {
                this.languagesState.value = newValue;
                setLanguages(newValue);
            },
        };
    }

    async updateValue(value: string[]): Promise<void> {
        this.languagesState.value = value;
        setLanguages(value);
    }

    override getSections(): FormSectionElement[] {
        return [
            Section("contentSettings", [
                LabelRow("contentSettingsLabel", {
                    title: "Content Settings",
                    subtitle: "Configure your reading experience",
                }),
                SelectRow("languages", {
                    title: "Languages",
                    subtitle: (() => {
                        const selectedLangCodes = this.languagesState.value;
                        const selectedLangNames = selectedLangCodes
                            .map(
                                (langCode) =>
                                    `${MFLanguages.getFlagCode(langCode)} ${MFLanguages.getName(
                                        langCode,
                                    )}`,
                            )
                            .sort();
                        return selectedLangNames.join(", ");
                    })(),
                    value: this.languagesState.value,
                    options: MFLanguages.getCodeList().map((code) => ({
                        id: code,
                        title: `${MFLanguages.getFlagCode(code)} ${MFLanguages.getName(code)}`,
                    })),
                    minItemCount: 1,
                    maxItemCount: MFLanguages.getCodeList().length,
                    onValueChange: Application.Selector(
                        this as ContentSettingsForm,
                        "updateValue",
                    ),
                }),
            ]),
        ];
    }
}
