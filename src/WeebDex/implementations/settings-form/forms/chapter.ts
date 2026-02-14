import {
  Form,
  Section,
  ToggleRow,
  type FormItemElement,
  type FormSectionElement,
  type ToggleRowProps,
} from "@paperback/types";
import { getHideBonusChapters, setHideBonusChapters } from "./main";

export class ChapterSettingsForm extends Form {
  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "bonus-chapters",
          footer: "Filter out chapters with decimal numbers (e.g. 1.1, 2.5).",
        },
        [this.hideBonusChaptersRow()],
      ),
    ];
  }

  hideBonusChaptersRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Hide Bonus Chapters",
      value: getHideBonusChapters(),
      onValueChange: Application.Selector(this as ChapterSettingsForm, "handleHideBonusChapters"),
    };
    return ToggleRow("hide-bonus-chapters", props);
  }

  async handleHideBonusChapters(value: boolean): Promise<void> {
    setHideBonusChapters(value);
    this.reloadForm();
  }
}
