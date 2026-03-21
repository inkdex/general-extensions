import { type SearchQuery } from "@paperback/types";

export function getFilterTagsBySection(section: string, tags: SearchQuery["filters"]): string[] {
  const values = tags.find((x) => x.id === section)?.value;
  if (values === undefined) {
    return [];
  }
  return Object.entries(values)
    .filter((x) => x[1] == "included")
    .map((x) => parseTagId(x[0]));
}

export function formatTagId(tagId: string): string {
  return tagId.replaceAll(" ", "_");
}

export function parseTagId(tagId: string): string {
  return tagId.replace("_", " ");
}
