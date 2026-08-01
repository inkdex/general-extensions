/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { FormSectionElement } from "@paperback/types";
import { AdvancedSearchForm } from "@paperback/types";
import type { SearchFilterValue } from "@paperback/types/lib/compat/0.8";

export class HomeSectionSearchForm extends AdvancedSearchForm {
  constructor(private readonly filters: SearchFilterValue[]) {
    super();
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [];
  }

  override getSearchQueryMetadata(): SearchFilterValue[] {
    return this.filters;
  }
}
