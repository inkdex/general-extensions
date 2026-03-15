import type { SearchFilter, SearchResultItem, SortingOption } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { FilterEntry, QToonComic } from "../shared/models";
import { comicId } from "../shared/utils";

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

export function parseQToonSearchResults(comics: QToonComic[]): SearchResultItem[] {
  return comics
    .filter((comic) => comicId(comic))
    .map((comic) => ({
      mangaId: comicId(comic),
      title: comic.title ?? "",
      subtitle: comic.author ?? "",
      imageUrl: comic.image.thumb.url,
      contentRating: ContentRating.EVERYONE,
    }));
}

export const SORT_OPTIONS: SortingOption[] = [
  { id: "hot", label: "Popular" },
  { id: "new", label: "New" },
];

export function buildSearchFilters(): SearchFilter[] {
  return [
    {
      type: "dropdown",
      id: "tag",
      title: "Genre",
      options: [
        { id: "-1", value: "All" },
        { id: "1", value: "Romance" },
        { id: "2", value: "Fantasy" },
        { id: "3", value: "Comedy" },
        { id: "4", value: "Action" },
        { id: "5", value: "BL" },
        { id: "6", value: "Drama" },
        { id: "7", value: "Thriller" },
        { id: "8", value: "Supernatural" },
      ],
      value: "-1",
    },
    {
      type: "dropdown",
      id: "serialStatus",
      title: "Status",
      options: [
        { id: "-1", value: "All" },
        { id: "101", value: "Ongoing" },
        { id: "103", value: "Completed" },
      ],
      value: "-1",
    },
  ];
}
