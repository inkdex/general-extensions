/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  closureSelector,
  EditSection,
  Form,
  FormConfirmationError,
  LabelRow,
  NavigationRow,
  Section,
  SelectRow,
  StepperRow,
  ToggleRow,
} from "@paperback/types";

import { DISCOVERY_SECTIONS, type SectionEntry } from "../models";
import {
  contentRatings,
  contentTypes,
  ensureFilters,
  filters,
  getContentRating,
  getHiddenDemographics,
  getHiddenGenres,
  getShowOnlyTypes,
  getYear,
  horizontalChapterSections,
  horizontalRecentSection,
  horizontalTrendingSections,
  useYearFilter,
} from "../utils/filters";

export function getDiscoverySectionsOrder(): SectionEntry[] {
  return (Application.getState("sections") as SectionEntry[] | undefined) ?? DISCOVERY_SECTIONS;
}

function getDeletedSections(): SectionEntry[] {
  return (Application.getState("deleted_sections") as SectionEntry[] | undefined) ?? [];
}

function saveSetting(form: Form, key: string, value: unknown): void {
  Application.setState(value, key);
  Application.invalidateDiscoverSections();
  form.reloadForm();
}

export class ComixSettingsForm extends Form {
  override getSections() {
    return [
      Section("settings", [
        NavigationRow("Contents", {
          title: "Contents",
          subtitle: "Contents Tags Settings",
          form: new FilterSettings(),
        }),
        ButtonRow("reload_genres", {
          title: "Reload all Filters",
          onSelect: Application.Selector(this as ComixSettingsForm, "refreshFilters"),
        }),
      ]),
      Section("home_sections", [
        NavigationRow("HomeSections", {
          title: "Home Sections",
          subtitle: "Home Sections Settings",
          form: new SectionSettings(),
        }),
      ]),
    ];
  }

  async refreshFilters() {
    await ensureFilters(true);
    this.reloadForm();
  }
}

class FilterSettings extends Form {
  override getSections() {
    return [
      Section({ id: "update_settings", footer: "Tags Settings" }, [
        SelectRow("hide_genres", {
          title: "Hide Genres",
          subtitle: "Hide Some Genre",
          layout: "list",
          value: getHiddenGenres(),
          items: filters.genres,
          minItemCount: 0,
          maxItemCount: filters.genres.length,
          onValueChange: Application.Selector(this as FilterSettings, "handleHideGenresChange"),
        }),
        SelectRow("hide_demog", {
          title: "Hide Demographic Type",
          subtitle: "Hide Some Demographic Type",
          layout: "list",
          value: getHiddenDemographics(),
          items: filters.demographic,
          minItemCount: 0,
          maxItemCount: filters.demographic.length,
          onValueChange: Application.Selector(this as FilterSettings, "handleHideDemogChange"),
        }),
      ]),
      Section({ id: "type_settings", footer: "Type Settings" }, [
        SelectRow("type", {
          title: "Content Type",
          subtitle: "Show Only this type of content",
          layout: "list",
          value: getShowOnlyTypes(),
          items: contentTypes,
          minItemCount: 0,
          maxItemCount: contentTypes.length,
          onValueChange: Application.Selector(this as FilterSettings, "handleShowOnlyChange"),
        }),
      ]),
      Section({ id: "content_rating", footer: "Content Rating" }, [
        SelectRow("content_rating", {
          title: "Content Rating",
          value: getContentRating(),
          items: contentRatings,
          layout: "list",
          minItemCount: 1,
          maxItemCount: contentRatings.length,
          onValueChange: Application.Selector(this as FilterSettings, "handleContentRatingChange"),
        }),
      ]),
      Section({ id: "reset_settings", footer: "Reset Settings" }, [
        ButtonRow("reset_genres", {
          title: "Reset all Filters",
          onSelect: Application.Selector(this as FilterSettings, "confirmResetFilters"),
        }),
      ]),
    ];
  }

  async handleHideGenresChange(id: string[]) {
    saveSetting(this, "hide_genres", id);
  }
  async handleHideDemogChange(id: string[]) {
    saveSetting(this, "hide_demog", id);
  }
  async handleShowOnlyChange(id: string[]) {
    saveSetting(this, "show_only", id);
  }
  async handleContentRatingChange(id: string[]) {
    saveSetting(this, "content_rating", id);
  }
  async confirmResetFilters() {
    throw new FormConfirmationError(
      Application.Selector(this as FilterSettings, "resetFilters"),
      "Do you want to reset all values?",
    );
  }
  async resetFilters() {
    for (const key of ["hide_genres", "hide_demog", "show_only"]) {
      Application.setState([], key);
    }
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }
}

class SectionSettings extends Form {
  override getSections() {
    return [
      ...(this.isEnabled("updatesHot") || this.isEnabled("updatesNew")
        ? [
            Section({ id: "latestSectionSettings", header: "Latest Section Settings" }, [
              ToggleRow("sectionType", {
                title: "Horizontal List View",
                subtitle:
                  "Enable to display the latest sections as a horizontal list. Disable to show it in a table layout",
                value: horizontalChapterSections(),
                onValueChange: Application.Selector(
                  this as SectionSettings,
                  "handleChapterSectionChange",
                ),
              }),
            ]),
          ]
        : []),
      ...(this.isEnabled("trending_manga") || this.isEnabled("trending_wt")
        ? [
            Section({ id: "trendingSectionSettings", header: "Trending Section Settings" }, [
              ToggleRow("sectionType", {
                title: "Horizontal List View",
                subtitle:
                  "Enable to display the trending sections as a horizontal list. Disable to show it in a table layout",
                value: horizontalTrendingSections(),
                onValueChange: Application.Selector(
                  this as SectionSettings,
                  "handleTrendingSectionChange",
                ),
              }),
              ToggleRow("allTimes", {
                title: "Filter Trending Sections by Year",
                subtitle: "Enable or disable year-based filtering",
                value: useYearFilter(),
                onValueChange: Application.Selector(
                  this as SectionSettings,
                  "handleYearTimesChange",
                ),
              }),
              StepperRow("yearSettings", {
                title: "Year",
                subtitle: "Select the year",
                value: getYear(),
                minValue: 2023,
                maxValue: new Date().getFullYear(),
                stepValue: 1,
                loopOver: false,
                onValueChange: Application.Selector(this as SectionSettings, "handleYearChange"),
                isHidden: !useYearFilter(),
              }),
            ]),
          ]
        : []),
      ...(this.isEnabled("recent")
        ? [
            Section({ id: "recentSectionSettings", header: "Recent Section Settings" }, [
              ToggleRow("sectionType", {
                title: "Horizontal List View",
                subtitle:
                  "Enable to display the recent section as a horizontal list. Disable to show it in a table layout",
                value: horizontalRecentSection(),
                onValueChange: Application.Selector(
                  this as SectionSettings,
                  "handleRecentSectionChange",
                ),
              }),
            ]),
          ]
        : []),
      Section({ id: "sectionsOrderSettings", header: "Sections Order" }, [
        NavigationRow("sectionOrder", {
          title: "Sections Order",
          subtitle: "Sections Order",
          form: new SectionOrderForm(),
        }),
      ]),
    ];
  }

  async handleChapterSectionChange(value: boolean) {
    saveSetting(this, "chapterSection", value);
  }
  async handleTrendingSectionChange(value: boolean) {
    saveSetting(this, "trendingSection", value);
  }
  async handleRecentSectionChange(value: boolean) {
    saveSetting(this, "recentSection", value);
  }
  async handleYearTimesChange(value: boolean) {
    saveSetting(this, "yearTimes", value);
  }
  async handleYearChange(value: number) {
    saveSetting(this, "year_settings", value);
  }

  private isEnabled(id: string) {
    return !getDeletedSections().some((item) => item.id === id);
  }
}

class SectionOrderForm extends Form {
  override getSections() {
    const deleted = getDeletedSections();
    return [
      EditSection("edit", {
        id: "edit",
        header: "Section order",
        footer: "Long press to reorder, swipe to hide",
        items: getDiscoverySectionsOrder().map((item) => LabelRow(item.id, { title: item.title })),
        allowDeletion: true,
        allowReorder: true,
        onReorder: Application.Selector(this as SectionOrderForm, "rowDidReorder"),
        onDeletion: Application.Selector(this as SectionOrderForm, "rowDidDelete"),
      }),
      ...(deleted.length > 0
        ? [
            Section(
              { id: "addSectionSelect", footer: "Tap to restore" },
              deleted.map((item) =>
                LabelRow(item.id, {
                  title: item.title,
                  onSelect: closureSelector(this, "restore_" + item.id, () =>
                    this.restoreSection(item.id),
                  ),
                }),
              ),
            ),
          ]
        : []),
      Section("status", [
        ButtonRow("reset", {
          title: "Reset all Sections",
          isHidden: getDeletedSections().length == 0,
          onSelect: Application.Selector(this as SectionOrderForm, "confirmResetSections"),
        }),
      ]),
    ];
  }

  async confirmResetSections() {
    throw new FormConfirmationError(
      Application.Selector(this as SectionOrderForm, "resetSections"),
      "Do you want to restore all deleted sections?",
    );
  }

  async resetSections(): Promise<void> {
    Application.setState(DISCOVERY_SECTIONS, "sections");
    Application.setState([], "deleted_sections");
    this.reloadForm();
  }

  async rowDidDelete(index: number): Promise<void> {
    const sections = getDiscoverySectionsOrder();
    const deleted = sections.splice(index, 1);
    Application.setState([...getDeletedSections(), ...deleted], "deleted_sections");
    Application.setState(sections, "sections");
    this.reloadForm();
  }

  async rowDidReorder(sourceIndex: number, destinationIndex: number): Promise<void> {
    const sections = getDiscoverySectionsOrder();
    const [item] = sections.splice(sourceIndex, 1);
    if (item) {
      sections.splice(destinationIndex, 0, item);
    }
    Application.setState(sections, "sections");
    this.reloadForm();
    Application.invalidateDiscoverSections();
  }

  private async restoreSection(id: string): Promise<void> {
    const deleted = getDeletedSections();
    const restored = deleted.find((item) => item.id === id);
    if (!restored) return;
    Application.setState([...getDiscoverySectionsOrder(), restored], "sections");
    Application.setState(
      deleted.filter((item) => item.id !== id),
      "deleted_sections",
    );
  }
}
