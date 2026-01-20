import type { SearchQuery } from "@paperback/types";
import type { ExtractedFilters } from "../shared/models";

export function extractSearchFilters(query: SearchQuery): ExtractedFilters {
  const includedTags: string[] = [];
  const excludedTags: string[] = [];
  const selectedTypes: string[] = [];

  // extract tags
  const tagsFilter = query.filters?.find((f) => f.id === "tags");
  if (tagsFilter?.value && typeof tagsFilter.value === "object") {
    const tagValue = tagsFilter.value as Record<string, string>;
    Object.entries(tagValue).forEach(([id, status]) => {
      if (status === "included") includedTags.push(id);
      if (status === "excluded") excludedTags.push(id);
    });
  }

  // extract types
  const typesFilter = query.filters?.find((f) => f.id === "types");
  if (typesFilter?.value && typeof typesFilter.value === "object") {
    const typeValue = typesFilter.value as Record<string, string>;
    Object.keys(typeValue).forEach((id) => {
      if (typeValue[id] === "included") selectedTypes.push(id);
    });
  }

  return { includedTags, excludedTags, selectedTypes };
}
