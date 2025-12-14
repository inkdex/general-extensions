import {
  ButtonRow,
  Form,
  LabelRow,
  Section,
  ToggleRow,
  type FormSectionElement,
} from "@paperback/types";

function toBoolean(value: unknown): boolean {
  return (value ?? false) === "true";
}

export function getHQthumb(): boolean {
  return toBoolean(Application.getState("HQthumb"));
}

export function getShowUpcomingChapters(): boolean {
  return toBoolean(Application.getState("prerelease"));
}

export function setHQthumb(value: boolean): void {
  Application.setState(value.toString(), "HQthumb");
}

export function setShowUpcomingChapters(value: boolean): void {
  Application.setState(value.toString(), "prerelease");
}

export function clearTags(): void {
  Application.setState(undefined, "tags");
}

export class AsuraSettingForm extends Form {
  override getSections(): FormSectionElement[] {
    return [
      Section("first", [
        ToggleRow("pre", {
          title: "Show Upcoming Chapters",
          value: getShowUpcomingChapters(),
          onValueChange: Application.Selector(this as AsuraSettingForm, "preChange"),
        }),
        LabelRow("label", {
          title: "",
          subtitle:
            "Enabling HQ thumbnails will use more bandwidth and will load thumbnails slightly slower.",
        }),
      ]),
      Section("second", [
        ButtonRow("clearTags", {
          title: "Clear Cached Search Tags",
          onSelect: Application.Selector(this as AsuraSettingForm, "tagsChange"),
        }),
        ButtonRow("resetState", {
          title: "Reset All State",
          onSelect: Application.Selector(this as AsuraSettingForm, "resetState"),
        }),
        LabelRow("resetStateLabel", {
          title: "",
          subtitle:
            "Clicking this will reset all state for this extension. Do not click unless you know what you are doing.",
        }),
      ]),
    ];
  }

  async hQthumbChange(value: boolean): Promise<void> {
    setHQthumb(value);
  }

  async preChange(value: boolean): Promise<void> {
    setShowUpcomingChapters(value);
  }

  async tagsChange(): Promise<void> {
    clearTags();
  }

  async resetState(): Promise<void> {
    Application.resetAllState();
  }
}
