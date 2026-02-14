import { ContentRating } from "@paperback/types";
import { WEEBDEX_COVER_DOMAIN } from "../../main";
import type { WeebDexCover, WeebDexManga } from "./models";

export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      );
    });
  });
}

export function capitalize(value: string | undefined): string {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildCoverUrl(mangaId: string, cover?: WeebDexCover): string {
  if (!cover?.id || !cover?.ext) return "";
  const ext = cover.ext.startsWith(".") ? cover.ext.slice(1) : cover.ext;
  return `${WEEBDEX_COVER_DOMAIN}/covers/${mangaId}/${cover.id}.${ext}`;
}

export function mapContentRating(rating: string): ContentRating {
  switch (rating) {
    case "suggestive":
      return ContentRating.MATURE;
    case "erotica":
    case "pornographic":
      return ContentRating.ADULT;
    default:
      return ContentRating.EVERYONE;
  }
}

export function buildMangaSubtitle(item: WeebDexManga, setting: string): string {
  switch (setting) {
    case "year":
      return item.year?.toString() ?? "";
    case "content_rating":
      return capitalize(item.content_rating);
    default:
      return capitalize(item.status);
  }
}
