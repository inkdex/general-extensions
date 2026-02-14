import type { SearchQuery, SearchResultItem } from "@paperback/types";
import { getSearchSubtitle } from "../settings-form/forms/main";
import type { ExtractedFilters, WeebDexMangaListResponse } from "../shared/models";
import { buildCoverUrl, buildMangaSubtitle, mapContentRating } from "../shared/utils";

export function extractSearchFilters(query: SearchQuery): ExtractedFilters {
  const status: string[] = [];
  const demographic: string[] = [];
  const contentRating: string[] = [];
  const includedTags: string[] = [];
  const excludedTags: string[] = [];
  let tagMode = "AND";

  if (!query.filters) {
    return {
      status,
      demographic,
      contentRating,
      includedTags,
      excludedTags,
      tagMode,
    };
  }

  for (const filter of query.filters) {
    if (!filter.value || typeof filter.value !== "object") continue;

    const filterValue = filter.value as Record<string, string>;

    switch (filter.id) {
      case "status":
        Object.keys(filterValue).forEach((key) => {
          if (filterValue[key] === "included") status.push(key);
        });
        break;

      case "demographic":
        Object.keys(filterValue).forEach((key) => {
          if (filterValue[key] === "included") demographic.push(key);
        });
        break;

      case "contentRating":
        Object.keys(filterValue).forEach((key) => {
          if (filterValue[key] === "included") contentRating.push(key);
        });
        break;

      case "tags":
        Object.entries(filterValue).forEach(([id, status]) => {
          if (status === "included") includedTags.push(id);
          if (status === "excluded") excludedTags.push(id);
        });
        break;

      case "tagMode": {
        const selectedMode = Object.keys(filterValue).find(
          (key) => filterValue[key] === "included",
        );
        if (selectedMode) {
          tagMode = selectedMode;
        }
        break;
      }
    }
  }

  return {
    status,
    demographic,
    contentRating,
    includedTags,
    excludedTags,
    tagMode,
  };
}

export function parseSearchResults(json: WeebDexMangaListResponse): SearchResultItem[] {
  const manga = json.data ?? [];

  if (manga.length === 0) {
    return [];
  }

  return manga
    .filter((item) => item.title && item.title.trim().length > 0)
    .map((item) => {
      return {
        mangaId: item.id,
        title: item.title,
        imageUrl: buildCoverUrl(item.id, item.relationships?.cover),
        subtitle: buildMangaSubtitle(item, getSearchSubtitle()),
        contentRating: mapContentRating(item.content_rating),
      };
    });
}
