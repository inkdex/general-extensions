import {
  Form,
  Section,
  SelectRow,
  ToggleRow,
  type FormItemElement,
  type FormSectionElement,
  type SelectRowProps,
  type ToggleRowProps,
} from "@paperback/types";
import { SUBTITLE_OPTIONS } from "../models";
import {
  getDiscoverSubtitle,
  getForceDiscoverSubtitle,
  getHiddenDiscoverSections,
  getHideAdultDiscoverResults,
  setDiscoverSubtitle,
  setForceDiscoverSubtitle,
  setHiddenDiscoverSections,
  setHideAdultDiscoverResults,
} from "./main";

export class DiscoverSettingsForm extends Form {
  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "section-visibility",
          footer: "Toggle sections on or off.",
        },
        [
          this.topViews24hRow(),
          this.topViews7dRow(),
          this.topViews30dRow(),
          this.latestUpdatesRow(),
        ],
      ),
      Section(
        {
          id: "hide-adult",
          footer: "Filter out erotica and pornographic content.",
        },
        [this.hideAdultRow()],
      ),
      Section(
        {
          id: "discover-subtitle",
          footer: "Information displayed below each title.",
        },
        [this.discoverSubtitleRow(), this.forceDiscoverSubtitleRow()],
      ),
    ];
  }

  private isVisible(sectionId: string): boolean {
    return !getHiddenDiscoverSections().includes(sectionId);
  }

  topViews24hRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Top Views (24 Hours)",
      value: this.isVisible("top-views-24h"),
      onValueChange: Application.Selector(this as DiscoverSettingsForm, "handleTopViews24h"),
    };
    return ToggleRow("toggle-top-views-24h", props);
  }

  topViews7dRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Top Views (7 Days)",
      value: this.isVisible("top-views-7d"),
      onValueChange: Application.Selector(this as DiscoverSettingsForm, "handleTopViews7d"),
    };
    return ToggleRow("toggle-top-views-7d", props);
  }

  topViews30dRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Top Views (30 Days)",
      value: this.isVisible("top-views-30d"),
      onValueChange: Application.Selector(this as DiscoverSettingsForm, "handleTopViews30d"),
    };
    return ToggleRow("toggle-top-views-30d", props);
  }

  latestUpdatesRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Latest Updates",
      value: this.isVisible("latest-updates"),
      onValueChange: Application.Selector(this as DiscoverSettingsForm, "handleLatestUpdates"),
    };
    return ToggleRow("toggle-latest-updates", props);
  }

  hideAdultRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Hide Adult Results",
      value: getHideAdultDiscoverResults(),
      onValueChange: Application.Selector(this as DiscoverSettingsForm, "handleHideAdultChange"),
    };
    return ToggleRow("hide-adult-results", props);
  }

  discoverSubtitleRow(): FormItemElement<unknown> {
    const subtitleProps: SelectRowProps = {
      title: "Discover Subtitle",
      options: SUBTITLE_OPTIONS,
      value: [getDiscoverSubtitle()],
      minItemCount: 1,
      maxItemCount: 1,
      onValueChange: Application.Selector(
        this as DiscoverSettingsForm,
        "handleDiscoverSubtitleChange",
      ),
    };

    return SelectRow("discover-subtitle", subtitleProps);
  }

  forceDiscoverSubtitleRow(): FormItemElement<unknown> {
    const props: ToggleRowProps = {
      title: "Apply to Latest Updates",
      value: getForceDiscoverSubtitle(),
      onValueChange: Application.Selector(
        this as DiscoverSettingsForm,
        "handleForceDiscoverSubtitle",
      ),
    };
    return ToggleRow("toggle-force-discover-subtitle", props);
  }

  private updateHiddenSections(sectionId: string, visible: boolean): void {
    let hidden = getHiddenDiscoverSections();

    if (visible) {
      hidden = hidden.filter((id) => id !== sectionId);
    } else {
      if (!hidden.includes(sectionId)) {
        hidden = [...hidden, sectionId];
      }
    }

    setHiddenDiscoverSections(hidden);
    this.reloadForm();
  }

  async handleTopViews24h(value: boolean): Promise<void> {
    this.updateHiddenSections("top-views-24h", value);
  }

  async handleTopViews7d(value: boolean): Promise<void> {
    this.updateHiddenSections("top-views-7d", value);
  }

  async handleTopViews30d(value: boolean): Promise<void> {
    this.updateHiddenSections("top-views-30d", value);
  }

  async handleLatestUpdates(value: boolean): Promise<void> {
    this.updateHiddenSections("latest-updates", value);
  }

  async handleHideAdultChange(value: boolean): Promise<void> {
    setHideAdultDiscoverResults(value);
    this.reloadForm();
  }

  async handleDiscoverSubtitleChange(value: string[]): Promise<void> {
    const selectedValue = value[0] ?? "status";
    setDiscoverSubtitle(selectedValue);
    this.reloadForm();
  }

  async handleForceDiscoverSubtitle(value: boolean): Promise<void> {
    setForceDiscoverSubtitle(value);
    this.reloadForm();
  }
}
