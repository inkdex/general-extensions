/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  PagedResults,
  Request,
  SearchFilter,
  SearchQuery,
  SearchResultItem,
  SortingOption,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN_API, PAGE_SIZE } from "../shared/models";
import type { Metadata, QIScansSeriesSearchResponse } from "../shared/models";
import { normalizeSearchTerm } from "../shared/utils";
import { fetchJSON } from "../../services/network";
import {
  buildSearchFilters,
  parseSearchResults,
  readDropdownFilter,
  SORT_OPTIONS,
} from "./parsers";
import type { FilterEntry } from "./parsers";

export class SearchProvider {
  async getSearchResults(
    query: SearchQuery,
    metadata?: Metadata,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const searchTerm = normalizeSearchTerm(query.title ?? "");

    if (searchTerm.length > 0 && searchTerm.length < 2) {
      return {
        items: [],
        metadata: undefined,
      };
    }

    let urlBuilder = searchTerm
      ? new URL(DOMAIN_API)
          .addPathComponent("v1")
          .addPathComponent("series")
          .addPathComponent("search")
          .setQueryItem("q", searchTerm)
          .setQueryItem("page", page.toString())
          .setQueryItem("perPage", PAGE_SIZE.toString())
      : new URL(DOMAIN_API)
          .addPathComponent("v1")
          .addPathComponent("series")
          .setQueryItem("page", page.toString())
          .setQueryItem("perPage", PAGE_SIZE.toString())
          .setQueryItem("sort", sortingOption?.id ?? "latest");

    if (!searchTerm) {
      const filters = (query.filters ?? []) as FilterEntry[];
      const status = readDropdownFilter(filters, "status", "");
      const type = readDropdownFilter(filters, "type", "");
      const genre = readDropdownFilter(filters, "genre", "");

      if (status) urlBuilder = urlBuilder.setQueryItem("status", status);
      if (type) urlBuilder = urlBuilder.setQueryItem("type", type);
      if (genre) urlBuilder = urlBuilder.setQueryItem("genre", genre);
    }

    const url = urlBuilder.toString();
    const request: Request = { url, method: "GET" };
    let data: QIScansSeriesSearchResponse = await fetchJSON<QIScansSeriesSearchResponse>(request);

    let results = parseSearchResults(data);

    if (results.length === 0 && searchTerm.includes("'")) {
      const curlySearchTerm = searchTerm.replace(/'/g, "\u2019");
      urlBuilder = new URL(DOMAIN_API)
        .addPathComponent("v1")
        .addPathComponent("series")
        .addPathComponent("search")
        .setQueryItem("q", curlySearchTerm)
        .setQueryItem("page", page.toString())
        .setQueryItem("perPage", PAGE_SIZE.toString());

      const retryUrl = urlBuilder.toString();
      const retryRequest: Request = { url: retryUrl, method: "GET" };
      data = await fetchJSON<QIScansSeriesSearchResponse>(retryRequest);
      results = parseSearchResults(data);
    }

    const hasNext = (data.data?.length ?? 0) >= PAGE_SIZE;

    return {
      items: results,
      metadata: hasNext ? { page: page + 1 } : undefined,
    };
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    return buildSearchFilters();
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return SORT_OPTIONS;
  }
}
