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

import { DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import { getShowAdult } from "../settings-form/main";
import type {
  AtsuAvailableFiltersResponse,
  AtsuFilteredViewRequest,
  AtsuFilteredViewResponse,
} from "../shared/models";
import { buildThumbnailUrl, getContentRating } from "../shared/utils";
import { extractSearchFilters } from "./parsers";

const PAGE_SIZE = 20;

export class SearchProvider {
  async getSearchFilters(): Promise<SearchFilter[]> {
    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("explore")
      .addPathComponent("availableFilters")
      .toString();

    const request: Request = { url, method: "GET" };
    const filters = await fetchJSON<AtsuAvailableFiltersResponse>(request);

    const searchFilters: SearchFilter[] = [];
    if (filters.genres && filters.genres.length > 0) {
      searchFilters.push({
        type: "multiselect",
        id: "tags",
        title: "Tags",
        options: filters.genres.map((genre) => ({
          id: genre.id,
          value: genre.name,
        })),
        value: {},
        allowExclusion: true,
        allowEmptySelection: true,
        maximum: undefined,
      });
    }

    if (filters.types && filters.types.length > 0) {
      searchFilters.push({
        type: "multiselect",
        id: "types",
        title: "Types",
        options: filters.types.map((type) => ({
          id: type.id,
          value: type.name,
        })),
        value: {},
        allowExclusion: false,
        allowEmptySelection: true,
        maximum: undefined,
      });
    }

    if (filters.statuses && filters.statuses.length > 0) {
      searchFilters.push({
        type: "multiselect",
        id: "statuses",
        title: "Status",
        options: filters.statuses.map((status) => ({
          id: status.id,
          value: status.name,
        })),
        value: {},
        allowExclusion: false,
        allowEmptySelection: true,
        maximum: undefined,
      });
    }

    return searchFilters;
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "title", label: "Title" },
      { id: "popularity", label: "Popularity" },
      { id: "trending", label: "Trending" },
      { id: "createdAt", label: "Date Added" },
      { id: "released", label: "Release Date" },
      { id: "topRated", label: "Top Rated" },
    ];
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
    const page = metadata && typeof metadata.page === "number" ? metadata.page : 0;
    return this.getFilteredResults(query, page, sortingOption);
  }

  private async getFilteredResults(
    query: SearchQuery<SearchFilterValue[]>,
    page: number,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const showAdult = getShowAdult();
    const filters = extractSearchFilters(query);

    const requestBody: AtsuFilteredViewRequest = {
      filter: {
        search: query.title?.trim() || "",
        genres: filters.includedTags,
        excludeGenres: filters.excludedTags,
        types: filters.selectedTypes,
        status: filters.selectedStatuses,
        years: [],
        minChapters: null,
        hideBookmarked: false,
        officialTranslation: false,
        showAdult,
        sortBy: sortingOption?.id || "Popularity",
      },
      page,
    };

    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("explore")
      .addPathComponent("filteredView")
      .toString();

    const request: Request = {
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody), // stringify instead of passing object, should fix serialization
    };

    const json = await fetchJSON<AtsuFilteredViewResponse>(request);

    const items: SearchResultItem[] = json.items.map((item) => ({
      mangaId: item.id,
      title: item.title,
      imageUrl: buildThumbnailUrl(item.image),
      subtitle: item.type,
      contentRating: getContentRating(),
    }));

    return {
      items,
      metadata: items.length >= PAGE_SIZE ? { page: page + 1 } : undefined,
    };
  }
}
