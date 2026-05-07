/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { filter } from "../main";
import type { SearchMetadata, TagMap } from "../models";

export function getDefaultMetadata(genresFilter: string = ""): SearchMetadata {
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
    type: getShowOnlyObject,
  };
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
  console.log("....");

  console.log(value);
  const match = value.match(/^(\d+)\s*(s|m|h|d|w|mo|mos|y)s?(\s+ago)?$/i);
  if (!match) {
    return now;
  }
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  console.log(unit);
  console.log("....");
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
  console.log(now);
  return now;
}
