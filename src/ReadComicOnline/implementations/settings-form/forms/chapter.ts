import {
  Form,
  Section,
  ToggleRow,
  type FormItemElement,
  type FormSectionElement,
  type ToggleRowProps,
} from "@paperback/types";
import { getUseHighQualityImages, setUseHighQualityImages } from "./main";

export class ChapterSettingsForm extends Form {
  override getSections(): FormSectionElement<unknown>[] {
    return [Section("chapterSettings", [this.useHighQualityImagesRow()])];
  }

  useHighQualityImagesRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Use High Quality Images",
      value: getUseHighQualityImages(),
      onValueChange: Application.Selector(
        this as ChapterSettingsForm,
        "handleUseHighQualityImagesChange",
      ),
    };

    return ToggleRow("use-high-quality-images", props);
  }

  async handleUseHighQualityImagesChange(value: boolean): Promise<void> {
    setUseHighQualityImages(value);
    this.reloadForm();
  }
}
