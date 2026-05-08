/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  PagedResults,
  Request,
  SearchQuery,
  SearchResultItem,
  SortingOption,
} from "@paperback/types";
import { URL } from "@paperback/types";
import {
  SearchFilterForm,
  type SearchFilter,
  type SearchFilterValue,
} from "@paperback/types/lib/compat/0.8";

import { fetchEncryptedJSON } from "../../services/network";
import { DOMAIN_API } from "../shared/models";
import type { QToonComicsList, SearchMetadata } from "../shared/models";
import {
  buildSearchFilters,
  parseQToonSearchResults,
  readDropdownFilter,
  SORT_OPTIONS,
} from "./parsers";

export class SearchProvider {
  async getSearchFilters(): Promise<SearchFilter[]> {
    return buildSearchFilters();
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return SORT_OPTIONS;
  }

  async getAdvancedSearchForm(query: SearchQuery<SearchFilterValue[]>) {
    // TODO: Replace compat wrapper with proper search form implementation
    return new SearchFilterForm(query.metadata, this.getSearchFilters());
  }

  async getSearchResults(
    query: SearchQuery<SearchFilterValue[]>,
    metadata?: SearchMetadata,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const filters = query.metadata ?? [];
    const title = query.title?.trim() ?? "";
    const tag = readDropdownFilter(filters, "tag", "-1");
    const status = readDropdownFilter(filters, "serialStatus", "-1");
    const sortType = sortingOption?.id ?? "hot";

    const base = new URL(DOMAIN_API)
      .addPathComponent("api")
      .addPathComponent("w")
      .addPathComponent("search")
      .addPathComponent("comic");

    const url = title
      ? base
          .addPathComponent("search")
          .setQueryItem("title", title)
          .setQueryItem("page", String(page))
          .toString()
      : base
          .addPathComponent("gallery")
          .setQueryItem("area", "-1") // -1 = unfiltered
          .setQueryItem("tag", tag)
          .setQueryItem("gender", "-1")
          .setQueryItem("serialStatus", status)
          .setQueryItem("sortType", sortType)
          .setQueryItem("page", String(page))
          .toString();

    const request: Request = { url, method: "GET" };
    const data = await fetchEncryptedJSON<QToonComicsList>(request);

    const items = parseQToonSearchResults(data.comics ?? []);
    const hasMore = data.more === 1;

    return {
      items,
      metadata: hasMore ? { page: page + 1 } : undefined,
    };
  }
}
