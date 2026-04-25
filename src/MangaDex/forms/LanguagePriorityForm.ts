/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, LabelRow, Section, type FormItemElement } from "@paperback/types";

import { MDLanguages } from "../MangaDexHelper";
import { getLanguagePriority, setLanguagePriority, getLanguages } from "../MangaDexSettings";

export class LanguagePriorityForm extends Form {
  private priority: string[];

  constructor() {
    super();
    this.priority = getLanguagePriority();
    this.createMoveHandlers();
  }

  private createMoveHandlers(): void {
    for (let i = 0; i < this.priority.length; i++) {
      (this as Record<string, unknown>)[`moveUp_${i}`] = async () => {
        await this.handleMove(i, i - 1);
      };
      (this as Record<string, unknown>)[`moveDown_${i}`] = async () => {
        await this.handleMove(i, i + 1);
      };
    }
  }

  private async handleMove(fromIndex: number, toIndex: number): Promise<void> {
    if (toIndex < 0 || toIndex >= this.priority.length) return;

    const newPriority = [...this.priority];
    [newPriority[fromIndex], newPriority[toIndex]] = [newPriority[toIndex], newPriority[fromIndex]];

    this.priority = newPriority;
    setLanguagePriority(newPriority);
    this.createMoveHandlers();
    this.reloadForm();
  }

  override getSections() {
    return [
      Section(
        {
          id: "language_priority_order",
          header: "Language Priority Order",
          footer: "Languages higher in the list are tried first for titles and descriptions",
        },
        this.createOrderItems(),
      ),
      Section("reset_priority", [
        ButtonRow("reset_priority_order", {
          title: "Reset to Default Order",
          onSelect: Application.Selector(this as LanguagePriorityForm, "handleResetPriority"),
        }),
      ]),
    ];
  }

  private createOrderItems(): FormItemElement<unknown>[] {
    const items: FormItemElement<unknown>[] = [];
    const current = this.priority;

    for (let i = 0; i < current.length; i++) {
      const code = current[i];
      const flag = MDLanguages.getFlagCode(code);
      const name = MDLanguages.getName(code);

      items.push(
        LabelRow(`section_${i}`, {
          title: `${i + 1}. ${flag} ${name}`,
        }),
      );

      if (i > 0) {
        items.push(
          ButtonRow(`move_up_${i}`, {
            title: `↑ Move Up "${name}"`,
            onSelect: Application.Selector(this as LanguagePriorityForm, `moveUp_${i}` as never),
          }),
        );
      }

      if (i < current.length - 1) {
        items.push(
          ButtonRow(`move_down_${i}`, {
            title: `↓ Move Down "${name}"`,
            onSelect: Application.Selector(this as LanguagePriorityForm, `moveDown_${i}` as never),
          }),
        );
      }
    }

    return items;
  }

  async handleResetPriority(): Promise<void> {
    const defaultOrder = getLanguages();
    this.priority = defaultOrder;
    setLanguagePriority(defaultOrder);
    this.createMoveHandlers();
    this.reloadForm();
  }
}
