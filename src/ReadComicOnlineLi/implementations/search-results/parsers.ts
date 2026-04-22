import type { SearchFilter, SearchResultItem } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { CheerioAPI } from "cheerio";
import { DOMAIN, type FilterEntry, type SearchGenreOption } from "../shared/models";

export function parseSearchResults($: CheerioAPI): SearchResultItem[] {
  const results: SearchResultItem[] = [];

  $("div.item-list div.section.group.list").each((_, el) => {
    const cover = $("div.col.cover", el);
    const info = $("div.col.info", el);

    const href = $("a", cover).attr("href") ?? "";
    const img = $("img", cover);
    const title = img.attr("title")?.trim() || $("a", info).first().text().trim();
    const imageUrl = img.attr("src") ?? "";
    const subtitle = info.find("p").eq(1).text().trim();

    const mangaId = href.replace(/^\/Comic\//, "").replace(/\/$/, "");

    if (!mangaId || !title) return;

    const fullImageUrl = imageUrl.startsWith("/") ? DOMAIN + imageUrl : imageUrl;

    results.push({
      mangaId,
      title: Application.decodeHTMLEntities(title),
      imageUrl: fullImageUrl,
      subtitle: Application.decodeHTMLEntities(subtitle),
      contentRating: ContentRating.EVERYONE,
    });
  });

  return results;
}

export function parseHasNextPage($: CheerioAPI): boolean {
  return $("a.next_bt").length > 0;
}

export function readDropdownFilter(
  filters: FilterEntry[],
  filterId: string,
  fallback: string,
): string {
  const entry = filters.find((filter) => filter.id === filterId);
  if (!entry) return fallback;

  const value = entry.value;
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function readMultiselectFilter(filters: FilterEntry[], filterId: string): string[] {
  return readMultiselectFilterByState(filters, filterId, "included");
}

export function readExcludedMultiselectFilter(filters: FilterEntry[], filterId: string): string[] {
  return readMultiselectFilterByState(filters, filterId, "excluded");
}

function readMultiselectFilterByState(
  filters: FilterEntry[],
  filterId: string,
  selectedState: "included" | "excluded",
): string[] {
  const entry = filters.find((filter) => filter.id === filterId);
  if (!entry) return [];

  const value = entry.value;
  if (typeof value !== "object" || value === null) return [];

  return Object.entries(value)
    .filter(([, state]) => state === selectedState)
    .map(([id]) => id);
}

export function buildSearchFilters(
  $: CheerioAPI,
  genreOptions: SearchGenreOption[],
): SearchFilter[] {
  const filters: SearchFilter[] = [];
  const yearOptions = $("select#pubDate option")
    .map((_, element) => ({
      id: $(element).attr("value")?.trim() ?? "",
      value: $(element).text().trim(),
    }))
    .get();

  if (genreOptions.length > 0) {
    filters.push({
      type: "multiselect",
      id: "genres",
      title: "Genres",
      options: genreOptions,
      value: {},
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: undefined,
    });
  }

  filters.push({
    type: "dropdown",
    id: "publicationYear",
    title: "Year",
    options: yearOptions,
    value: "",
  });

  return filters;
}
