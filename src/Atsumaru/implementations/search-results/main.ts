import type {
  PagedResults,
  Request,
  SearchFilter,
  SearchQuery,
  SearchResultItem,
  SortingOption,
} from "@paperback/types";
import { ContentRating, URL } from "@paperback/types";
import { ATSUMARU_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import { getShowAdult } from "../settings-form/main";
import type {
  AtsuAvailableFiltersResponse,
  AtsuFilteredViewRequest,
  AtsuFilteredViewResponse,
  AtsuSearchResponse,
} from "../shared/models";
import { extractSearchFilters } from "./parsers";

const PAGE_SIZE = 20;

export class SearchProvider {
  async getSearchFilters(): Promise<SearchFilter[]> {
    const url = new URL(ATSUMARU_DOMAIN)
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

    return searchFilters;
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      { id: "none", label: "All Statuses" },
      { id: "Ongoing", label: "Ongoing" },
      { id: "Completed", label: "Completed" },
      { id: "Hiatus", label: "Hiatus" },
      { id: "Canceled", label: "Canceled" },
    ];
  }

  async getSearchResults(
    query: SearchQuery,
    metadata?: { page?: number },
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const searchTerm = query.title?.trim() || "";

    // ensure page is ALWAYS a number
    const page = metadata && typeof metadata.page === "number" ? metadata.page : 0;

    // check if filters are being used
    const hasFilters =
      query.filters &&
      query.filters.length > 0 &&
      query.filters.some((f) => {
        if (!f.value || typeof f.value !== "object") return false;
        return Object.keys(f.value).length > 0;
      });

    // use default filteredView when no search query is provided
    if (!searchTerm && !hasFilters && (!sortingOption || sortingOption.id === "none")) {
      return this.getDefaultBrowseResults(page);
    }

    // if filters OR status sort is used, use filteredView
    if (hasFilters || (sortingOption && sortingOption.id !== "none")) {
      // double-check page is a number, keeps serializing as string
      const safePage = typeof page === "number" && !isNaN(page) ? page : 0;
      return this.getFilteredResults(query, safePage, sortingOption);
    }

    // use fast search api for text-only queries
    if (!searchTerm) {
      return { items: [], metadata: undefined };
    }

    const showAdult = getShowAdult();
    const url = new URL(ATSUMARU_DOMAIN)
      .addPathComponent("collections")
      .addPathComponent("manga")
      .addPathComponent("documents")
      .addPathComponent("search")
      .setQueryItem("q", searchTerm)
      .setQueryItem("limit", PAGE_SIZE.toString())
      .setQueryItem("query_by", "title,englishTitle,otherNames")
      .setQueryItem("query_by_weights", "3,2,1")
      .setQueryItem("include_fields", "id,title,englishTitle,poster,type")
      .setQueryItem("num_typos", "4,3,2")
      .setQueryItem("page", (page + 1).toString());
    if (showAdult) url.setQueryItem("adult", "1");

    const request: Request = { url: url.toString(), method: "GET" };
    const json = await fetchJSON<AtsuSearchResponse>(request);

    const items: SearchResultItem[] = json.hits.map((hit) => ({
      mangaId: hit.document.id,
      title: hit.document.title || hit.document.englishTitle,
      imageUrl: `${ATSUMARU_DOMAIN}${hit.document.poster}`,
      subtitle: hit.document.type,
      contentRating: showAdult ? ContentRating.ADULT : ContentRating.EVERYONE,
    }));

    const hasMore = json.found > (page + 1) * PAGE_SIZE;

    return {
      items,
      metadata: hasMore ? { page: page + 1 } : undefined,
    };
  }

  private async getDefaultBrowseResults(page: number): Promise<PagedResults<SearchResultItem>> {
    const safePage = typeof page === "number" && !isNaN(page) ? page : 0;
    const showAdult = getShowAdult();

    const requestBody: AtsuFilteredViewRequest = {
      filter: {
        search: "",
        genres: [],
        excludeGenres: [],
        types: [],
        status: [],
        years: [],
        minChapters: null,
        hideBookmarked: false,
        officialTranslation: false,
        showAdult,
        sortBy: "popularity",
      },
      page: safePage,
    };

    const url = new URL(ATSUMARU_DOMAIN)
      .addPathComponent("api")
      .addPathComponent("explore")
      .addPathComponent("filteredView")
      .toString();

    const request: Request = {
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    };

    const json = await fetchJSON<AtsuFilteredViewResponse>(request);

    const items: SearchResultItem[] = json.items.map((item) => ({
      mangaId: item.id,
      title: item.title,
      imageUrl: `${ATSUMARU_DOMAIN}/static/${item.image}`,
      subtitle: item.type,
      contentRating: showAdult ? ContentRating.ADULT : ContentRating.EVERYONE,
    }));

    return {
      items,
      metadata: items.length >= PAGE_SIZE ? { page: safePage + 1 } : undefined,
    };
  }

  private async getFilteredResults(
    query: SearchQuery,
    page: number,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    // force page to be a valid number, in case it's a string again
    const safePage = typeof page === "number" && !isNaN(page) ? page : 0;
    const showAdult = getShowAdult();

    const filters = extractSearchFilters(query);

    // determine status from sorting option
    const statusList: string[] = [];
    if (sortingOption && sortingOption.id !== "none") {
      statusList.push(sortingOption.id);
    }

    const requestBody: AtsuFilteredViewRequest = {
      filter: {
        search: query.title?.trim() || "",
        genres: filters.includedTags,
        excludeGenres: filters.excludedTags,
        types: filters.selectedTypes,
        status: statusList,
        years: [],
        minChapters: null,
        hideBookmarked: false,
        officialTranslation: false,
        showAdult,
        sortBy: "popularity",
      },
      page: safePage,
    };

    const url = new URL(ATSUMARU_DOMAIN)
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
      imageUrl: `${ATSUMARU_DOMAIN}/static/${item.image}`,
      subtitle: item.type,
      contentRating: showAdult ? ContentRating.ADULT : ContentRating.EVERYONE,
    }));

    return {
      items,
      metadata: items.length >= PAGE_SIZE ? { page: safePage + 1 } : undefined,
    };
  }
}
