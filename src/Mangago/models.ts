/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export const DOMAIN = "https://www.mangago.me";

// mangago needs two different User-Agents:
//
//   • Browsing UA (mobile iPhone) — for listing/search/discover and the
//     manga-details page, where a mobile UA lists chapters as read-manga URLs
//     (a desktop UA lists numeric /chapter/ URLs that www.mangago.me 404s).
//   • Reader UA (desktop macOS Chrome) — for the reader page, with the
//     _m_superu=1 cookie. This pair makes the reader return the complete image
//     list in one request (_multimode = "").
//
// readerHeadersForUrl() picks between them per request URL.
export const USER_AGENT =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

export const READER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36";

export type MangagoSearchMetadata = {
  page?: number;
  genre?: string;
  genres?: Record<string, "included" | "excluded">;
  statuses?: string[];
  // Default browse sort (genre tiles use "view"); a sort picker overrides it.
  sortby?: string;
};

export type MangagoGenreOption = {
  id: string;
  title: string;
};

export const STATUS_OPTIONS = [
  {
    id: "f",
    label: "Completed",
  },
  {
    id: "o",
    label: "Ongoing",
  },
] as const;

export const SORT_OPTIONS = [
  {
    id: "alphabetical",
    label: "Alphabetical",
    value: undefined,
  },
  {
    id: "views",
    label: "Views",
    value: "view",
  },
  {
    id: "popularity",
    label: "Popularity",
    value: "comment_count",
  },
  {
    id: "create_date",
    label: "Create Date",
    value: "create_date",
  },
  {
    id: "update_date",
    label: "Update Date",
    value: "update_date",
  },
] as const;

export const GENRES = [
  "Yaoi",
  "Comedy",
  "Shounen Ai",
  "Shoujo",
  "Yuri",
  "Josei",
  "Fantasy",
  "School Life",
  "Romance",
  "Doujinshi",
  "Smut",
  "Adult",
  "Mystery",
  "One Shot",
  "Ecchi",
  "Shounen",
  "Martial Arts",
  "Shoujo Ai",
  "Supernatural",
  "Drama",
  "Action",
  "Adventure",
  "Harem",
  "Historical",
  "Horror",
  "Mature",
  "Mecha",
  "Psychological",
  "Sci-fi",
  "Seinen",
  "Slice Of Life",
  "Sports",
  "Gender Bender",
  "Tragedy",
  "Bara",
  "Webtoons",
];

export function genreIdFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export const GENRE_OPTIONS: MangagoGenreOption[] = GENRES.map((genre) => ({
  id: genreIdFromTitle(genre),
  title: genre,
}));

export function getGenreTitle(idOrTitle: string): string {
  return (
    GENRE_OPTIONS.find((genre) => genre.id === idOrTitle || genre.title === idOrTitle)?.title ??
    idOrTitle
  );
}

export type MangagoImageContext = {
  desckey: string;
  cols: number;
};

export const DISCOVER_SECTION_OPTIONS = [
  { id: "featured_manga", title: "Featured Manga" },
  { id: "popular_manga", title: "Popular Manga" },
  { id: "new_chapters", title: "New Chapters" },
  { id: "top_yaoi", title: "Yaoi Manga Top 5" },
  { id: "top_shoujo", title: "Shoujo Manga Top 10" },
  { id: "top_comedy", title: "Comedy Manga Top 5" },
  { id: "top_supernatural", title: "Supernatural Manga Top 10" },
  { id: "top_fantasy", title: "Fantasy Manga Top 5" },
  { id: "top_mystery", title: "Mystery Manga Top 10" },
  { id: "top_josei", title: "Josei Manga Top 5" },
  { id: "top_shounen_ai", title: "Shounen Ai Manga Top 5" },
  { id: "top_yuri", title: "Yuri Manga Top 5" },
  { id: "top_school_life", title: "School Life Manga Top 5" },
  { id: "genres", title: "Genres" },
] as const;

// Sections present in settings but hidden from the home page until the user
// enables them — keeps the default home short without dropping the option.
const DEFAULT_OFF_SECTION_IDS = new Set<string>(["top_shounen_ai", "top_yuri", "top_school_life"]);

function discoverSectionStateKey(sectionId: string): string {
  return `mangago_discover_section_${sectionId}`;
}

export function getDiscoverSectionEnabled(sectionId: string): boolean {
  const stored = Application.getState(discoverSectionStateKey(sectionId)) as boolean | undefined;
  return stored ?? !DEFAULT_OFF_SECTION_IDS.has(sectionId);
}

export function setDiscoverSectionEnabled(sectionId: string, enabled: boolean): void {
  Application.setState(enabled, discoverSectionStateKey(sectionId));
}

export function resetDiscoverSectionSettings(): void {
  for (const section of DISCOVER_SECTION_OPTIONS) {
    Application.setState(undefined, discoverSectionStateKey(section.id));
  }
}

// mangago has no real content-type field; "Webtoons" is its only manhwa/manhua
// signal, so the type filter just includes or excludes that one genre.
export const CONTENT_TYPE_OPTIONS = [
  { id: "all", title: "All" },
  { id: "webtoons", title: "Manhwa / Manhua" },
  { id: "manga", title: "Manga" },
] as const;

export function getHiddenGenreIds(): string[] {
  return (Application.getState("mangago_hidden_genres") as string[] | undefined) ?? [];
}

export function setHiddenGenreIds(ids: string[]): void {
  Application.setState(ids, "mangago_hidden_genres");
}

export function getContentType(): string {
  return (Application.getState("mangago_content_type") as string | undefined) ?? "all";
}

export function setContentType(value: string): void {
  Application.setState(value, "mangago_content_type");
}

export function resetMangagoFilters(): void {
  Application.setState(undefined, "mangago_hidden_genres");
  Application.setState(undefined, "mangago_content_type");
}
