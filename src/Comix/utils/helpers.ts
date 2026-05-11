/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import {
  type Filters,
  type MangaItem,
  NO_IMAGE,
  type SearchMetadata,
  type TagMap,
} from "../models";
import { ComixFilter } from "./filter";

export function getDefaultMetadata(filter: ComixFilter, genresFilter: string = ""): SearchMetadata {
  const genresHidden = filter.getHiddenGenresSettings();
  const getExcludedGenreObject = Object.fromEntries(
    filter.genres
      .filter((option) => genresHidden.includes(option.id))
      .map((item) => [item.id, "excluded" as const]),
  ) as TagMap;
  if (genresFilter.length > 0) {
    getExcludedGenreObject[genresFilter] = "included";
  }
  const demographicHidden = filter.getHiddenDemogSettings();
  const getExcludedDemographicObject = Object.fromEntries(
    filter.demographic
      .filter((option) => demographicHidden.includes(option.id))
      .map((item) => [item.id, "excluded" as const]),
  ) as TagMap;
  const themesHidden = filter.getHiddenThemesSettings();
  const getExcludedThemesObject = Object.fromEntries(
    filter.genres
      .filter((option) => themesHidden.includes(option.id))
      .map((item) => [item.id, "excluded" as const]),
  ) as TagMap;
  const showOnly = filter.getShowOnlySettings();
  const getShowOnlyObject = Object.fromEntries(
    filter.contentType
      .filter((option) => showOnly.includes(option.id))
      .map((item) => [item.id, "included" as const]),
  ) as TagMap;
  return {
    genres: getExcludedGenreObject,
    themes: getExcludedThemesObject,
    demographic: getExcludedDemographicObject,
    types: getShowOnlyObject,
  };
}

export function mapTags(filter: string | TagMap): string[] {
  if (!filter || typeof filter !== "object") return [];
  return Object.entries(filter).flatMap(([key, value]) => {
    if (value === "included") return [key];
    return [];
  });
}

export function mapTagsExcluded(filter: string | TagMap): string[] {
  if (!filter || typeof filter !== "object") return [];
  return Object.entries(filter).flatMap(([key, value]) => {
    if (value === "excluded") return [key];
    return [];
  });
}

export function buildFilter(
  excluded: boolean,
  type: Filters["type"],
  ...sources: (string | TagMap)[]
): Filters[] {
  const values = excluded ? sources.flatMap(mapTagsExcluded) : sources.flatMap(mapTags);
  return values.length ? [{ type, filters: values }] : [];
}

export function getRanking(content: string) {
  switch (content) {
    case "safe": {
      return ContentRating.EVERYONE;
    }
    case "suggestive": {
      return ContentRating.MATURE;
    }
    case "pornographic": {
      return ContentRating.ADULT;
    }
    default: {
      return ContentRating.EVERYONE;
    }
  }
}

export function parseRelativeDate(value: string): Date {
  const now = new Date();
  const match = value.match(/^(\d+)\s*(s|m|h|d|w|mo|mos|y)s?(\s+ago)?$/i);
  if (!match) {
    return now;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "s":
      now.setSeconds(now.getSeconds() - amount);
      break;
    case "m":
      now.setMinutes(now.getMinutes() - amount);
      break;
    case "h":
      now.setHours(now.getHours() - amount);
      break;
    case "d":
      now.setDate(now.getDate() - amount);
      break;
    case "w":
      now.setDate(now.getDate() - amount * 7);
      break;
    case "mo":
    case "mos":
      now.setMonth(now.getMonth() - amount);
      break;
    case "y":
      now.setFullYear(now.getFullYear() - amount);
      break;
  }
  return now;
}

export function getPoster(item: MangaItem): string {
  return item.poster?.large?.length
    ? item.poster.large
    : item.poster?.medium?.length
      ? item.poster.medium
      : NO_IMAGE;
}
