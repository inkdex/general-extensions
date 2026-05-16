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
  SECTION_DEFINITIONS,
  getDiscoverSectionOrder,
  setDiscoverSectionOrder,
} from "../../shared/state";
import { bindMoveHandlers, buildReorderableRows, swapItems } from "./reorderable";

const titleForSectionId = (id: string): string =>
  SECTION_DEFINITIONS.find((s) => s.id === id)?.title ?? id;

export class DiscoverSettingsForm extends Form {
  constructor() {
    super();
    this.rebindHandlers();
  }

  // Application.Selector requires literal method names, so toggle and move
  // handlers are attached dynamically and refreshed after a reorder.
  private rebindHandlers(): void {
    bindMoveHandlers(this, getDiscoverSectionOrder().length, (from, to) =>
      this.handleMove(from, to),
    );
    for (const def of SECTION_DEFINITIONS) {
      (this as Record<string, unknown>)[`toggle_${def.id}`] = async (
        value: boolean,
      ): Promise<void> => {
        def.setEnabled(value);
        Application.invalidateDiscoverSections();
      };
    }
  }

  private async handleMove(fromIndex: number, toIndex: number): Promise<void> {
    const next = swapItems(getDiscoverSectionOrder(), fromIndex, toIndex);
    if (!next) return;
    setDiscoverSectionOrder(next);
    Application.invalidateDiscoverSections();
    this.rebindHandlers();
    this.reloadForm();
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section(
        { id: "discover_visibility", header: "Home Sections" },
        SECTION_DEFINITIONS.map((def) =>
          ToggleRow(`${def.id}_enabled`, {
            title: def.title,
            value: def.getEnabled(),
            onValueChange: Application.Selector(
              this as DiscoverSettingsForm,
              `toggle_${def.id}` as never,
            ),
          }),
        ),
      ),
      Section({ id: "discover_section_order", header: "Order" }, this.createOrderItems()),
      Section("reset_section_order", [
        ButtonRow("reset_order", {
          title: "Reset Order",
          onSelect: Application.Selector(this as DiscoverSettingsForm, "handleResetOrder"),
        }),
      ]),
    ];
  }

  private createOrderItems(): FormItemElement<unknown>[] {
    const currentOrder = getDiscoverSectionOrder();
    const items: FormItemElement<unknown>[] = [
      LabelRow("current_order", {
        title: "Current Order",
        subtitle: currentOrder.map(titleForSectionId).join(" → "),
      }),
    ];
    items.push(
      ...buildReorderableRows(
        this,
        currentOrder,
        (id, i) => `${i + 1}. ${titleForSectionId(id)}`,
        (id) => titleForSectionId(id),
      ),
    );
    return items;
  }

  async handleResetOrder(): Promise<void> {
    setDiscoverSectionOrder([...DEFAULT_SECTION_ORDER]);
    Application.invalidateDiscoverSections();
    this.rebindHandlers();
    this.reloadForm();
  }
}
