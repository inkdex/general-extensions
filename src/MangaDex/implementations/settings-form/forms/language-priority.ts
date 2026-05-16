/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  Section,
  type FormItemElement,
  type FormSectionElement,
} from "@paperback/types";

import { MDLanguages } from "../../shared/languages";
import { getLanguagePriority, setLanguagePriority, getLanguages } from "../../shared/state";
import { bindMoveHandlers, buildReorderableRows, swapItems } from "./reorderable";

export class LanguagePriorityForm extends Form {
  private priority: string[];

  constructor() {
    super();
    this.priority = getLanguagePriority();
    this.rebindHandlers();
  }

  private rebindHandlers(): void {
    bindMoveHandlers(this, this.priority.length, (from, to) => this.handleMove(from, to));
  }

  private async handleMove(fromIndex: number, toIndex: number): Promise<void> {
    const next = swapItems(this.priority, fromIndex, toIndex);
    if (!next) return;
    this.priority = next;
    setLanguagePriority(next);
    this.rebindHandlers();
    this.reloadForm();
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section(
        {
          id: "language_priority_order",
          header: "Priority",
          footer: "Top languages are tried first",
        },
        this.createOrderItems(),
      ),
      Section("reset_priority", [
        ButtonRow("reset_priority_order", {
          title: "Reset",
          onSelect: Application.Selector(this as LanguagePriorityForm, "handleResetPriority"),
        }),
      ]),
    ];
  }

  private createOrderItems(): FormItemElement<unknown>[] {
    return buildReorderableRows(
      this,
      this.priority,
      (code, i) => `${i + 1}. ${MDLanguages.getFlagCode(code)} ${MDLanguages.getName(code)}`,
      (code) => MDLanguages.getName(code),
    );
  }

  async handleResetPriority(): Promise<void> {
    this.priority = getLanguages();
    setLanguagePriority(this.priority);
    this.rebindHandlers();
    this.reloadForm();
  }
}
