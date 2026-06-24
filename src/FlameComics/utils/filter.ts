/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  OptionItem,
  SearchMetadata,
  SortableListItem,
  FlameFilter,
  TristateParsed,
} from "../models";

/**
 * Helper: Parse a tristate filter (e.g., categories, publisher, author, artist)
 * and extract included/excluded names.
 *
 * @param filterMap - The tristate filter object {id: "included" | "excluded"}
 * @param availableOptions - Available filter options to lookup names
 * @returns Parsed filter data with hasFilters flag and name arrays
 */
function parseTristatFilter(
  filterMap: Record<string, "included" | "excluded"> | undefined,
  availableOptions: OptionItem[],
): TristateParsed {
  if (!filterMap || Object.keys(filterMap).length === 0) {
    return { hasFilters: false, requestedNames: [], rejectedNames: [] };
  }

  const rejectedIds: string[] = [];
  const requestedIds = Object.keys(filterMap).filter((id) => {
    if (filterMap[id] === "included") return true;
    rejectedIds.push(id);
    return false;
  });

  return {
    hasFilters: true,
    requestedNames: requestedIds.map((id) => availableOptions.find((opt) => opt.id === id)?.value),
    rejectedNames: rejectedIds.map((id) => availableOptions.find((opt) => opt.id === id)?.value),
  };
}

/**
 * Helper: Check if a candidate passes tristate filter for a given field array.
 *
 * @param candidateFieldValues - The values to check (e.g., candidate.author, candidate.artist)
 * @param requestedNames - Included names
 * @param rejectedNames - Excluded names
 * @param isExclusive - If true, ALL requested names must be present
 * @returns true if candidate passes, false otherwise
 */
function passesTristatFilter(
  candidateFieldValues: (string | undefined)[],
  requestedNames: (string | undefined)[],
  rejectedNames: (string | undefined)[],
  isExclusive: boolean,
): boolean {
  // Reject if any excluded value is found
  if (rejectedNames.some((name) => candidateFieldValues.includes(name))) {
    return false;
  }

  // If no requested values, candidate passes
  if (requestedNames.length === 0) {
    return true;
  }

  // Count how many requested values match
  const matchCount = requestedNames.filter((name) => candidateFieldValues.includes(name)).length;

  // In exclusive mode, ALL requested names must be present
  if (isExclusive) {
    return matchCount === requestedNames.length;
  }

  // In inclusive mode, at least ONE requested name must be present
  return matchCount > 0;
}

/**
 * Makes the final selection and applies the filters for the advanced search
 * @param candidates
 * @param selectedFilters
 * @param avaliableFilters
 * @returns
 */
export function selectAdvanceSearch(
  candidates: SortableListItem[],
  selectedFilters: SearchMetadata,
  avaliableFilters: FlameFilter,
): SortableListItem[] {
  // Parse tristate filters
  const categories = parseTristatFilter(selectedFilters.categories, avaliableFilters.categories);
  const publisher = parseTristatFilter(selectedFilters.publisher, avaliableFilters.publisher);
  const author = parseTristatFilter(selectedFilters.author, avaliableFilters.author);
  const artist = parseTristatFilter(selectedFilters.artist, avaliableFilters.artist);

  const categoriesMode = selectedFilters.categoriesMode ?? "or";

  // Check if any simple filters are active
  const needSearchTypes = selectedFilters.types && selectedFilters.types.length > 0;
  const needSearchStatus = selectedFilters.status && selectedFilters.status.length > 0;
  const needSearchYear = selectedFilters.year && selectedFilters.year.length > 0;
  const needSearchLanguage = selectedFilters.language !== undefined;
  const needSearchCountry = selectedFilters.country !== undefined;

  return candidates.filter((candidat: SortableListItem) => {
    // Apply tristate filters
    if (
      categories.hasFilters &&
      !passesTristatFilter(
        candidat.categories ?? [],
        categories.requestedNames,
        categories.rejectedNames,
        categoriesMode === "and",
      )
    ) {
      return false;
    }

    if (
      publisher.hasFilters &&
      !passesTristatFilter(
        candidat.publisher ?? [],
        publisher.requestedNames,
        publisher.rejectedNames,
        false,
      )
    ) {
      return false;
    }

    if (
      author.hasFilters &&
      !passesTristatFilter(
        candidat.author ?? [],
        author.requestedNames,
        author.rejectedNames,
        false,
      )
    ) {
      return false;
    }

    if (
      artist.hasFilters &&
      !passesTristatFilter(
        candidat.artist ?? [],
        artist.requestedNames,
        artist.rejectedNames,
        false,
      )
    ) {
      return false;
    }

    // Apply simple filters
    if (needSearchTypes && !selectedFilters.types?.includes(candidat.type)) {
      return false;
    }

    if (needSearchStatus && !selectedFilters.status?.includes(candidat.status)) {
      return false;
    }

    if (needSearchYear && !selectedFilters.year?.includes(candidat.year.toString())) {
      return false;
    }

    if (
      needSearchLanguage &&
      selectedFilters.language &&
      selectedFilters.language !== candidat.language
    ) {
      return false;
    }

    if (
      needSearchCountry &&
      selectedFilters.country &&
      selectedFilters.country !== candidat.country
    ) {
      return false;
    }

    return true;
  });
}
