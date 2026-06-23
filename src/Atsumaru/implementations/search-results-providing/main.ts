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
  SearchFilterForm as PaperbackSearchFilterForm,
  type SearchFilter,
  type SearchFilterValue,
} from "@paperback/types/lib/compat/0.8";

import { fetchJSON } from "../../services/network";
import { getShowAdult } from "../settings-form-providing/main";
import { DOMAIN } from "../shared/models";
import type { AtsuAvailableFiltersResponse, AtsuSearchResponse } from "../shared/models";
import { buildThumbnailUrl, getContentRating } from "../shared/utils";
import { extractSearchFilters, sanitizeMinChapters } from "./parsers";

const PAGE_SIZE = 20;

class SearchFilterForm extends PaperbackSearchFilterForm {
  override getSections() {
    return super.getSections().map((section) => ({
      ...section,
      items: section.items.map((item) => {
        if (item.id !== "minChapters" || item.type !== "inputRow") return item;

        return {
          ...item,
          value: sanitizeMinChapters((item as { value?: string }).value ?? ""),
          onValueChange: Application.Selector(this as SearchFilterForm, "setMinChapters"),
        };
      }),
    }));
  }

  async setMinChapters(value: string): Promise<void> {
    this.selectedFilterValues.minChapters = sanitizeMinChapters(value);
    this.reloadForm();
  }
}

function escapeFilterValue(value: string): string {
  return `\`${value.replace(/\\/g, "\\\\").replace(/`/g, "\\`")}\``;
}

function buildYearOptions(): Array<{ id: string; value: string }> {
  const years: Array<{ id: string; value: string }> = [];
  for (let year = new Date().getFullYear() + 1; year >= 1970; year--) {
    years.push({ id: String(year), value: String(year) });
  }
  return years;
}

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

    searchFilters.push({
      type: "multiselect",
      id: "years",
      title: "Years",
      options: buildYearOptions(),
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: undefined,
    });

    searchFilters.push({
      type: "input",
      id: "minChapters",
      title: "Minimum Chapters",
      placeholder: "0",
      value: "",
    });

    searchFilters.push({
      type: "dropdown",
      id: "officialTranslation",
      title: "Official Translation",
      options: [
        { id: "", value: "Any" },
        { id: "true", value: "Only Official Translations" },
      ],
      value: "",
    });

    return searchFilters;
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "views:desc", label: "Popularity" },
      { id: "trending:desc", label: "Trending" },
      { id: "dateAdded:desc", label: "Date Added" },
      { id: "releaseDate:desc", label: "Release Date" },
      { id: "mbRating:desc", label: "Top Rated" },
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
    const page = metadata?.page ?? 1;
    const showAdult = getShowAdult();
    const filters = extractSearchFilters(query);
    const searchTerm = query.title?.trim() || "";
    const sortBy = sortingOption?.id ?? "views:desc";

    const filterBy: string[] = [];
    for (const tag of filters.includedTags) {
      filterBy.push(`genreIds:=${escapeFilterValue(tag)}`);
    }

    if (filters.excludedTags.length > 0) {
      filterBy.push(
        `genreIds:!=[${filters.excludedTags.map((tag) => escapeFilterValue(tag)).join(",")}]`,
      );
    }

    if (filters.selectedTypes.length > 0) {
      filterBy.push(
        `type:=[${filters.selectedTypes.map((type) => escapeFilterValue(type)).join(",")}]`,
      );
    }

    if (filters.selectedStatuses.length > 0) {
      filterBy.push(
        `status:=[${filters.selectedStatuses.map((status) => escapeFilterValue(status)).join(",")}]`,
      );
    }

    if (filters.selectedYears.length > 0) {
      filterBy.push(`releaseYear:=[${filters.selectedYears.join(",")}]`);
    }

    if (filters.minChapters !== null) {
      filterBy.push(`chapterCount:>=${filters.minChapters}`);
    }

    if (filters.officialTranslation) {
      filterBy.push("officialTranslation:=true");
    }

    if (!showAdult) {
      filterBy.push("isAdult:=false");
    }

    if (sortBy === "mbRating:desc") {
      filterBy.push("mbRating:>0");
    } else if (sortBy === "views:desc") {
      filterBy.push("views:>0");
    }

    const url = new URL(DOMAIN)
      .addPathComponent("collections")
      .addPathComponent("manga")
      .addPathComponent("documents")
      .addPathComponent("search")
      .setQueryItem("q", searchTerm || "*")
      .setQueryItem("query_by", "title,englishTitle,otherNames,authors")
      .setQueryItem("query_by_weights", "4,3,2,1")
      .setQueryItem("num_typos", "4,3,2,1")
      .setQueryItem("include_fields", "id,title,englishTitle,poster,posterSmall,posterMedium,type")
      .setQueryItem("filter_by", filterBy.join(" && "))
      .setQueryItem("page", String(page))
      .setQueryItem("per_page", String(PAGE_SIZE))
      .setQueryItem("sort_by", sortBy)
      .toString();

    const request: Request = {
      url,
      method: "GET",
    };

    const data = await fetchJSON<AtsuSearchResponse>(request);

    const hits = data.hits ?? [];
    const items: SearchResultItem[] = hits.map(({ document: manga }) => ({
      mangaId: manga.id,
      title: manga.title || manga.englishTitle || "",
      imageUrl: buildThumbnailUrl(manga),
      subtitle: manga.type,
      contentRating: getContentRating(),
    }));

    const hasMore = page * PAGE_SIZE < data.found && hits.length > 0;

    return {
      items,
      metadata: hasMore ? { page: page + 1 } : undefined,
    };
  }
}
