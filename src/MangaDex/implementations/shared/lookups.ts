/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { MDContentRating, Status } from "./models";

export interface Rating {
  // MangaDex API value
  enum: MDContentRating;
  // Paperback SDK ContentRating bucket
  paperback: ContentRating;
  // Settings dropdown label, e.g. "Safe (EVERYONE)"
  name: string;
  // Short label used by the search tag filter, e.g. "Safe"
  shortName: string;
  // Subtitle emoji
  icon: string;
  default?: true;
}

// Single source of truth for the four MangaDex content ratings. Other modules
// derive contentRatingMap, ratingIconMap, paperbackToMangaDexRatings, and
// SYNTHETIC_RATING_TAGS from this list
export const RATINGS: readonly Rating[] = [
  {
    enum: MDContentRating.Safe,
    paperback: ContentRating.EVERYONE,
    name: "Safe (EVERYONE)",
    shortName: "Safe",
    icon: "🟢",
    default: true,
  },
  {
    enum: MDContentRating.Suggestive,
    paperback: ContentRating.MATURE,
    name: "Suggestive (TEEN)",
    shortName: "Suggestive",
    icon: "🟡",
  },
  {
    enum: MDContentRating.Erotica,
    paperback: ContentRating.ADULT,
    name: "Erotica (ADULT)",
    shortName: "Erotica",
    icon: "🟠",
  },
  {
    enum: MDContentRating.Pornographic,
    paperback: ContentRating.ADULT,
    name: "Mature (ADULT)",
    shortName: "Mature",
    icon: "🔞",
  },
];

export function getRatingEnumList(): string[] {
  return RATINGS.map((r) => r.enum);
}

export function getRatingName(ratingEnum: string): string {
  return RATINGS.find((r) => r.enum === ratingEnum)?.name ?? "";
}

export function getDefaultRatings(): string[] {
  return RATINGS.filter((r) => r.default).map((r) => r.enum);
}

export interface StatusEntry {
  enum: Status;
  name: string;
  icon: string;
  // false for client-side synthetic statuses (e.g. PublishingFinished) that
  // the MangaDex /manga search filter does not accept.
  searchable: boolean;
}

// Single source of truth for publication statuses. Includes PublishingFinished
// even though it is synthetic, so the local update filter can offer it.
export const STATUSES: readonly StatusEntry[] = [
  { enum: Status.Ongoing, name: "Ongoing", icon: "▶️", searchable: true },
  { enum: Status.Completed, name: "Completed", icon: "✅", searchable: true },
  { enum: Status.PublishingFinished, name: "Publishing Finished", icon: "📕", searchable: false },
  { enum: Status.Hiatus, name: "Hiatus", icon: "⏸️", searchable: true },
  { enum: Status.Cancelled, name: "Cancelled", icon: "❌", searchable: true },
];

export interface ImageQuality {
  name: string;
  enum: string;
  ending: string;
  default?: string[];
}

// Multiple source PNGs at once from MangaDex can OOM the
// iOS image pipeline. Default discover/search to .512.jpg.
export const IMAGE_QUALITIES: readonly ImageQuality[] = [
  {
    name: "Source (Original/Best)",
    enum: "source",
    ending: "",
    default: ["manga"],
  },
  { name: "<= 512px", enum: "512", ending: ".512.jpg", default: ["discover", "search"] },
  { name: "<= 256px", enum: "256", ending: ".256.jpg" },
];

export function getImageQualityEnumList(): string[] {
  return IMAGE_QUALITIES.map((q) => q.enum);
}

export function getImageQualityName(imageQualityEnum: string): string {
  return IMAGE_QUALITIES.find((q) => q.enum === imageQualityEnum)?.name ?? "";
}

export function getImageQualityEnding(imageQualityEnum: string): string {
  return IMAGE_QUALITIES.find((q) => q.enum === imageQualityEnum)?.ending ?? "";
}

export function getDefaultImageQuality(section: string): string {
  return IMAGE_QUALITIES.find((q) => q.default?.includes(section))?.enum ?? "";
}

export const ROMANIZED_CODES = ["ja-ro", "ko-ro", "zh-ro"] as const;

export interface Demographic {
  name: string;
  enum: string;
}

export const DEMOGRAPHICS: readonly Demographic[] = [
  { name: "None", enum: "none" },
  { name: "Shounen", enum: "shounen" },
  { name: "Shoujo", enum: "shoujo" },
  { name: "Seinen", enum: "seinen" },
  { name: "Josei", enum: "josei" },
];

export interface PublicationStatus {
  name: string;
  enum: string;
}

// Statuses accepted by the MangaDex search API. Derived from STATUSES.
export const PUBLICATION_STATUSES: readonly PublicationStatus[] = STATUSES.filter(
  (s) => s.searchable,
).map((s) => ({ name: s.name, enum: s.enum }));

export interface OriginalLanguageOption {
  name: string;
  enum: string;
  // zh-hk is a MangaDex dialect that originalLanguage[]=zh misses.
  extraCodes?: readonly string[];
}

export const ORIGINAL_LANGUAGES: readonly OriginalLanguageOption[] = [
  { name: "Japanese (Manga)", enum: "ja" },
  { name: "Korean (Manhwa)", enum: "ko" },
  { name: "Chinese (Manhua)", enum: "zh", extraCodes: ["zh-hk"] },
];
