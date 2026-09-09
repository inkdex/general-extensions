/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { AtsuComicType, AtsuContentRating, AtsuMedium } from "../shared/models";
import type { AtsuContentType } from "../shared/models";

export const CONTENT_TYPE_OPTIONS: Array<{ id: AtsuContentType; title: string }> = [
  { id: AtsuComicType.Manga, title: "Manga" },
  { id: AtsuComicType.Manhwa, title: "Manhwa" },
  { id: AtsuComicType.Manhua, title: "Manhua" },
  { id: AtsuComicType.OEL, title: "OEL" },
  { id: AtsuMedium.Novel, title: "Novel" },
];

export const DEFAULT_CONTENT_TYPES: AtsuContentType[] = [
  AtsuComicType.Manga,
  AtsuComicType.Manhwa,
  AtsuComicType.Manhua,
  AtsuComicType.OEL,
  AtsuMedium.Novel,
];

export const CONTENT_RATING_OPTIONS = [
  { id: AtsuContentRating.Safe, title: "Safe" },
  { id: AtsuContentRating.Suggestive, title: "Suggestive" },
  { id: AtsuContentRating.Erotica, title: "Erotica" },
  { id: AtsuContentRating.Pornographic, title: "Pornographic" },
];

export const DEFAULT_CONTENT_RATINGS = [
  AtsuContentRating.Safe,
  AtsuContentRating.Suggestive,
  AtsuContentRating.Erotica,
];
