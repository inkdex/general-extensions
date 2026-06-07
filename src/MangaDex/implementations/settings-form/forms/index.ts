/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  NavigationRow,
  Section,
  type FormSectionElement,
  type ListSectionElement,
} from "@paperback/types";

import { resetCuratedListCache } from "../../shared/curated-lists";
import { resetAllSettings } from "../../shared/state";
import { resetTagCache } from "../../shared/tags";
import { ContentSettingsForm } from "./content-settings";
import { DiscoverSettingsForm } from "./discover-settings";
import { GroupBlockForm } from "./group-block";
import { SearchSettingsForm } from "./search-settings";
import { UpdateFilterSettingsForm } from "./update-filter-settings";
import { UploaderBlockForm } from "./uploader-block";
import { WebsiteSettingsForm } from "./website-settings";

export class MangaDexSettingsForm extends Form {
  override getSections(): FormSectionElement<unknown>[] {
    return [this.createMainSettingsSection(), this.createResetSection()];
  }

  private createMainSettingsSection(): ListSectionElement {
    return Section("mainSettings", [
      NavigationRow("mangadex_settings", {
        title: "Account & Status",
        form: new WebsiteSettingsForm(),
      }),
      NavigationRow("discover_settings", {
        title: "Home",
        form: new DiscoverSettingsForm(),
      }),
      NavigationRow("content_settings", {
        title: "Content",
        form: new ContentSettingsForm(),
      }),
      NavigationRow("search_settings", {
        title: "Search",
        form: new SearchSettingsForm(),
      }),
      NavigationRow("update_filter_settings", {
        title: "Updates",
        form: new UpdateFilterSettingsForm(),
      }),
      NavigationRow("group_block_settings", {
        title: "Blocked Groups",
        form: new GroupBlockForm(),
      }),
      NavigationRow("uploader_block_settings", {
        title: "Blocked Uploaders",
        form: new UploaderBlockForm(),
      }),
    ]);
  }

  private createResetSection(): ListSectionElement {
    return Section("reset_section", [
      ButtonRow("reset_settings", {
        title: "Reset All Settings",
        onSelect: Application.Selector(this as MangaDexSettingsForm, "handleResetSettings"),
      }),
    ]);
  }

  async handleResetSettings(): Promise<void> {
    // Clearing each key makes the getX() fallbacks the one source of default values.
    resetAllSettings();
    // Clearing the tag and curated-list caches here means a user who reset because tags
    // or discover looked broken does not have to wait for the cache to expire.
    resetTagCache();
    resetCuratedListCache();
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }
}
