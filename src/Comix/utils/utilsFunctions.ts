import { filter } from "../main";
import type { TagMap, SearchMetadata } from "../models";

export function getDefaultMetadata(genresFilter: string = ""): SearchMetadata {
  const genresHidden = filter.getHiddenGenresSettings();
  const getExcludedGenreObject = Object.fromEntries(
    filter.genres
      .filter((option) => genresHidden.includes(option.id))
      .map((item) => [item.id, "excluded" as const]),
  ) as TagMap;
  if (genresFilter.length > 0) {
    getExcludedGenreObject[genresFilter] = "included";
  }
  const demographicHidden = filter.getHiddenDemogSettings();
  const getExcludedDemographicObject = Object.fromEntries(
    filter.demographic
      .filter((option) => demographicHidden.includes(option.id))
      .map((item) => [item.id, "excluded" as const]),
  ) as TagMap;
  const themesHidden = filter.getHiddenThemesSettings();
  const getExcludedThemesObject = Object.fromEntries(
    filter.genres
      .filter((option) => themesHidden.includes(option.id))
      .map((item) => [item.id, "excluded" as const]),
  ) as TagMap;
  const showOnly = filter.getShowOnlySettings();
  const getShowOnlyObject = Object.fromEntries(
    filter.contentType
      .filter((option) => showOnly.includes(option.id))
      .map((item) => [item.id, "included" as const]),
  ) as TagMap;
  return {
    genres: getExcludedGenreObject,
    themes: getExcludedThemesObject,
    demographic: getExcludedDemographicObject,
    type: getShowOnlyObject,
  };
}
