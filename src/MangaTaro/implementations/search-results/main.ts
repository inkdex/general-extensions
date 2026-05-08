/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  PagedResults,
  Request,
  SearchQuery,
  SearchResultItem,
  SortingOption,
} from "@paperback/types";
import { ContentRating, URL } from "@paperback/types";
import {
  SearchFilterForm,
  type SearchFilter,
  type SearchFilterValue,
} from "@paperback/types/lib/compat/0.8";

import { fetchJSON } from "../../services/network";
import { DOMAIN } from "../shared/models";
import type { MangaTaroLoadItem, MangaTaroLoadRequest } from "../shared/models";
import { formatMangaId, isNovel, slugFromUrl } from "../shared/utils";
import {
  SORT_OPTIONS,
  buildSearchFilters,
  readDropdownFilter,
  readMultiselectFilter,
} from "./parsers";

function singleToArray(value: string): string {
  return value ? JSON.stringify([value]) : "[]";
}

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
    metadata?: { page?: number },
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const searchTerm = query.title?.trim() ?? "";
    const page = metadata?.page ?? 1;

    const filters = query.metadata ?? [];

    const genres = readMultiselectFilter(filters, "genres");
    const type = readDropdownFilter(filters, "types", "");
    const status = readDropdownFilter(filters, "statuses", "");
    const year = readDropdownFilter(filters, "years", "");
    const genreMatchMode = readDropdownFilter(filters, "genreMatchMode", "any");
    const sort = sortingOption?.id ?? "post_desc";

    const url = new URL(DOMAIN)
      .addPathComponent("wp-json")
      .addPathComponent("manga")
      .addPathComponent("v1")
      .addPathComponent("load")
      .toString();

    const body: MangaTaroLoadRequest = {
      page,
      search: searchTerm,
      genres: JSON.stringify(genres.map(Number)),
      types: singleToArray(type),
      statuses: singleToArray(status),
      years: year ? JSON.stringify([Number(year)]) : "[]",
      sort,
      genreMatchMode,
    };

    const request: Request = {
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    };

    const data = await fetchJSON<MangaTaroLoadItem[]>(request);

    const items: SearchResultItem[] = data
      .filter((item) => !isNovel(item.type))
      .map((item) => ({
        mangaId: formatMangaId(slugFromUrl(item.url) || item.id, item.id),
        title: item.title,
        imageUrl: item.cover,
        subtitle: item.type,
        contentRating: ContentRating.EVERYONE,
      }));

    return {
      items,
      metadata: data.length > 0 ? { page: page + 1 } : undefined,
    };
  }
}
