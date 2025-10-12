import {
    ButtonRow,
    Form,
    Section,
    type FormSectionElement,
} from "@paperback/types";

export class SettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("tags", [
                ButtonRow("clearTags", {
                    title: "Clear Cached Search Tags",
                    onSelect: Application.Selector(
                        this as SettingsForm,
                        "clearTags",
                    ),
                }),
            ]),
        ];
    }

    async clearTags(): Promise<void> {
        Application.setState(undefined, "tags");
    }
}
