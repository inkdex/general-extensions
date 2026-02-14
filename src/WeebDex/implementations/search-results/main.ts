import {
  URL,
  type PagedResults,
  type Request,
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
} from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import {
  getDefaultSearchSort,
  getExcludedTags,
  getHideAdultResults,
  getItemsPerPage,
  getOriginalLanguages,
} from "../settings-form/forms/main";
import type { Metadata, WeebDexMangaListResponse, WeebDexTagListResponse } from "../shared/models";
import { extractSearchFilters, parseSearchResults } from "./parsers";

export class SearchProvider {
  async getSearchFilters(): Promise<SearchFilter[]> {
    const tagsUrl = new URL(WEEBDEX_API_DOMAIN)
      .addPathComponent("manga")
      .addPathComponent("tag")
      .setQueryItem("limit", "100")
      .toString();

    const tagsRequest: Request = { url: tagsUrl, method: "GET" };
    const tagsJson = await fetchJSON<WeebDexTagListResponse>(tagsRequest);

    const filters: SearchFilter[] = [];

    filters.push({
      type: "multiselect",
      id: "status",
      title: "Publication Status",
      options: [
        { id: "ongoing", value: "Ongoing" },
        { id: "completed", value: "Completed" },
        { id: "hiatus", value: "Hiatus" },
        { id: "cancelled", value: "Cancelled" },
      ],
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: undefined,
    });

    filters.push({
      type: "multiselect",
      id: "demographic",
      title: "Demographic",
      options: [
        { id: "shounen", value: "Shounen" },
        { id: "shoujo", value: "Shoujo" },
        { id: "seinen", value: "Seinen" },
        { id: "josei", value: "Josei" },
        { id: "none", value: "None" },
      ],
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: undefined,
    });

    const contentRatingOptions = [
      { id: "safe", value: "Safe" },
      { id: "suggestive", value: "Suggestive" },
      ...(!getHideAdultResults()
        ? [
            { id: "erotica", value: "Erotica" },
            { id: "pornographic", value: "Pornographic" },
          ]
        : []),
    ];

    filters.push({
      type: "multiselect",
      id: "contentRating",
      title: "Content Rating",
      options: contentRatingOptions,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: undefined,
    });

    const excludedTagIds = getExcludedTags();
    const availableTags = tagsJson.data.filter((tag) => !excludedTagIds.includes(tag.id));

    filters.push({
      type: "multiselect",
      id: "tags",
      title: "Tags",
      options: availableTags.map((tag) => ({
        id: tag.id,
        value: tag.name,
      })),
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    });

    filters.push({
      type: "multiselect",
      id: "tagMode",
      title: "Tag Inclusion Mode. Only one applies.",
      options: [
        { id: "AND", value: "AND - Must match ALL selected tags" },
        { id: "OR", value: "OR - Can match ANY selected tag" },
      ],
      value: { AND: "included" }, // default to AND
      allowExclusion: false,
      allowEmptySelection: false,
      maximum: 1,
    });

    return filters;
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    const options: SortingOption[] = [
      { id: "none", label: "None" },
      { id: "relevance", label: "Relevance" },
      { id: "lastUploadedChapterAt", label: "Latest Updates" },
      { id: "createdAt", label: "Recently Added" },
      { id: "rating", label: "Highest Rated" },
      { id: "views", label: "Most Popular" },
      { id: "follows", label: "Most Followed" },
      { id: "title", label: "Title (A-Z)" },
      { id: "year", label: "Year" },
    ];

    const defaultSort = getDefaultSearchSort();
    if (defaultSort === "none") return options;

    const defaultIndex = options.findIndex((o) => o.id === defaultSort);
    if (defaultIndex <= 0) return options;

    const [defaultOption] = options.splice(defaultIndex, 1);
    options.unshift(defaultOption);
    return options;
  }

  async getSearchResults(
    query: SearchQuery,
    metadata?: Metadata,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const limit = parseInt(getItemsPerPage(), 10);
    const searchTerm = query.title?.trim() || "";

    const urlBuilder = new URL(WEEBDEX_API_DOMAIN)
      .addPathComponent("manga")
      .setQueryItem("limit", limit.toString())
      .setQueryItem("page", page.toString());

    if (searchTerm) {
      urlBuilder.setQueryItem("title", searchTerm);
    }

    const filters = extractSearchFilters(query);

    if (filters.status.length > 0) {
      urlBuilder.setQueryItem("status", filters.status);
    }

    if (filters.demographic.length > 0) {
      urlBuilder.setQueryItem("demographic", filters.demographic);
    }

    let contentRatings: string[];
    if (filters.contentRating.length > 0) {
      contentRatings = filters.contentRating;
    } else {
      contentRatings = ["safe", "suggestive", "erotica"];
    }

    if (getHideAdultResults()) {
      contentRatings = contentRatings.filter((r) => r !== "erotica" && r !== "pornographic");
    }

    urlBuilder.setQueryItem("contentRating", contentRatings);

    if (filters.includedTags.length > 0) {
      urlBuilder.setQueryItem("tag", filters.includedTags);
    }
    // merge settings-excluded tags with user-excluded tags
    const settingsExcludedTags = getExcludedTags();
    if (settingsExcludedTags.length > 0) {
      const allExcludedTags = [...new Set([...filters.excludedTags, ...settingsExcludedTags])];
      urlBuilder.setQueryItem("tagx", allExcludedTags);
    } else if (filters.excludedTags.length > 0) {
      urlBuilder.setQueryItem("tagx", filters.excludedTags);
    }

    if (filters.tagMode) {
      urlBuilder.setQueryItem("tmod", filters.tagMode);
    }

    const selectedLanguages = getOriginalLanguages();
    if (selectedLanguages.length > 0) {
      urlBuilder.setQueryItem("lang", selectedLanguages);
    }

    const sortId = sortingOption?.id ?? getDefaultSearchSort();
    if (sortId !== "none") {
      urlBuilder.setQueryItem("sort", sortId);
      urlBuilder.setQueryItem("order", "desc");
    }

    const url = urlBuilder.toString();
    const request: Request = { url, method: "GET" };
    const json = await fetchJSON<WeebDexMangaListResponse>(request);

    const items = parseSearchResults(json);
    const hasMore = items.length >= limit;

    return {
      items,
      metadata: hasMore ? { page: page + 1 } : undefined,
    };
  }
}
