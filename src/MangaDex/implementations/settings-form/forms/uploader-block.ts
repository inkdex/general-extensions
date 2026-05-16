/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  InputRow,
  LabelRow,
  Section,
  type FormSectionElement,
} from "@paperback/types";

import { normalizeUuid } from "../../shared/legacy";
import { getBlockedUploaders, setBlockedUploaders } from "../../shared/state";

interface ParsedUploaderCsv {
  // UUIDs that passed validation, in input order, deduped.
  valid: string[];
  // Nonempty entries that did not match the v4 UUID shape.
  rejectedCount: number;
  // Duplicate UUIDs dropped during deduplication.
  duplicateCount: number;
}

// Splits the comma separated input, drops empties, lowercases, then
// dedupes and keeps only valid v4 UUIDs. Returns the accepted set
// plus reject and duplicate counts so the form can report how many
// were dropped.
function parseUploaderCsv(raw: string): ParsedUploaderCsv {
  const valid: string[] = [];
  const seen = new Set<string>();
  let rejectedCount = 0;
  let duplicateCount = 0;
  for (const entry of raw.split(",")) {
    if (!entry.trim()) continue;
    const normalized = normalizeUuid(entry);
    if (!normalized) {
      rejectedCount++;
      continue;
    }
    if (seen.has(normalized)) {
      duplicateCount++;
      continue;
    }
    seen.add(normalized);
    valid.push(normalized);
  }
  return { valid, rejectedCount, duplicateCount };
}

export class UploaderBlockForm extends Form {
  private inputValue: string;
  private statusMessage: string = "";

  constructor() {
    super();
    this.inputValue = getBlockedUploaders().join(", ");
  }

  override getSections(): FormSectionElement<unknown>[] {
    const currentBlocked = getBlockedUploaders();
    return [
      Section(
        {
          id: "blocked_uploaders",
          header: "Blocked Uploaders",
          footer:
            "Paste comma separated MangaDex user UUIDs. Chapters from these users are filtered out of feeds.",
        },
        [
          InputRow("uploader_csv", {
            title: "User UUIDs",
            value: this.inputValue,
            onValueChange: Application.Selector(this as UploaderBlockForm, "handleInputChange"),
          }),
          ButtonRow("save_uploaders", {
            title: "Save",
            onSelect: Application.Selector(this as UploaderBlockForm, "handleSave"),
          }),
          LabelRow("count_label", {
            title: "Currently Blocked",
            value: `${currentBlocked.length} uploader${currentBlocked.length === 1 ? "" : "s"}`,
          }),
          LabelRow("status_label", {
            title: this.statusMessage || " ",
            isHidden: !this.statusMessage,
          }),
        ],
      ),
    ];
  }

  async handleInputChange(value: string): Promise<void> {
    this.inputValue = value;
  }

  async handleSave(): Promise<void> {
    const { valid, rejectedCount, duplicateCount } = parseUploaderCsv(this.inputValue);
    setBlockedUploaders(valid);
    this.inputValue = valid.join(", ");
    const noun = `UUID${valid.length === 1 ? "" : "s"}`;
    const issues: string[] = [];
    if (rejectedCount > 0) issues.push(`${rejectedCount} invalid`);
    if (duplicateCount > 0) issues.push(`${duplicateCount} duplicate`);
    this.statusMessage =
      issues.length > 0
        ? `Saved ${valid.length} ${noun} (skipped ${issues.join(", ")})`
        : `Saved ${valid.length} ${noun}`;
    this.reloadForm();
  }
}
