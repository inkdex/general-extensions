/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, LabelRow, type FormItemElement } from "@paperback/types";

// Application.Selector requires literal method names, so handlers for each
// list position are attached dynamically as `moveUp_${i}` / `moveDown_${i}`.
// Callers re-invoke this after a move so the binding stays in sync with the
// current list length.
export function bindMoveHandlers(
  form: object,
  count: number,
  onMove: (from: number, to: number) => Promise<void> | void,
): void {
  for (let i = 0; i < count; i++) {
    (form as Record<string, unknown>)[`moveUp_${i}`] = async (): Promise<void> => {
      await onMove(i, i - 1);
    };
    (form as Record<string, unknown>)[`moveDown_${i}`] = async (): Promise<void> => {
      await onMove(i, i + 1);
    };
  }
}

// LabelRow + ButtonRow pairs for a reorderable list. The first item has no
// up-arrow and the last has no down-arrow.
export function buildReorderableRows(
  form: object,
  items: readonly string[],
  labelFor: (item: string, index: number) => string,
  moveLabelFor: (item: string) => string,
): FormItemElement<unknown>[] {
  const rows: FormItemElement<unknown>[] = [];
  for (let i = 0; i < items.length; i++) {
    rows.push(LabelRow(`section_${i}`, { title: labelFor(items[i], i) }));
    if (i > 0) {
      rows.push(
        ButtonRow(`move_up_${i}`, {
          title: `↑ ${moveLabelFor(items[i])}`,
          onSelect: Application.Selector(form as never, `moveUp_${i}` as never),
        }),
      );
    }
    if (i < items.length - 1) {
      rows.push(
        ButtonRow(`move_down_${i}`, {
          title: `↓ ${moveLabelFor(items[i])}`,
          onSelect: Application.Selector(form as never, `moveDown_${i}` as never),
        }),
      );
    }
  }
  return rows;
}

// Returns a new array with items at `from` and `to` swapped, or null when
// `to` is out of range.
export function swapItems<T>(items: readonly T[], from: number, to: number): T[] | null {
  if (to < 0 || to >= items.length) return null;
  const next = items.slice();
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
