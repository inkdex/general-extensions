/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export const DOMAIN = "https://punkrecordz.com";
export const API_DOMAIN = "https://api.punkrecordz.com";

export type CatalogueEntry = {
  mangaId: string;
  title: string;
  image: string;
};

export const PUNK_RECORDS_SECTIONS = {
  LATEST: "latest",
  CATALOGUE: "catalogue",
} as const;

export type PunkRecordsSectionId =
  (typeof PUNK_RECORDS_SECTIONS)[keyof typeof PUNK_RECORDS_SECTIONS];

export type DiscoverItemType = "featuredCarouselItem" | "simpleCarouselItem";

export const PUNK_RECORDS_STATE_KEYS = {
  ShowCatalogueOnHome: "punk_records_show_catalogue_on_home",
} as const;
