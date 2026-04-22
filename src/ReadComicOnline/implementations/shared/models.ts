import type { SortingOption } from "@paperback/types";

export const DOMAIN = "https://readcomiconline.li";
export const DOMAIN_IMAGE = "https://2.bp.blogspot.com";
export const DOMAIN_IMAGE_PROXY = "https://ano1.rconet.biz/pic";

export type Metadata = {
  page?: number;
};

export type FilterValue = string | Record<string, "included" | "excluded">;

export type FilterEntry = {
  id: string;
  value: FilterValue;
};

export const SORT_OPTIONS: SortingOption[] = [
  { id: "", label: "Any Status" },
  { id: "Ongoing", label: "Ongoing" },
  { id: "Completed", label: "Completed" },
];

export type SearchGenreOption = {
  id: string;
  value: string;
};

export const SEARCH_GENRE_OPTIONS: SearchGenreOption[] = [
  { id: "1", value: "Action" },
  { id: "2", value: "Adventure" },
  { id: "38", value: "Anthology" },
  { id: "46", value: "Anthropomorphic" },
  { id: "41", value: "Biography" },
  { id: "49", value: "Children" },
  { id: "3", value: "Comedy" },
  { id: "17", value: "Crime" },
  { id: "19", value: "Drama" },
  { id: "25", value: "Family" },
  { id: "20", value: "Fantasy" },
  { id: "31", value: "Fighting" },
  { id: "5", value: "Graphic Novels" },
  { id: "28", value: "Historical" },
  { id: "15", value: "Horror" },
  { id: "35", value: "Leading Ladies" },
  { id: "51", value: "LGBTQ" },
  { id: "44", value: "Literature" },
  { id: "40", value: "Manga" },
  { id: "4", value: "Martial Arts" },
  { id: "8", value: "Mature" },
  { id: "33", value: "Military" },
  { id: "56", value: "Mini-Series" },
  { id: "47", value: "Movies & TV" },
  { id: "55", value: "Music" },
  { id: "23", value: "Mystery" },
  { id: "21", value: "Mythology" },
  { id: "48", value: "Personal" },
  { id: "42", value: "Political" },
  { id: "43", value: "Post-Apocalyptic" },
  { id: "27", value: "Psychological" },
  { id: "39", value: "Pulp" },
  { id: "53", value: "Religious" },
  { id: "9", value: "Robots" },
  { id: "32", value: "Romance" },
  { id: "58", value: "Satire" },
  { id: "52", value: "School Life" },
  { id: "16", value: "Sci-Fi" },
  { id: "50", value: "Slice of Life" },
  { id: "54", value: "Sport" },
  { id: "30", value: "Spy" },
  { id: "22", value: "Superhero" },
  { id: "24", value: "Supernatural" },
  { id: "29", value: "Suspense" },
  { id: "57", value: "Teen" },
  { id: "18", value: "Thriller" },
  { id: "34", value: "Vampires" },
  { id: "37", value: "Video Games" },
  { id: "26", value: "War" },
  { id: "45", value: "Western" },
  { id: "36", value: "Zombies" },
];

export const DEFAULT_SEARCH_GENRE_IDS = SEARCH_GENRE_OPTIONS.map((genre) => genre.id);

export type ListDiscoverSectionDefinition = {
  id: string;
  title: string;
  source: "list";
  path: string[];
};

export type DesktopTabDiscoverSectionDefinition = {
  id: string;
  title: string;
  source: "desktop-tab";
  tabId: "top-day" | "top-week" | "top-month";
};

export type DiscoverSectionDefinition =
  | ListDiscoverSectionDefinition
  | DesktopTabDiscoverSectionDefinition;

export const DISCOVER_SECTIONS: DiscoverSectionDefinition[] = [
  {
    id: "latest-update",
    title: "Latest Update",
    source: "list",
    path: ["ComicList", "LatestUpdate"],
  },
  {
    id: "new-comic",
    title: "New Comic",
    source: "list",
    path: ["ComicList", "Newest"],
  },
  {
    id: "top-day",
    title: "Top Day",
    source: "desktop-tab",
    tabId: "top-day",
  },
  {
    id: "top-week",
    title: "Top Week",
    source: "desktop-tab",
    tabId: "top-week",
  },
  {
    id: "top-month",
    title: "Top Month",
    source: "desktop-tab",
    tabId: "top-month",
  },
  {
    id: "most-popular",
    title: "Most Popular",
    source: "list",
    path: ["ComicList", "MostPopular"],
  },
  {
    id: "marvel-comics-alphabetical",
    title: "Marvel Comics: Alphabetical",
    source: "list",
    path: ["Publisher", "Marvel"],
  },
  {
    id: "marvel-comics-latest",
    title: "Marvel Comics: Latest",
    source: "list",
    path: ["Publisher", "Marvel", "LatestUpdate"],
  },
  {
    id: "marvel-comics-popular",
    title: "Marvel Comics: Popular",
    source: "list",
    path: ["Publisher", "Marvel", "MostPopular"],
  },
  {
    id: "marvel-comics-new",
    title: "Marvel Comics: New",
    source: "list",
    path: ["Publisher", "Marvel", "Newest"],
  },
  {
    id: "dc-comics-alphabetical",
    title: "DC Comics: Alphabetical",
    source: "list",
    path: ["Publisher", "DC-Comics"],
  },
  {
    id: "dc-comics-latest",
    title: "DC Comics: Latest",
    source: "list",
    path: ["Publisher", "DC-Comics", "LatestUpdate"],
  },
  {
    id: "dc-comics-popular",
    title: "DC Comics: Popular",
    source: "list",
    path: ["Publisher", "DC-Comics", "MostPopular"],
  },
  {
    id: "dc-comics-new",
    title: "DC Comics: New",
    source: "list",
    path: ["Publisher", "DC-Comics", "Newest"],
  },
];

export const DEFAULT_DISCOVER_SECTION_IDS = DISCOVER_SECTIONS.map((section) => section.id);
