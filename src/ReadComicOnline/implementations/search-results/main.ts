import type {
  PagedResults,
  Request,
  SearchFilter,
  SearchQuery,
  SearchResultItem,
  SortingOption,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN, SORT_OPTIONS, type FilterEntry, type SearchGenreOption } from "../shared/models";
import { fetchCheerio } from "../../services/network";
import {
  getDefaultSearchPage,
  getDefaultSearchSort,
  getHiddenSearchGenres,
  getSearchGenreOrder,
} from "../settings-form/forms/main";
import { getSearchGenreOption } from "../shared/utils";
import {
  buildSearchFilters,
  parseHasNextPage,
  parseSearchResults,
  readDropdownFilter,
  readExcludedMultiselectFilter,
  readMultiselectFilter,
} from "./parsers";

export class SearchProvider {
  async getSearchFilters(): Promise<SearchFilter[]> {
    const request: Request = {
      url: new URL(DOMAIN).addPathComponent("AdvanceSearch").toString(),
      method: "GET",
    };
    const $ = await fetchCheerio(request);

    return buildSearchFilters($, getVisibleSearchGenreOptions());
  }

  async getSearchResults(
    query: SearchQuery,
    metadata?: { page?: number },
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const searchTerm = query.title?.trim() ?? "";
    const filters = (query.filters ?? []) as FilterEntry[];
    const includedGenres = readMultiselectFilter(filters, "genres");
    const excludedGenres = readExcludedMultiselectFilter(filters, "genres");
    const status = sortingOption?.id ?? getDefaultSearchSort();
    const publicationYear = readDropdownFilter(filters, "publicationYear", "");
    const hasAdvancedSearchInput =
      searchTerm.length > 0 ||
      includedGenres.length > 0 ||
      excludedGenres.length > 0 ||
      publicationYear.length > 0 ||
      status.length > 0;

    if (!hasAdvancedSearchInput) {
      const request: Request = {
        url: buildDefaultSearchPageUrl(page),
        method: "GET",
      };
      const $ = await fetchCheerio(request);
      const items = parseSearchResults($);
      const hasMore = parseHasNextPage($);

      return {
        items,
        metadata: hasMore ? { page: page + 1 } : undefined,
      };
    }

    const url = new URL(DOMAIN)
      .addPathComponent("AdvanceSearch")
      .setQueryItem("comicName", searchTerm)
      .setQueryItem("ig", formatGenreValues(includedGenres))
      .setQueryItem("eg", formatGenreValues(excludedGenres))
      .setQueryItem("status", status)
      .setQueryItem("pubDate", publicationYear)
      .setQueryItem("page", String(page))
      .toString();

    const request: Request = {
      url,
      method: "GET",
    };
    const $ = await fetchCheerio(request);
    const items = parseSearchResults($);
    // advanced search returns 32 items while more pages exist
    const hasMore = items.length === 32;

    return {
      items,
      metadata: hasMore ? { page: page + 1 } : undefined,
    };
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return SORT_OPTIONS;
  }
}

function formatGenreValues(values: string[]): string {
  return values.length > 0 ? `${values.join(",")},` : "";
}

function getVisibleSearchGenreOptions(): SearchGenreOption[] {
  const hiddenGenres = getHiddenSearchGenres();

  return getSearchGenreOrder()
    .filter((genreId) => !hiddenGenres.includes(genreId))
    .map((genreId) => getSearchGenreOption(genreId))
    .filter((genre): genre is SearchGenreOption => genre !== undefined);
}

function buildDefaultSearchPageUrl(page: number): string {
  const path = new URL(DOMAIN).addPathComponent("ComicList");

  switch (getDefaultSearchPage()) {
    case "latest-update":
      path.addPathComponent("LatestUpdate");
      break;

    case "new-comic":
      path.addPathComponent("Newest");
      break;

    default:
      path.addPathComponent("MostPopular");
      break;
  }

  path.setQueryItem("page", String(page));
  return path.toString();
}
