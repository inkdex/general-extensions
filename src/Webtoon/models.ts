/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { JSONObject } from "@paperback/types";
import type { Cheerio } from "cheerio";
import type { Element } from "domhandler";

export const BASE_URL = "https://www.webtoons.com";
export const MOBILE_URL = "https://m.webtoons.com";

export const CANVAS_WANTED = "canvas_wanted";
export const LANGUAGES = "languages";

export type CheerioElement = Cheerio<Element>;

export interface WebtoonDto {
  result: WebtoonResultDto;
  success: boolean;
  message?: string;
}

export type WebtoonResultDto = WebtoonChaptersListDto;

export interface WebtoonChaptersListDto {
  episodeList: WebtoonChaptersElemDto[];
  nextCursor: number;
}

export interface WebtoonChaptersElemDto {
  episodeNo: number;
  thumbnail: string;
  episodeTitle: string;
  viewerLink: string;
  exposureDateMillis: number;
  displayUp: boolean;
  hasBgm: boolean;
}

export interface SearchMetadata extends JSONObject {
  languages: string[];
  genres: string[];
}

export type WebtoonsSearchingMetadata = {
  page: number;
  maxPages?: number | undefined;
};

export type WebtoonsItemMetadata = { link: string };

export type Tag = { id: string; title: string };

export enum Language {
  ENGLISH = "en",
  FRENCH = "fr",
  GERMAN = "de",
  SPANISH = "es",
  THAI = "th",
  INDONESIAN = "id",
  CHINESE = "zh-hant",
}

export const LanguagesOptions = [
  { id: Language.ENGLISH, title: "English" },
  { id: Language.FRENCH, title: "Français" },
  { id: Language.GERMAN, title: "Deutsch" },
  { id: Language.SPANISH, title: "Español" },
  { id: Language.THAI, title: "ภาษาไทย" },
  { id: Language.INDONESIAN, title: "Indonesia" },
  { id: Language.CHINESE, title: "中文 (繁體)" },
];

export const getLanguagesTitle = (language: Language) => {
  return LanguagesOptions.find((option) => option.id === language)?.title ?? language;
};

export const getDateDayFormat = () => {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format().toLowerCase();
};

export const haveTrending = (language: Language) => {
  switch (language) {
    case Language.GERMAN:
    case Language.SPANISH:
      return false;
    default:
      return true;
  }
};
