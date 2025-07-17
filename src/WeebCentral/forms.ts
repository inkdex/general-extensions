import {
    ButtonRow,
    Form,
    FormSectionElement,
    LabelRow,
    Section,
} from "@paperback/types";

export class SettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("second", [
                ButtonRow("clearTags", {
                    title: "Clear Cached Search Tags",
                    onSelect: Application.Selector(
                        this as SettingsForm,
                        "clearTags",
                    ),
                }),
                ButtonRow("resetState", {
                    title: "Reset All State",
                    onSelect: Application.Selector(
                        this as SettingsForm,
                        "resetState",
                    ),
                }),
                LabelRow("resetStateLabel", {
                    title: "",
                    subtitle:
                        "Clicking this will reset all state for this extension. Do not click unless you know what you are doing.",
                }),
            ]),
        ];
    }

    async clearTags(): Promise<void> {
        Application.setState(undefined, "tags");
    }

    async resetState(): Promise<void> {
        Application.resetAllState();
    }
}
