/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type {
  Chapter,
  ChapterDetails,
  DiscoverSection,
  DiscoverSectionItem,
  SearchResultItem,
  SourceManga,
} from "@paperback/types";

export type CatalogueEntry = {
  mangaId: string;
  title: string;
  image: string;
};

export const PUNK_RECORDS_SECTIONS = {
  latest: "latest",
  catalogue: "catalogue",
} as const;

export type PunkRecordsSectionId =
  (typeof PUNK_RECORDS_SECTIONS)[keyof typeof PUNK_RECORDS_SECTIONS];

export type DiscoverItemType = "featuredCarouselItem" | "simpleCarouselItem";

export type PunkRecordsMangaDetails = Pick<SourceManga, "mangaId" | "mangaInfo">;
export type PunkRecordsChapter = Chapter;
export type PunkRecordsChapterDetails = ChapterDetails;
export type PunkRecordsSearchResult = SearchResultItem;
export type PunkRecordsDiscoverItem = DiscoverSectionItem;
export type PunkRecordsDiscoverSection = DiscoverSection;

export const PUNK_RECORDS_STATE_KEYS = {
  showCatalogueOnHome: "punk_records_show_catalogue_on_home",
} as const;

export function getShowCatalogueOnHome(): boolean {
  const value = Application.getState(PUNK_RECORDS_STATE_KEYS.showCatalogueOnHome);
  return typeof value === "boolean" ? value : true;
}
