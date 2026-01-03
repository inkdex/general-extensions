import {
  Form,
  Section,
  SelectRow,
  type FormSectionElement,
} from "@paperback/types";
import { Languages, MirrorDomains } from "./models";

const DEFAULT_MIRROR = "dto.to";

export function getLanguages(): string[] {
  return (Application.getState("languages") as string[] | undefined) ?? ["en"];
}

export function getSelectedMirror(): string[] {
  return (
    (Application.getState("selectedMirror") as string[] | undefined) ?? [
      DEFAULT_MIRROR,
    ]
  );
}

export class BatoToSettingsForm extends Form {
  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "languageSettings",
          footer:
            "Filter mangas by language. At least one language must be selected.",
        },
        [
          SelectRow("languages", {
            title: "Languages",
            value: getLanguages(),
            minItemCount: 1,
            maxItemCount: Languages.length,
            options: Languages.map((lang) => ({
              id: lang.value,
              title: lang.name,
            })),
            onValueChange: Application.Selector(
              this as BatoToSettingsForm,
              "updateLanguages"
            ),
          }),
        ]
      ),
      Section(
        {
          id: "mirrorSettings",
          footer:
            "Select mirror to use. Some mirrors may be down, verify by visiting the url on your browser.",
        },
        [
          SelectRow("selectedMirror", {
            title: "Select Mirror",
            value: getSelectedMirror(),
            minItemCount: 1,
            maxItemCount: 1,
            options: MirrorDomains.map((domain) => ({
              id: domain,
              title: domain,
            })),
            onValueChange: Application.Selector(
              this as BatoToSettingsForm,
              "updatedSelectedMirror"
            ),
          }),
        ]
      ),
    ];
  }

  async updateLanguages(value: string[]): Promise<void> {
    Application.setState(value, "languages");
    this.reloadForm();
  }

  async updatedSelectedMirror(value: string[]): Promise<void> {
    Application.setState(value, "selectedMirror");
    this.reloadForm();
  }
}
