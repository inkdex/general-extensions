import type { Request, SearchFilter, SearchResultItem, SortingOption } from "@paperback/types";
import { ContentRating, URL } from "@paperback/types";
import { fetchJSON } from "../../services/network";
import { DOMAIN_API } from "../shared/models";
import type { QIScansSeriesGenre, QIScansSeriesSearchResponse } from "../shared/models";
import { encodeMangaId } from "../shared/utils";

export const SORT_OPTIONS: SortingOption[] = [
  { id: "latest", label: "Latest Updated" },
  { id: "newest", label: "Newest" },
  { id: "popular", label: "Popular" },
  { id: "alphabetical", label: "A-Z" },
];

export type FilterEntry = {
  id: string;
  value: string;
};

async function fetchGenres(): Promise<QIScansSeriesGenre[]> {
  const url = new URL(DOMAIN_API)
    .addPathComponent("v1")
    .addPathComponent("series")
    .addPathComponent("genres")
    .toString();
  const request: Request = { url, method: "GET" };
  return await fetchJSON<QIScansSeriesGenre[]>(request);
}

export async function buildSearchFilters(): Promise<SearchFilter[]> {
  const genres = await fetchGenres();

  return [
    {
      type: "dropdown",
      id: "status",
      title: "Status",
      options: [
        { id: "", value: "All" },
        { id: "ONGOING", value: "Ongoing" },
        { id: "HIATUS", value: "Hiatus" },
        { id: "DROPPED", value: "Dropped" },
        { id: "COMPLETED", value: "Completed" },
      ],
      value: "",
    },
    {
      type: "dropdown",
      id: "type",
      title: "Type",
      options: [
        { id: "", value: "All Types" },
        { id: "MANGA", value: "Manga" },
        { id: "MANHWA", value: "Manhwa" },
        { id: "MANHUA", value: "Manhua" },
      ],
      value: "",
    },
    {
      type: "dropdown",
      id: "genre",
      title: "Genre",
      options: [
        { id: "", value: "All Genres" },
        ...genres.map((genre) => ({
          id: genre.slug,
          value: genre.name.trim(),
        })),
      ],
      value: "",
    },
  ];
}

export function readDropdownFilter(
  filters: FilterEntry[],
  filterId: string,
  fallback: string,
): string {
  const entry = filters.find((filter) => filter.id === filterId);
  if (!entry) return fallback;
  return entry.value.trim() ? entry.value.trim() : fallback;
}

function formatSearchSubtitle(type?: string, status?: string): string {
  const parts = [type, status]
    .filter((value): value is string => Boolean(value))
    .map((value) =>
      value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    );

  return parts.join(" • ");
}

export function parseSearchResults(data: QIScansSeriesSearchResponse): SearchResultItem[] {
  return (data.data ?? [])
    .filter((series) => {
      if (!series.title || series.title.trim().length === 0) {
        return false;
      }
      if (series.title.startsWith("http://") || series.title.startsWith("https://")) {
        return false;
      }
      if (series.type === "NOVEL") {
        return false;
      }
      if (series.redirectUrl?.trim()) {
        return false;
      }
      return true;
    })
    .map((series) => {
      const imageUrl = series.cover || "";

      return {
        mangaId: encodeMangaId(series.slug),
        title: Application.decodeHTMLEntities(series.title),
        imageUrl: imageUrl,
        subtitle: formatSearchSubtitle(series.type, series.status),
        contentRating: ContentRating.EVERYONE,
      };
    });
}
