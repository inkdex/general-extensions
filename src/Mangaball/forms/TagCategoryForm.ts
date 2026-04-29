/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { FlowSection, Form, InputRow, LabelRow, Section } from "@paperback/types";

import type { TagCategory } from "../models";

export type TagCategoryState = {
  included: string[];
  excluded: string[];
};

type TagState = "none" | "included" | "excluded";

const STATE_PREFIX: Record<TagState, string> = {
  none: "",
  included: "✓ ",
  excluded: "X ",
};

export class TagCategoryForm extends Form {
  private category: TagCategory;
  private tagStateMap: Map<string, TagState>;
  private searchQuery: string;

  constructor(
    category: TagCategory,
    initialState: TagCategoryState = { included: [], excluded: [] },
  ) {
    super();
    this.category = category;
    this.searchQuery = "";

    this.tagStateMap = new Map();
    for (const tag of category.tags) {
      if (initialState.included.includes(tag.id)) {
        this.tagStateMap.set(tag.id, "included");
      } else if (initialState.excluded.includes(tag.id)) {
        this.tagStateMap.set(tag.id, "excluded");
      } else {
        this.tagStateMap.set(tag.id, "none");
      }
    }

    (this as any)["onSearchChange"] = async (value: string) => {
      this.searchQuery = value;
      this.reloadForm();
    };

    for (const tag of category.tags) {
      (this as any)[`toggle_${tag.id}`] = async () => {
        const current = this.tagStateMap.get(tag.id) ?? "none";
        const next: TagState =
          current === "none" ? "included" : current === "included" ? "excluded" : "none";
        this.tagStateMap.set(tag.id, next);
        this.reloadForm();
      };
    }
  }

  getState(): TagCategoryState {
    const included: string[] = [];
    const excluded: string[] = [];
    for (const [id, state] of this.tagStateMap) {
      if (state === "included") included.push(id);
      else if (state === "excluded") excluded.push(id);
    }
    return { included, excluded };
  }

  override getSections() {
    const query = this.searchQuery.toLowerCase().trim();

    return [
      Section("search", [
        InputRow("search_input", {
          title: "Search",
          value: this.searchQuery,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onValueChange: Application.Selector(this as any, "onSearchChange"),
        }),
      ]),
      FlowSection(
        {
          id: `${this.category.id}_tags`,
          footer: "Tap once to include · Tap again to exclude · Tap once more to reset",
        },
        this.category.tags.map((tag) => {
          const state = this.tagStateMap.get(tag.id) ?? "none";
          const hidden = query.length > 0 && !tag.name.toLowerCase().includes(query);
          return LabelRow(`tag_${tag.id}`, {
            title: `${STATE_PREFIX[state]}${tag.name}`,
            isHidden: hidden,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelect: Application.Selector(this as any, `toggle_${tag.id}`),
          });
        }),
      ),
    ];
  }
}
