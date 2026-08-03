/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { AtsuContentRating, AtsuMangaType } from "../shared/models";

export const CONTENT_TYPE_OPTIONS = [
  { id: AtsuMangaType.Manga, title: "Manga" },
  { id: AtsuMangaType.Manhwa, title: "Manhwa" },
  { id: AtsuMangaType.Manhua, title: "Manhua" },
  { id: AtsuMangaType.OEL, title: "OEL" },
];

export const DEFAULT_CONTENT_TYPES = [
  AtsuMangaType.Manga,
  AtsuMangaType.Manhwa,
  AtsuMangaType.Manhua,
  AtsuMangaType.OEL,
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
