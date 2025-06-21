import {
    Form,
    FormSectionElement,
    Section,
    SelectRow,
    SettingsFormProviding,
    ToggleRow,
} from "@paperback/types";
import { Language, LanguagesOptions } from "./WebtoonI18NHelper";

const CANVAS_WANTED = "canvas_wanted";
const LANGUAGES = "languages";
export const BASE_URL = "https://www.webtoons.com";
export const MOBILE_URL = "https://m.webtoons.com";

function toBoolean(value: unknown): boolean {
    return (value ?? false) === "true";
}

export abstract class WebtoonSettings implements SettingsFormProviding {
    get canvasWanted(): boolean {
        return toBoolean(Application.getState(CANVAS_WANTED));
    }

    set canvasWanted(value: boolean) {
        Application.setState(value.toString(), CANVAS_WANTED);
    }

    get languages(): Language[] {
        return (
            (Application.getState(LANGUAGES) as Language[]) ?? [
                Language.ENGLISH,
            ]
        );
    }

    set languages(value: string[]) {
        Application.setState(value, LANGUAGES);
    }

    async getSettingsForm(): Promise<Form> {
        return new WebtoonSettingForm(this);
    }
}

class WebtoonSettingForm extends Form {
    private settings: WebtoonSettings;

    constructor(settings: WebtoonSettings) {
        super();
        this.settings = settings;
    }

    override getSections(): FormSectionElement[] {
        return [
            Section("settings", [
                SelectRow(LANGUAGES, {
                    title: "Languages",
                    value: this.settings.languages,
                    minItemCount: 1,
                    maxItemCount: 200,
                    options: LanguagesOptions,
                    onValueChange: Application.Selector(
                        this as WebtoonSettingForm,
                        "setLanguages",
                    ),
                }),
                ToggleRow(CANVAS_WANTED, {
                    title: "Show Canvas",
                    value: this.settings.canvasWanted,
                    onValueChange: Application.Selector(
                        this as WebtoonSettingForm,
                        "setCanvasWanted",
                    ),
                }),
            ]),
        ];
    }

    async setCanvasWanted(value: boolean): Promise<void> {
        this.settings.canvasWanted = value;
    }

    async setLanguages(value: string[]): Promise<void> {
        this.settings.languages = value;
    }
}
