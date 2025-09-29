import { Form, FormSectionElement, Section, SelectRow } from "@paperback/types";
import { BTTLanguages } from "./helper";

// Function to get the selected languages from the application state
export function getLanguages(): string[] {
    return (
        (Application.getState("languages") as string[] | undefined) ??
        BTTLanguages.getDefault()
    );
}

// Class for managing language settings in a form
export class BatoToSettingsForm extends Form {
    // State management for the languages field
    private languagesState = new State<string[]>(
        this,
        "languages",
        getLanguages(),
    );

    // Override to define the sections of the form
    override getSections(): FormSectionElement[] {
        return [
            this.createLanguageSettingsSection(), // Only language-related section
        ];
    }

    // Create the language settings section
    private createLanguageSettingsSection(): FormSectionElement {
        return Section("languageSettings", [
            SelectRow("languages", {
                title: "Languages",
                value: this.languagesState.value,
                minItemCount: 1,
                maxItemCount: 100,
                options: BTTLanguages.getlangCodeList().map((x: string) => ({
                    id: x,
                    title: BTTLanguages.getName(x),
                })),
                onValueChange: this.languagesState.selector,
            }),
        ]);
    }
}

// Class for managing state of a form field
class State<T> {
    private _value: T;
    public get value(): T {
        return this._value;
    }

    public get selector(): SelectorID<(value: T) => Promise<void>> {
        return Application.Selector(this as State<T>, "updateValue");
    }

    constructor(
        private form: Form,
        private persistKey: string,
        value: T,
    ) {
        this._value = value;
    }

    // Update the state value and persist it
    public async updateValue(value: T): Promise<void> {
        this._value = value;
        Application.setState(value, this.persistKey);
        this.form.reloadForm();
    }
}
