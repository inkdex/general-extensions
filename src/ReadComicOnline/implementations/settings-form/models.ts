import { SORT_OPTIONS } from "../shared/models";

export const HIDDEN_DISCOVER_SECTIONS_KEY = "readcomiconline-hidden-discover-sections";
export const DISCOVER_SECTION_ORDER_KEY = "readcomiconline-discover-section-order";
export const HIDDEN_SEARCH_GENRES_KEY = "readcomiconline-hidden-search-genres";
export const SEARCH_GENRE_ORDER_KEY = "readcomiconline-search-genre-order";
export const DEFAULT_SEARCH_SORT_KEY = "readcomiconline-default-search-sort";
export const DEFAULT_SEARCH_PAGE_KEY = "readcomiconline-default-search-page";
export const USE_HIGH_QUALITY_IMAGES_KEY = "readcomiconline-use-high-quality-images";

export const SEARCH_STATUS_OPTIONS = SORT_OPTIONS.map((option) => ({
  id: option.id,
  title: option.label,
}));

export const DEFAULT_PAGE_OPTIONS = [
  { id: "most-popular", title: "Most Popular" },
  { id: "latest-update", title: "Latest Update" },
  { id: "new-comic", title: "New Comic" },
];
