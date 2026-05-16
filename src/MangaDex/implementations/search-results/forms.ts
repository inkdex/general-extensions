/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  closureSelector,
  Section,
  SelectSection,
  TriStateSelectRow,
  type FormSectionElement,
  type JSONObject,
  type SearchQuery,
  type TagSection,
} from "@paperback/types";

export interface MangaDexSearchMetadata extends JSONObject {
  // Single element string[] to match SelectSection's binding.
  includeOperator?: string[];
  excludeOperator?: string[];
  tagsByGroup?: Record<string, Record<string, "included" | "excluded">>;
}

const DEFAULT_INCLUDE_OPERATOR = "AND";
const DEFAULT_EXCLUDE_OPERATOR = "OR";
const OPERATORS = ["AND", "OR"];
const OPERATOR_ITEMS = OPERATORS.map((id) => ({ id, title: id }));

export class MangaDexAdvancedSearchForm extends AdvancedSearchForm {
  private metadata: MangaDexSearchMetadata;
  private tagSections: TagSection[];

  constructor(searchQuery: SearchQuery<MangaDexSearchMetadata>, tagSections: TagSection[]) {
    super();
    const raw = searchQuery.metadata;
    const meta: MangaDexSearchMetadata = raw && !Array.isArray(raw) ? raw : {};
    meta.includeOperator ??= [DEFAULT_INCLUDE_OPERATOR];
    meta.excludeOperator ??= [DEFAULT_EXCLUDE_OPERATOR];
    meta.tagsByGroup ??= {};
    this.metadata = meta;
    this.tagSections = tagSections;
  }

  override getSearchQueryMetadata(): MangaDexSearchMetadata {
    return this.metadata;
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      this.operatorSection("includeOperator", "Include Operator", this.metadata.includeOperator!),
      this.operatorSection("excludeOperator", "Exclude Operator", this.metadata.excludeOperator!),
      ...this.tagSections.map((tagSection) => this.tagGroupSection(tagSection)),
    ];
  }

  private operatorSection(
    id: string,
    header: string,
    value: string[],
  ): FormSectionElement<unknown> {
    return SelectSection(this, {
      id,
      header,
      layout: "flow",
      value,
      items: OPERATOR_ITEMS,
      minItemCount: 1,
      maxItemCount: 1,
    });
  }

  private tagGroupSection(tagSection: TagSection): FormSectionElement<unknown> {
    const sectionId = tagSection.id;
    const rowId = `tags-${sectionId}`;
    return Section({ id: rowId, header: tagSection.title }, [
      TriStateSelectRow(rowId, {
        title: tagSection.title,
        layout: "list",
        value: this.metadata.tagsByGroup![sectionId] ?? {},
        allowExclusion: true,
        allowEmptySelection: true,
        items: (tagSection.tags ?? []).map((tag) => ({ id: tag.id, title: tag.title })),
        onValueChange: closureSelector(
          this,
          rowId,
          async (value: Record<string, "included" | "excluded">) => {
            this.metadata.tagsByGroup![sectionId] = value;
          },
        ),
      }),
    ]);
  }
}
