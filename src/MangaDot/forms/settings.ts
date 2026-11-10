/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  type Cookie,
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
  WebViewRow,
} from "@paperback/types";

import { ADULT_FILTER, discoverySections, ORIGIN, type TagItem } from "../models";
import type { LogInManager } from "../network";
import { type MangaDotApi } from "../network";
import {
  getSectionContentTypes,
  getShowAdultStatus,
  updateFilters,
  getRangeStatus,
  getMultipageStatus,
  getEnglishOnly,
  TAGS,
  normalizeId,
  deNormalizeId,
} from "../utils";

export class SettingsForm extends Form {
  api: MangaDotApi;
  login: LogInManager;
  userAgent: string;
  loadUsernameRequest?: Promise<unknown>;
  username?: string;
  constructor(api: MangaDotApi, userAgent: string, login: LogInManager) {
    super();
    this.login = login;
    this.userAgent = userAgent;
    this.api = api;
  }
  override formDidAppear(): void {
    this.loadUsernameRequest = this.login
      .getAccountID()
      .then((user) => {
        this.username = user;
      })
      .finally(() => {
        this.reloadForm();
      });
  }
  override getSections() {
    if (this.username == undefined) {
      return [Section("loading", [LabelRow("loading", { title: "Loading..." })])];
    }
    return [
      Section(
        {
          id: "account",
          header: "Account Settings",
        },
        [
          WebViewRow("loginRow", {
            title: "Login",
            request: {
              url: "https://mangadot.net/login",
              method: "GET",
              headers: { "user-agent": this.userAgent },
            },
            isHidden: this.login.isLoggedIn(),
            onComplete: Application.Selector(this as SettingsForm, "handleLogin"),
            onCancel: Application.Selector(this as SettingsForm, "handleLoginCancel"),
          }),
          LabelRow("logged", {
            title: "Logged in as",
            subtitle: `Account ID: ${this.username}`,
            isHidden: !this.login.isLoggedIn(),
          }),
          NavigationRow("searchFilters", {
            title: "Profile Settings",
            isHidden: !this.login.isLoggedIn(),
            form: new ProfileSettings(this.api),
          }),
          ButtonRow("logout", {
            title: "Logout",
            isHidden: !this.login.isLoggedIn(),
            onSelect: Application.Selector(this as SettingsForm, "handleLogoutButton"),
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
          ToggleRow("multipage_section", {
            title: "Use Multipage on Latest Update",
            subtitle: "Using multipage might have different results from the website homepage",
            value: getMultipageStatus(),
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleMultipageStatusChange",
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
            options: ADULT_FILTER,
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
          id: "chapter_settings",
          footer: "Chapters Settings",
        },
        [
          ToggleRow("en_only", {
            title: "Show English only chapters",
            value: getEnglishOnly(),
            subtitle:
              "Fetch only English chapters. Will need a `Reload Chapters` to update the existing one",
            onValueChange: Application.Selector(
              this as SettingsForm,
              "handleEnglishOnlyStatusChange",
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

  async handleLogin(cookies: Cookie[]): Promise<void> {
    await this.login.logIn(cookies);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleLoginCancel(): Promise<void> {
    this.reloadForm();
  }

  async handleLogoutButton(): Promise<void> {
    throw new FormConfirmationError(
      Application.Selector(this as SettingsForm, "handleLogoutConfirm"),
      "Do you want to logout?",
    );
  }

  async handleLogoutConfirm() {
    this.login.logOut();
    this.reloadForm();
  }

  async handleShowAdultStatusChange(value: string[]): Promise<void> {
    await this.updateValue(value, "show_adult_content");
  }

  async handleEnglishOnlyStatusChange(value: boolean): Promise<void> {
    await this.updateValue(value, "english_only_content");
  }

  async handleRangeTypeStatusChange(value: boolean): Promise<void> {
    Application.invalidateDiscoverSections();
    await this.updateValue(value, "range_type");
  }

  async handleMultipageStatusChange(value: boolean): Promise<void> {
    Application.invalidateDiscoverSections();
    await this.updateValue(value, "multipage_section");
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
  Application.invalidateDiscoverSections();
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

class ProfileSettings extends Form {
  api: MangaDotApi;
  hiddenTags?: string[];
  getSettingRequest?: Promise<unknown>;
  override formDidAppear(): void {
    this.getSettingRequest = this.api
      .getProfileSettings()
      .then((settings) => {
        this.hiddenTags = settings.hidden_terms;
      })
      .finally(() => {
        this.reloadForm();
      });
  }
  constructor(api: MangaDotApi) {
    super();
    this.api = api;
  }
  getTagsFilter(): FormItemElement<unknown>[] {
    if (this.hiddenTags && this.hiddenTags.length > 0) {
    }
    return Object.entries(TAGS).map(([categoryName, tags]) => {
      const rowId = categoryName.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const itemsArray = tags.map((tag: TagItem) => ({
        id: normalizeId(tag.name),
        title: tag.name,
      }));
      const categoryItemIds = new Set(itemsArray.map((item) => normalizeId(item.id)));
      const rowInitialValue = this.hiddenTags
        ? this.hiddenTags.filter((id) => categoryItemIds.has(normalizeId(id)))
        : [];
      return SelectRow(rowId, {
        title: categoryName,
        layout: "list",
        onValueChange: Application.Selector(this as ProfileSettings, "handleTagsChange"),
        items: itemsArray,
        value: rowInitialValue.map((tag) => normalizeId(tag)),
        minItemCount: 0,
        maxItemCount: tags.length,
        isHidden: false,
      });
    });
  }

  override getSections() {
    if (this.hiddenTags == undefined) {
      return [Section("loading", [LabelRow("loading", { title: "Loading..." })])];
    }
    return [Section({ id: "tags", header: "Tags" }, this.getTagsFilter())];
  }

  async handleTagsChange(value: string[]) {
    value = value.map((val) => deNormalizeId(val));
    await this.api.putFilters(value);
    this.reloadForm();
    Application.invalidateDiscoverSections();
  }
}
