/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { DISCOVER_SECTIONS, SPOTLIGHT_GENRES, type HomeSectionDefinition } from "./models";

const getSpotlightGenre = (date: Date): string => {
  const day = Math.floor(date.getTime() / 86_400_000);
  return SPOTLIGHT_GENRES[day % SPOTLIGHT_GENRES.length] ?? SPOTLIGHT_GENRES[0]!;
};

export const buildHomeSections = (date = new Date()): HomeSectionDefinition[] => {
  const spotlightGenre = getSpotlightGenre(date);
  return DISCOVER_SECTIONS.map((section) => ({
    ...section,
    title: section.id === "genre-spotlight" ? `Spotlight: ${spotlightGenre}` : section.title,
  }));
};
