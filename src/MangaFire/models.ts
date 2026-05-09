export interface Metadata {
  offset?: number;
  collectedIds?: string[];
}
export interface Result {
  status: number;
  result: { html: string; title_format: string };
}

export interface PageResponse {
  status: number;
  result: { images: ImageData[] };
}

export interface FilterOption {
  id: string;
  name: string;
  type: "type" | "genres";
}

export interface SearchFilter {
  id: string;
  value: string;
}

// Represents each image entry in the "images" array
// Each entry is an array where:
// - index 0 is a string (image URL)
// - index 1 is a number (possibly an identifier or category)
// - index 2 is a number (possibly a flag or status indicator)
export type ImageData = [string, number, number];

export const Genres = [
  { id: "manhua", name: "Manhua", type: "type" },
  { id: "manhwa", name: "Manhwa", type: "type" },
  { id: "manga", name: "Manga", type: "type" },
  { id: "1", name: "Action", type: "genres" },
  { id: "78", name: "Adventure", type: "genres" },
  { id: "3", name: "Avant Garde", type: "genres" },
  { id: "4", name: "Boys Love", type: "genres" },
  { id: "5", name: "Comedy", type: "genres" },
  { id: "77", name: "Demons", type: "genres" },
  { id: "6", name: "Drama", type: "genres" },
  { id: "7", name: "Ecchi", type: "genres" },
  { id: "79", name: "Fantasy", type: "genres" },
  { id: "9", name: "Girls Love", type: "genres" },
  { id: "10", name: "Gourmet", type: "genres" },
  { id: "11", name: "Harem", type: "genres" },
  { id: "530", name: "Horror", type: "genres" },
  { id: "13", name: "Isekai", type: "genres" },
  { id: "531", name: "Iyashikei", type: "genres" },
  { id: "15", name: "Josei", type: "genres" },
  { id: "532", name: "Kids", type: "genres" },
  { id: "539", name: "Magic", type: "genres" },
  { id: "533", name: "Mahou Shoujo", type: "genres" },
  { id: "534", name: "Martial Arts", type: "genres" },
  { id: "19", name: "Mecha", type: "genres" },
  { id: "535", name: "Military", type: "genres" },
  { id: "21", name: "Music", type: "genres" },
  { id: "22", name: "Mystery", type: "genres" },
  { id: "23", name: "Parody", type: "genres" },
  { id: "536", name: "Psychological", type: "genres" },
  { id: "25", name: "Reverse Harem", type: "genres" },
  { id: "26", name: "Romance", type: "genres" },
  { id: "73", name: "School", type: "genres" },
  { id: "28", name: "Sci-Fi", type: "genres" },
  { id: "537", name: "Seinen", type: "genres" },
  { id: "30", name: "Shoujo", type: "genres" },
  { id: "31", name: "Shounen", type: "genres" },
  { id: "538", name: "Slice of Life", type: "genres" },
  { id: "33", name: "Space", type: "genres" },
  { id: "34", name: "Sports", type: "genres" },
  { id: "75", name: "Super Power", type: "genres" },
  { id: "76", name: "Supernatural", type: "genres" },
  { id: "37", name: "Suspense", type: "genres" },
  { id: "38", name: "Thriller", type: "genres" },
  { id: "39", name: "Vampire", type: "genres" },
];
