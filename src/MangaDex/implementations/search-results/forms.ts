/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  closureSelector,
  InputRow,
  Section,
  SelectSection,
  ToggleRow,
  TriStateSelectRow,
  type FormSectionElement,
  type JSONObject,
  type SearchQuery,
  type TagSection,
} from "@paperback/types";

import { DEMOGRAPHICS, ORIGINAL_LANGUAGES, PUBLICATION_STATUSES } from "../shared/lookups";

export interface MangaDexSearchMetadata extends JSONObject {
  // Single element string[] to match SelectSection's binding.
  includeOperator?: string[];
  excludeOperator?: string[];
  tagsByGroup?: Record<string, Record<string, "included" | "excluded">>;
  demographics?: string[];
  statuses?: string[];
  originalLanguages?: string[];
  // Parsed to a positive integer when applying to the URL.
  year?: string;
  // false omits the param entirely so zero chapter titles surface.
  hasAvailableChapters?: boolean;
  authorOrArtist?: string;
  group?: string;
}

const DEFAULT_INCLUDE_OPERATOR = "AND";
const DEFAULT_EXCLUDE_OPERATOR = "OR";
const OPERATORS = ["AND", "OR"];
const OPERATOR_ITEMS = OPERATORS.map((id) => ({ id, title: id }));

const DEMOGRAPHIC_ITEMS = DEMOGRAPHICS.map((d) => ({ id: d.enum, title: d.name }));
const STATUS_ITEMS = PUBLICATION_STATUSES.map((s) => ({ id: s.enum, title: s.name }));
const ORIGINAL_LANGUAGE_ITEMS = ORIGINAL_LANGUAGES.map((l) => ({ id: l.enum, title: l.name }));

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
    meta.demographics ??= [];
    meta.statuses ??= [];
    meta.originalLanguages ??= [];
    meta.year ??= "";
    meta.hasAvailableChapters ??= true;
    meta.authorOrArtist ??= "";
    meta.group ??= "";
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
      this.multiSelectSection(
        "demographics",
        "Publication Demographic",
        this.metadata.demographics!,
        DEMOGRAPHIC_ITEMS,
      ),
      this.multiSelectSection(
        "statuses",
        "Publication Status",
        this.metadata.statuses!,
        STATUS_ITEMS,
      ),
      this.multiSelectSection(
        "originalLanguages",
        "Original Language",
        this.metadata.originalLanguages!,
        ORIGINAL_LANGUAGE_ITEMS,
      ),
      this.inputSection({
        sectionId: "year_section",
        header: "Year",
        rowId: "year",
        title: "Year (e.g. 2024)",
        value: this.metadata.year!,
        apply: (v) => {
          this.metadata.year = v;
        },
      }),
      Section({ id: "has_available_chapters_section" }, [
        ToggleRow("has_available_chapters", {
          title: "Has Available Chapters",
          subtitle: "Hide titles with zero translated chapters in your languages",
          value: this.metadata.hasAvailableChapters!,
          onValueChange: closureSelector(this, "has_available_chapters", async (value: boolean) => {
            this.metadata.hasAvailableChapters = value;
          }),
        }),
      ]),
      this.inputSection({
        sectionId: "author_artist_section",
        header: "Author or Artist",
        rowId: "author_or_artist",
        title: "Author/Artist UUID",
        value: this.metadata.authorOrArtist!,
        apply: (v) => {
          this.metadata.authorOrArtist = v;
        },
      }),
      this.inputSection({
        sectionId: "group_section",
        header: "Scanlation Group",
        rowId: "group",
        title: "Group UUID",
        value: this.metadata.group!,
        apply: (v) => {
          this.metadata.group = v;
        },
      }),
    ];
  }

  private inputSection(opts: {
    sectionId: string;
    header: string;
    rowId: string;
    title: string;
    value: string;
    apply: (value: string) => void;
  }): FormSectionElement<unknown> {
    return Section({ id: opts.sectionId, header: opts.header }, [
      InputRow(opts.rowId, {
        title: opts.title,
        value: opts.value,
        onValueChange: closureSelector(this, opts.rowId, async (value: string) => {
          opts.apply(value);
        }),
      }),
    ]);
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

  private multiSelectSection(
    id: string,
    header: string,
    value: string[],
    items: { id: string; title: string }[],
  ): FormSectionElement<unknown> {
    // SelectSection mutates `value` in place, so no onValueChange needed.
    return SelectSection(this, {
      id,
      header,
      layout: "flow",
      value,
      items,
      minItemCount: 0,
      maxItemCount: items.length,
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
