/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { AdvancedSearchForm, NavigationRow, Section, SelectRow, ToggleRow } from "@paperback/types";

import { type Metadata, STATIC_SEARCH_DETAILS } from "../models";
import { TagCategoryForm } from "./TagCategoryForm";
import { ShowcaseForm } from "./ShowcaseForm";

export class MangaballSearchForm extends AdvancedSearchForm {
  private nsfw: boolean;
  private demographic: string[];
  private originalLanguages: string[];
  private tagCategoryForms: Map<string, TagCategoryForm>;

  constructor(initialMeta?: Metadata) {
    super();
    this.nsfw = initialMeta?.nsfw ?? false;
    this.demographic = [initialMeta?.demographic ?? "any"];
    this.originalLanguages = initialMeta?.originalLanguages ?? [];

    const includedSet = new Set(initialMeta?.tagIncluded ?? []);
    const excludedSet = new Set(initialMeta?.tagExcluded ?? []);
    this.tagCategoryForms = new Map(
      STATIC_SEARCH_DETAILS.tagCategories.map((cat) => {
        const includedIds = cat.tags.filter((t) => includedSet.has(t.id)).map((t) => t.id);
        const excludedIds = cat.tags.filter((t) => excludedSet.has(t.id)).map((t) => t.id);
        return [cat.id, new TagCategoryForm(cat, { included: includedIds, excluded: excludedIds })];
      }),
    );
  }

  async updateNsfw(value: boolean): Promise<void> {
    this.nsfw = value;
    this.reloadForm();
  }

  async updateDemographic(value: string[]): Promise<void> {
    this.demographic = value;
    this.reloadForm();
  }

  async updateOriginalLanguages(value: string[]): Promise<void> {
    this.originalLanguages = value;
    this.reloadForm();
  }

  getSearchQueryMetadata() {
    const tagIncluded: string[] = [];
    const tagExcluded: string[] = [];
    for (const form of this.tagCategoryForms.values()) {
      const state = form.getState();
      tagIncluded.push(...state.included);
      tagExcluded.push(...state.excluded);
    }

    return {
      searchMeta: {
        nsfw: this.nsfw,
        demographic: this.demographic[0] ?? "any",
        tagIncluded,
        tagExcluded,
        originalLanguages: this.originalLanguages,
      } satisfies Metadata,
    };
  }

  private getTagSubtitle(categoryId: string): string {
    const form = this.tagCategoryForms.get(categoryId);
    if (!form) return "";
    const state = form.getState();
    const total = state.included.length + state.excluded.length;
    return total > 0 ? `${total} selected` : "";
  }

  override getSections() {
    return [
      Section("general", [
        ToggleRow("nsfw", {
          title: "Show 18+ Content",
          value: this.nsfw,
          onValueChange: Application.Selector<MangaballSearchForm, (value: boolean) => Promise<void>>(
            this,
            "updateNsfw",
          ),
        }),
        SelectRow("demographic", {
          title: "Demographic",
          value: this.demographic,
          options: STATIC_SEARCH_DETAILS.demographics.map((d) => ({ id: d.id, title: d.label })),
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector<MangaballSearchForm, (value: string[]) => Promise<void>>(
            this,
            "updateDemographic",
          ),
        }),
      ]),
      ...STATIC_SEARCH_DETAILS.tagCategories.map((cat) =>
        Section(`tags_${cat.id}`, [
          NavigationRow(`tags_${cat.id}_nav`, {
            title: cat.label,
            subtitle: this.getTagSubtitle(cat.id),
            form: this.tagCategoryForms.get(cat.id)!,
          }),
        ]),
      ),
      Section("languages", [
        SelectRow("originalLanguages", {
          title: "Origin",
          subtitle: "Filter by comic origin type",
          value: this.originalLanguages,
          options: STATIC_SEARCH_DETAILS.originalLanguages.map((l) => ({
            id: l.id,
            title: l.label,
          })),
          minItemCount: 0,
          maxItemCount: STATIC_SEARCH_DETAILS.originalLanguages.length,
          onValueChange: Application.Selector<MangaballSearchForm, (value: string[]) => Promise<void>>(
            this,
            "updateOriginalLanguages",
          ),
        }),
      ]),
      Section("dev", [
        NavigationRow("showcase", {
          title: "UI Elements Showcase",
          subtitle: "Preview every available form row and section type",
          form: new ShowcaseForm(),
        }),
      ]),
    ];
  }
}
