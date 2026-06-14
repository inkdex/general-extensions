/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  EditSection,
  Form,
  FormConfirmationError,
  type FormItemElement,
  type FormSectionElement,
  LabelRow,
  NavigationRow,
  Section,
  SelectRow,
  ToggleRow,
} from "@paperback/types";

import { discoverySections, ORIGIN } from "../models";
import type { MangaDotApi } from "../network";
import {
  getContentTypes,
  getGenresHidden,
  getSectionContentTypes,
  getShowAdultStatus,
  updateFilters,
  getFilters,
  getThemesHidden,
  getDemographicHidden,
  getMoreHidden,
  getRangeStatus,
} from "../utils";

export class SettingsForm extends Form {
  api: MangaDotApi;
  constructor(api: MangaDotApi) {
    super();
    this.api = api;
  }
  override getSections() {
    const filters = getFilters();
    return [
      Section(
        {
          id: "update_settings",
          header: "Default Search Filter",
        },
        [
          SelectRow("type", {
            title: "Content Type",
            subtitle: "This settings only as default search filter",
            value: getContentTypes(),
            options: ORIGIN,
            minItemCount: 0,
            maxItemCount: ORIGIN.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleTypeStatusChange"),
          }),
          SelectRow("hide_genres", {
            title: "Hide Genres",
            subtitle: "Default value for contents",
            value: getGenresHidden(),
            options: filters.genre,
            minItemCount: 0,
            maxItemCount: filters.genre.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideGenresStatusChange",
            ),
          }),
          SelectRow("hide_demographic", {
            title: "Hide Demographic",
            subtitle: "Default value for contents",
            value: getDemographicHidden(),
            options: filters.demographic,
            minItemCount: 0,
            maxItemCount: filters.demographic.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideDemographicStatusChange",
            ),
          }),
          SelectRow("hide_themes", {
            title: "Hide Themes",
            subtitle: "Default value for contents",
            value: getThemesHidden(),
            options: filters.themeAndContent,
            minItemCount: 0,
            maxItemCount: filters.themeAndContent.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleHideThemesStatusChange",
            ),
          }),
          SelectRow("hide_more", {
            title: "Hide More",
            subtitle: "Default value for contents",
            value: getMoreHidden(),
            options: filters.more,
            minItemCount: 0,
            maxItemCount: filters.more.length,
            onValueChange: Application.Selector(this as SettingsForm, "handleHideMoreStatusChange"),
          }),
        ],
      ),
      Section(
        {
          id: "section_settings",
          header: "Sections Settings",
          footer: "This settings apply on sections only",
        },
        [
          SelectRow("section_type", {
            title: "Content Type",
            value: getSectionContentTypes(),
            options: ORIGIN,
            minItemCount: 1,
            maxItemCount: ORIGIN.length,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleSectionTypeStatusChange",
            ),
          }),
          ToggleRow("range_type", {
            title: "Use Time range in sections",
            subtitle:
              "Day/Week/Month ranges may return fewer items and do not contain some information",
            value: getRangeStatus(),
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleRangeTypeStatusChange",
            ),
          }),
          NavigationRow("sectionOrder", {
            title: "Sections Order",
            subtitle: "Sections Order",
            form: new EditableListTestForm(),
          }),
        ],
      ),
      Section(
        {
          id: "global_settings",
          header: "Global Settings",
        },
        [
          SelectRow("toggle_adult", {
            title: "Show Adult results",
            value: getShowAdultStatus(),
            options: [
              { id: "0", title: "No" },
              { id: "1", title: "Yes" },
              { id: "both", title: "Both" },
            ],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleShowAdultStatusChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "reset_settings",
          footer: "Filters",
        },
        [
          ButtonRow("reload_genres", {
            title: "Refresh genres filters",
            onSelect: Application.Selector(this as SettingsForm, "resetFiltersDialog"),
          }),
        ],
      ),
    ];
  }

  async updateValue<T>(value: T, filter: string): Promise<void> {
    Application.setState(value, filter);
    this.reloadForm();
  }

  async handleShowAdultStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "show_adult_content");
  }

  async handleTypeStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "content_type");
  }

  async handleRangeTypeStatusChange(value: boolean): Promise<void> {
    Application.invalidateDiscoverSections();
    await this.updateValue(value, "range_type");
  }

  async handleSectionTypeStatusChange(value: string[]): Promise<void> {
    const previous = getSectionContentTypes();

    const hadAnyBefore = previous.includes("");
    const hasAnyNow = value.includes("");

    if (hadAnyBefore && value.length > 1) {
      value = value.filter((v) => v !== "");
    } else if (!hadAnyBefore && hasAnyNow) {
      value = [""];
    }

    await this.updateValue(value, "section_content_type");
  }

  async handleHideGenresStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_genres");
  }

  async handleHideDemographicStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_demographic");
  }

  async handleHideThemesStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_themes");
  }

  async handleHideMoreStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "hidden_more");
  }

  async resetFiltersDialog() {
    throw new FormConfirmationError(
      Application.Selector(this as SettingsForm, "resetFilters"),
      "Do you want to refresh genres filters?",
    );
  }

  async resetFilters() {
    await updateFilters(true, this.api);
  }
}

function getDeletedDiscoverySections() {
  return (
    (Application.getState("deleted_sections") as { id: string; title: string }[] | undefined) ?? []
  );
}

async function setDiscoverySections(newValue: { id: string; title: string }[]) {
  Application.setState(newValue, "sections");
}

async function setDeletedDiscoverySections(newValue: { id: string; title: string }[]) {
  Application.setState(newValue, "deleted_sections");
}

export function getDiscoverySectionsOrder() {
  return (
    (Application.getState("sections") as { id: string; title: string }[] | undefined) ??
    discoverySections
  );
}

class EditableListTestForm extends Form {
  override getSections() {
    const onReorderSelectorId = Application.Selector(this as EditableListTestForm, "rowDidReorder");
    const onDeletionSelectorId = Application.Selector(this as EditableListTestForm, "rowDidDelete");

    return [
      {
        ...EditSection("edit", {
          id: "edit",
          header: "Section order",
          footer: "Long press to reorder, swipe to hide",
          items: getDiscoverySectionsOrder().map((item) => this.itemRow(item)),
        }),
        allowDeletion: true,
        allowReorder: true,
        onReorder: onReorderSelectorId,
        onDeletion: onDeletionSelectorId,
      } as unknown as FormSectionElement<unknown>,
      ...(getDeletedDiscoverySections().length > 0
        ? [new AddSectionSelect().getDeletedSections()]
        : []),
      Section("status", [
        ButtonRow("reset", {
          title: "Reset all Sections",
          isHidden: getDeletedDiscoverySections().length == 0,
          onSelect: Application.Selector(this as EditableListTestForm, "resetFiltersDialog"),
        }),
      ]),
    ];
  }
  async resetFiltersDialog() {
    throw new FormConfirmationError(
      Application.Selector(this as EditableListTestForm, "handleLimitStatusChangeReset"),
      "Do you want to restore all deleted sections?",
    );
  }
  async handleLimitStatusChangeReset(): Promise<void> {
    await setDiscoverySections(discoverySections);
    await setDeletedDiscoverySections([]);
    this.reloadForm();
  }
  private itemRow(item: { id: string; title: string }): FormItemElement<unknown> {
    return LabelRow(item.id, {
      title: item.title,
    });
  }

  async rowDidDelete(index: number): Promise<void> {
    const items = getDeletedDiscoverySections();
    const sections = getDiscoverySectionsOrder();
    const deleted = sections.splice(index, 1);
    deleted.forEach((item) => {
      items.push(item);
    });
    await setDeletedDiscoverySections(items);
    await setDiscoverySections(sections);
    this.reloadForm();
  }

  async rowDidReorder(sourceIndex: number, destinationIndex: number): Promise<void> {
    const sections = getDiscoverySectionsOrder();
    const [item] = sections.splice(sourceIndex, 1);
    if (item) {
      sections.splice(destinationIndex, 0, item);
    }
    await setDiscoverySections(sections);
    this.reloadForm();
    Application.invalidateDiscoverSections();
  }
}

class AddSectionSelect {
  onSelectLabelProxy = new Proxy(this, {
    has(target, p) {
      if (typeof p == "string" && p.startsWith("onSelect_")) {
        return true;
      } else {
        return Object.hasOwn(target, p);
      }
    },
    get(target, p) {
      if (typeof p == "string" && p.startsWith("onSelect_")) {
        const rowId = p.slice(9);
        return async () => {
          await target["onSelect"](rowId);
        };
      } else {
        // @ts-ignore
        return target[p];
      }
    },
  });

  deletedForms = getDeletedDiscoverySections();
  getDeletedSections(): FormSectionElement<unknown> {
    return Section(
      { id: "addSectionSelect", footer: "Tap to restore" },
      this.deletedForms.flatMap((item) =>
        LabelRow(item.id, {
          title: item.title,
          // @ts-expect-error
          onSelect: Application.Selector(this.onSelectLabelProxy, "onSelect_" + item.id),
        }),
      ),
    );
  }

  async onSelect(rowId: string): Promise<void> {
    const sections = getDiscoverySectionsOrder();
    const selectedDeletedItems = this.deletedForms.filter((item) => item.id === rowId);
    sections.push(selectedDeletedItems[0]);
    await setDiscoverySections(sections);
    await setDeletedDiscoverySections(this.deletedForms.filter((item) => item.id !== rowId));
    this.deletedForms = getDeletedDiscoverySections();
  }
}
