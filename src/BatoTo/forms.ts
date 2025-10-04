import { Form, FormSectionElement, Section, SelectRow } from "@paperback/types";
import { languages } from "./languages";

export function getLanguages(): string[] {
    return (
        (Application.getState("languages") as string[] | undefined) ?? ["en"]
    );
}

export class BatoToSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section(
                {
                    id: "languageSettings",
                    footer: "Filter mangas by language. At least one language must be selected.",
                },
                [
                    SelectRow("languages", {
                        title: "Languages",
                        value: getLanguages(),
                        minItemCount: 1,
                        maxItemCount: languages.length,
                        options: languages.map((lang) => ({
                            id: lang.value,
                            title: lang.name,
                        })),
                        onValueChange: Application.Selector(
                            this as BatoToSettingsForm,
                            "updateLanguages",
                        ),
                    }),
                ],
            ),
        ];
    }

    async updateLanguages(value: string[]): Promise<void> {
        Application.setState(value, "languages");
        this.reloadForm();
    }
}
