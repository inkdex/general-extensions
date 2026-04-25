/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  LabelRow,
  Section,
  ToggleRow,
  type FormItemElement,
} from "@paperback/types";

import {
  DEFAULT_SECTION_ORDER,
  DISCOVER_SECTIONS,
  getDiscoverSectionOrder,
  getLatestUpdatesEnabled,
  getPopularEnabled,
  getRecentlyAddedEnabled,
  getSeasonalEnabled,
  getTagSectionsEnabled,
  setDiscoverSectionOrder,
  setLatestUpdatesEnabled,
  setPopularEnabled,
  setRecentlyAddedEnabled,
  setSeasonalEnabled,
  setTagSectionsEnabled,
} from "../MangaDexSettings";
import { State } from "../utils/StateUtil";

/**
 * Form for configuring discover page settings
 * Allows enabling/disabling sections and reordering them
 */
export class DiscoverSettingsForm extends Form {
  // State tracking for section visibility settings
  private seasonalEnabledState = new State<boolean>(this, "seasonal_enabled", getSeasonalEnabled());
  private latestUpdatesEnabledState = new State<boolean>(
    this,
    "latest_updates_enabled",
    getLatestUpdatesEnabled(),
  );
  private popularEnabledState = new State<boolean>(this, "popular_enabled", getPopularEnabled());
  private recentlyAddedEnabledState = new State<boolean>(
    this,
    "recently_added_enabled",
    getRecentlyAddedEnabled(),
  );
  private tagSectionsEnabledState = new State<boolean>(
    this,
    "tag_sections_enabled",
    getTagSectionsEnabled(),
  );
  private sectionOrderState = new State<string[]>(
    this,
    "discover_section_order",
    getDiscoverSectionOrder(),
  );

  override getSections() {
    return [
      Section("discover_visibility", [
        ToggleRow("seasonal_enabled", {
          title: "Enable Seasonal Section",
          value: this.seasonalEnabledState.value,
          onValueChange: Application.Selector(
            this as DiscoverSettingsForm,
            "handleSeasonalEnabledChange",
          ),
        }),
        ToggleRow("latest_updates_enabled", {
          title: "Enable Latest Updates Section",
          value: this.latestUpdatesEnabledState.value,
          onValueChange: Application.Selector(
            this as DiscoverSettingsForm,
            "handleLatestUpdatesEnabledChange",
          ),
        }),
        ToggleRow("popular_enabled", {
          title: "Enable Popular Section",
          value: this.popularEnabledState.value,
          onValueChange: Application.Selector(
            this as DiscoverSettingsForm,
            "handlePopularEnabledChange",
          ),
        }),
        ToggleRow("recently_added_enabled", {
          title: "Enable Recently Added Section",
          value: this.recentlyAddedEnabledState.value,
          onValueChange: Application.Selector(
            this as DiscoverSettingsForm,
            "handleRecentlyAddedEnabledChange",
          ),
        }),
        ToggleRow("tag_sections_enabled", {
          title: "Enable Tag Sections",
          value: this.tagSectionsEnabledState.value,
          onValueChange: Application.Selector(
            this as DiscoverSettingsForm,
            "handleTagSectionsEnabledChange",
          ),
        }),
      ]),
      Section(
        {
          id: "discover_section_order",
          header: "Home Section Order",
        },
        this.createOrderItems(),
      ),
      Section("reset_section_order", [
        ButtonRow("reset_order", {
          title: "Reset to Default Order",
          onSelect: Application.Selector(this as DiscoverSettingsForm, "handleResetOrder"),
        }),
      ]),
    ];
  }

  /**
   * Creates UI elements for section reordering
   */
  private createOrderItems(): FormItemElement<unknown>[] {
    const items: FormItemElement<unknown>[] = [];
    const currentOrder = this.sectionOrderState.value;

    const sectionTitles = {
      [DISCOVER_SECTIONS.SEASONAL]: "Seasonal",
      [DISCOVER_SECTIONS.LATEST_UPDATES]: "Latest Updates",
      [DISCOVER_SECTIONS.POPULAR]: "Popular",
      [DISCOVER_SECTIONS.RECENTLY_ADDED]: "Recently Added",
      [DISCOVER_SECTIONS.TAG_SECTIONS]: "Tag Sections",
    };

    items.push(
      LabelRow("current_order", {
        title: "Current Order (top to bottom)",
        subtitle: currentOrder.map((id) => sectionTitles[id] || id).join(" → "),
      }),
    );

    items.push(
      LabelRow("section_0", {
        title: `1. ${sectionTitles[currentOrder[0]] || currentOrder[0]}`,
      }),
      ButtonRow("move_down_0", {
        title: `↓ Move Down "${sectionTitles[currentOrder[0]] || currentOrder[0]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveFirstDown"),
      }),
    );

    items.push(
      LabelRow("section_1", {
        title: `2. ${sectionTitles[currentOrder[1]] || currentOrder[1]}`,
      }),
      ButtonRow("move_up_1", {
        title: `↑ Move Up "${sectionTitles[currentOrder[1]] || currentOrder[1]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveSecondUp"),
      }),
      ButtonRow("move_down_1", {
        title: `↓ Move Down "${sectionTitles[currentOrder[1]] || currentOrder[1]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveSecondDown"),
      }),
    );

    items.push(
      LabelRow("section_2", {
        title: `3. ${sectionTitles[currentOrder[2]] || currentOrder[2]}`,
      }),
      ButtonRow("move_up_2", {
        title: `↑ Move Up "${sectionTitles[currentOrder[2]] || currentOrder[2]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveThirdUp"),
      }),
      ButtonRow("move_down_2", {
        title: `↓ Move Down "${sectionTitles[currentOrder[2]] || currentOrder[2]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveThirdDown"),
      }),
    );

    items.push(
      LabelRow("section_3", {
        title: `4. ${sectionTitles[currentOrder[3]] || currentOrder[3]}`,
      }),
      ButtonRow("move_up_3", {
        title: `↑ Move Up "${sectionTitles[currentOrder[3]] || currentOrder[3]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveFourthUp"),
      }),
      ButtonRow("move_down_3", {
        title: `↓ Move Down "${sectionTitles[currentOrder[3]] || currentOrder[3]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveFourthDown"),
      }),
    );

    items.push(
      LabelRow("section_4", {
        title: `5. ${sectionTitles[currentOrder[4]] || currentOrder[4]}`,
      }),
      ButtonRow("move_up_4", {
        title: `↑ Move Up "${sectionTitles[currentOrder[4]] || currentOrder[4]}"`,
        onSelect: Application.Selector(this as DiscoverSettingsForm, "moveFifthUp"),
      }),
    );

    return items;
  }

  // Section reordering functions
  async moveFirstDown(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[0], newOrder[1]] = [newOrder[1], newOrder[0]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async moveSecondUp(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[1], newOrder[0]] = [newOrder[0], newOrder[1]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async moveSecondDown(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[1], newOrder[2]] = [newOrder[2], newOrder[1]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async moveThirdUp(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[2], newOrder[1]] = [newOrder[1], newOrder[2]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async moveThirdDown(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[2], newOrder[3]] = [newOrder[3], newOrder[2]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async moveFourthUp(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[3], newOrder[2]] = [newOrder[2], newOrder[3]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async moveFourthDown(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[3], newOrder[4]] = [newOrder[4], newOrder[3]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async moveFifthUp(): Promise<void> {
    try {
      const newOrder = [...this.sectionOrderState.value];
      [newOrder[4], newOrder[3]] = [newOrder[3], newOrder[4]];

      await this.sectionOrderState.updateValue(newOrder);
      setDiscoverSectionOrder(newOrder);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error moving section: " + String(error));
    }
  }

  async handleResetOrder(): Promise<void> {
    try {
      await this.sectionOrderState.updateValue(DEFAULT_SECTION_ORDER);
      setDiscoverSectionOrder(DEFAULT_SECTION_ORDER);
      Application.invalidateDiscoverSections();
      this.reloadForm();
    } catch (error) {
      console.log("Error resetting order: " + String(error));
    }
  }

  // Section visibility toggle handlers
  async handleSeasonalEnabledChange(value: boolean): Promise<void> {
    await this.seasonalEnabledState.updateValue(value);
    setSeasonalEnabled(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleLatestUpdatesEnabledChange(value: boolean): Promise<void> {
    await this.latestUpdatesEnabledState.updateValue(value);
    setLatestUpdatesEnabled(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handlePopularEnabledChange(value: boolean): Promise<void> {
    await this.popularEnabledState.updateValue(value);
    setPopularEnabled(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleRecentlyAddedEnabledChange(value: boolean): Promise<void> {
    await this.recentlyAddedEnabledState.updateValue(value);
    setRecentlyAddedEnabled(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleTagSectionsEnabledChange(value: boolean): Promise<void> {
    await this.tagSectionsEnabledState.updateValue(value);
    setTagSectionsEnabled(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }
}
