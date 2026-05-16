/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  LabelRow,
  Section,
  ToggleRow,
  type FormItemElement,
  type FormSectionElement,
} from "@paperback/types";

import {
  DEFAULT_SECTION_ORDER,
  DISCOVER_SECTIONS,
  getDiscoverSectionOrder,
  getLatestUpdatesEnabled,
  getPopularEnabled,
  getRecentlyAddedEnabled,
  getRecommendedEnabled,
  getSeasonalEnabled,
  getSelfPublishedEnabled,
  setDiscoverSectionOrder,
  setLatestUpdatesEnabled,
  setPopularEnabled,
  setRecentlyAddedEnabled,
  setRecommendedEnabled,
  setSeasonalEnabled,
  setSelfPublishedEnabled,
} from "../../shared/state";

const SECTION_TITLES: Record<string, string> = {
  [DISCOVER_SECTIONS.POPULAR]: "Popular New Titles",
  [DISCOVER_SECTIONS.LATEST_UPDATES]: "Latest Updates",
  [DISCOVER_SECTIONS.RECOMMENDED]: "Recommended",
  [DISCOVER_SECTIONS.SELF_PUBLISHED]: "Self-Published",
  [DISCOVER_SECTIONS.SEASONAL]: "Seasonal",
  [DISCOVER_SECTIONS.RECENTLY_ADDED]: "Recently Added",
};

export class DiscoverSettingsForm extends Form {
  constructor() {
    super();
    this.createMoveHandlers();
  }

  private createMoveHandlers(): void {
    const order = getDiscoverSectionOrder();
    for (let i = 0; i < order.length; i++) {
      (this as Record<string, unknown>)[`moveUp_${i}`] = async () => {
        await this.handleMove(i, i - 1);
      };
      (this as Record<string, unknown>)[`moveDown_${i}`] = async () => {
        await this.handleMove(i, i + 1);
      };
    }
  }

  private async handleMove(fromIndex: number, toIndex: number): Promise<void> {
    const current = getDiscoverSectionOrder();
    if (toIndex < 0 || toIndex >= current.length) return;
    const newOrder = [...current];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];
    setDiscoverSectionOrder(newOrder);
    Application.invalidateDiscoverSections();
    this.createMoveHandlers();
    this.reloadForm();
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section(
        {
          id: "discover_visibility",
          header: "Home Sections",
        },
        [
          ToggleRow("popular_enabled", {
            title: "Popular New Titles",
            value: getPopularEnabled(),
            onValueChange: Application.Selector(
              this as DiscoverSettingsForm,
              "handlePopularNewTitlesEnabledChange",
            ),
          }),
          ToggleRow("latest_updates_enabled", {
            title: "Latest Updates",
            value: getLatestUpdatesEnabled(),
            onValueChange: Application.Selector(
              this as DiscoverSettingsForm,
              "handleLatestUpdatesEnabledChange",
            ),
          }),
          ToggleRow("recommended_enabled", {
            title: "Recommended",
            value: getRecommendedEnabled(),
            onValueChange: Application.Selector(
              this as DiscoverSettingsForm,
              "handleRecommendedEnabledChange",
            ),
          }),
          ToggleRow("self_published_enabled", {
            title: "Self-Published",
            value: getSelfPublishedEnabled(),
            onValueChange: Application.Selector(
              this as DiscoverSettingsForm,
              "handleSelfPublishedEnabledChange",
            ),
          }),
          ToggleRow("seasonal_enabled", {
            title: "Seasonal",
            value: getSeasonalEnabled(),
            onValueChange: Application.Selector(
              this as DiscoverSettingsForm,
              "handleSeasonalEnabledChange",
            ),
          }),
          ToggleRow("recently_added_enabled", {
            title: "Recently Added",
            value: getRecentlyAddedEnabled(),
            onValueChange: Application.Selector(
              this as DiscoverSettingsForm,
              "handleRecentlyAddedEnabledChange",
            ),
          }),
        ],
      ),
      Section(
        {
          id: "discover_section_order",
          header: "Order",
        },
        this.createOrderItems(),
      ),
      Section("reset_section_order", [
        ButtonRow("reset_order", {
          title: "Reset Order",
          onSelect: Application.Selector(this as DiscoverSettingsForm, "handleResetOrder"),
        }),
      ]),
    ];
  }

  private createOrderItems(): FormItemElement<unknown>[] {
    const items: FormItemElement<unknown>[] = [];
    const currentOrder = getDiscoverSectionOrder();
    const titleFor = (id: string): string => SECTION_TITLES[id] || id;

    items.push(
      LabelRow("current_order", {
        title: "Current Order",
        subtitle: currentOrder.map(titleFor).join(" → "),
      }),
    );

    for (let i = 0; i < currentOrder.length; i++) {
      const name = titleFor(currentOrder[i]);
      items.push(
        LabelRow(`section_${i}`, {
          title: `${i + 1}. ${name}`,
        }),
      );
      if (i > 0) {
        items.push(
          ButtonRow(`move_up_${i}`, {
            title: `↑ ${name}`,
            onSelect: Application.Selector(this as DiscoverSettingsForm, `moveUp_${i}` as never),
          }),
        );
      }
      if (i < currentOrder.length - 1) {
        items.push(
          ButtonRow(`move_down_${i}`, {
            title: `↓ ${name}`,
            onSelect: Application.Selector(this as DiscoverSettingsForm, `moveDown_${i}` as never),
          }),
        );
      }
    }

    return items;
  }

  async handleResetOrder(): Promise<void> {
    setDiscoverSectionOrder([...DEFAULT_SECTION_ORDER]);
    Application.invalidateDiscoverSections();
    this.createMoveHandlers();
    this.reloadForm();
  }

  async handleSeasonalEnabledChange(value: boolean): Promise<void> {
    setSeasonalEnabled(value);
    Application.invalidateDiscoverSections();
  }

  async handleLatestUpdatesEnabledChange(value: boolean): Promise<void> {
    setLatestUpdatesEnabled(value);
    Application.invalidateDiscoverSections();
  }

  async handlePopularNewTitlesEnabledChange(value: boolean): Promise<void> {
    setPopularEnabled(value);
    Application.invalidateDiscoverSections();
  }

  async handleRecentlyAddedEnabledChange(value: boolean): Promise<void> {
    setRecentlyAddedEnabled(value);
    Application.invalidateDiscoverSections();
  }

  async handleRecommendedEnabledChange(value: boolean): Promise<void> {
    setRecommendedEnabled(value);
    Application.invalidateDiscoverSections();
  }

  async handleSelfPublishedEnabledChange(value: boolean): Promise<void> {
    setSelfPublishedEnabled(value);
    Application.invalidateDiscoverSections();
  }
}
