import type { Request, SearchFilter, SortingOption } from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import type { WPTag } from "../shared/models";

const TYPES = ["Manga", "Manhwa", "Manhua"];

const STATUSES = ["Ongoing", "Completed", "Hiatus", "Cancelled"];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS: string[] = [];
for (let y = CURRENT_YEAR; y >= 1946; y--) {
  // earliest year the site's filter supports
  YEARS.push(String(y));
}

export const SORT_OPTIONS: SortingOption[] = [
  { id: "post_desc", label: "Latest Updates" },
  { id: "post_asc", label: "Oldest Updates" },
  { id: "release_desc", label: "Newest Release" },
  { id: "release_asc", label: "Oldest Release" },
  { id: "title_asc", label: "Title A to Z" },
  { id: "title_desc", label: "Title Z to A" },
  { id: "popular_desc", label: "Most Popular" },
];

async function fetchAllTags(): Promise<WPTag[]> {
  const url = new URL(DOMAIN)
    .addPathComponent("wp-json")
    .addPathComponent("wp")
    .addPathComponent("v2")
    .addPathComponent("tags")
    .setQueryItem("per_page", "100")
    .toString();

  return fetchJSON<WPTag[]>({ url, method: "GET" } as Request);
}

export async function buildSearchFilters(): Promise<SearchFilter[]> {
  const tags = await fetchAllTags();

  const genreOptions = tags
    .filter((t) => t.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((t) => ({ id: String(t.id), value: t.name }));

  return [
    {
      id: "types",
      title: "Type",
      type: "dropdown" as const,
      options: [{ id: "", value: "Any" }, ...TYPES.map((t) => ({ id: t, value: t }))],
      value: "",
    },
    {
      id: "statuses",
      title: "Status",
      type: "dropdown" as const,
      options: [{ id: "", value: "Any" }, ...STATUSES.map((s) => ({ id: s, value: s }))],
      value: "",
    },
    {
      id: "genres",
      title: "Genres",
      type: "multiselect" as const,
      options: genreOptions,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: undefined,
    },
    {
      id: "genreMatchMode",
      title: "Genre Match",
      type: "dropdown" as const,
      options: [
        { id: "any", value: "Any (OR)" },
        { id: "all", value: "All (AND)" },
      ],
      value: "any",
    },
    {
      id: "years",
      title: "Year",
      type: "dropdown" as const,
      options: [{ id: "", value: "Any" }, ...YEARS.map((y) => ({ id: y, value: y }))],
      value: "",
    },
  ];
}

type FilterValue = string | Record<string, "included" | "excluded">;
type FilterEntry = { id: string; value: FilterValue };

// returns ids of all "included" options from a multiselect filter
export function readMultiselectFilter(filters: FilterEntry[], filterId: string): string[] {
  const entry = filters.find((f) => f.id === filterId);
  if (!entry) return [];
  const val = entry.value;
  if (typeof val === "string") return [];
  return Object.entries(val)
    .filter(([, state]) => state === "included")
    .map(([id]) => id);
}

// returns the selected option id, or the fallback if unset
export function readDropdownFilter(
  filters: FilterEntry[],
  filterId: string,
  fallback: string,
): string {
  const entry = filters.find((f) => f.id === filterId);
  if (!entry) return fallback;
  const val = entry.value;
  return typeof val === "string" && val.trim() ? val.trim() : fallback;
}
