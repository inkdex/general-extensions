/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export interface Rating {
  name: string;
  enum: string;
  default?: true;
}

export const RATINGS: readonly Rating[] = [
  { name: "Safe (EVERYONE)", enum: "safe", default: true },
  { name: "Suggestive (MATURE)", enum: "suggestive" },
  { name: "Erotica (ADULT)", enum: "erotica" },
  { name: "Pornographic (ADULT)", enum: "pornographic" },
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
