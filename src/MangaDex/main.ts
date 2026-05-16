/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  Form,
  type ChapterProviding,
  type DiscoverSectionProviding,
  type Extension,
  type ManagedCollectionProviding,
  type SearchResultsProviding,
  type SettingsFormProviding,
} from "@paperback/types";

// The iOS host invokes formDidCancel on dismissal even when forms do
// not require explicit submission, default it to a no op
if (!(Form.prototype as { formDidCancel?: () => void }).formDidCancel) {
  (Form.prototype as { formDidCancel: () => void }).formDidCancel = (): void => {};
}

import {
  getChapterDetails,
  getChapters,
  processTitlesForUpdates,
} from "./implementations/chapter-providing/main";
import {
  getDiscoverSectionItems,
  getDiscoverSections,
} from "./implementations/discover-section/main";
import {
  commitManagedCollectionChanges,
  getManagedLibraryCollections,
  getSourceMangaInManagedCollection,
} from "./implementations/managed-collection/main";
import { getMangaDetails } from "./implementations/manga/main";
import {
  getAdvancedSearchForm,
  getSearchResults,
  getSearchTags,
  getSortingOptions,
} from "./implementations/search-results/main";
import { getSettingsForm } from "./implementations/settings-form/main";
import { MangaDexInterceptor } from "./services/network";

export class MangaDexExtension
  implements
    Extension,
    ChapterProviding,
    DiscoverSectionProviding,
    ManagedCollectionProviding,
    SearchResultsProviding,
    SettingsFormProviding
{
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });
  mainRequestInterceptor = new MangaDexInterceptor("main");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.mainRequestInterceptor.registerInterceptor();
  }

  getMangaDetails = getMangaDetails;
  getManagedLibraryCollections = getManagedLibraryCollections;
  commitManagedCollectionChanges = commitManagedCollectionChanges;
  getSourceMangaInManagedCollection = getSourceMangaInManagedCollection;
  getSettingsForm = getSettingsForm;
  getSearchTags = getSearchTags;
  getAdvancedSearchForm = getAdvancedSearchForm;
  getSearchResults = getSearchResults;
  getSortingOptions = getSortingOptions;
  getDiscoverSections = getDiscoverSections;
  getDiscoverSectionItems = getDiscoverSectionItems;
  getChapters = getChapters;
  getChapterDetails = getChapterDetails;
  processTitlesForUpdates = processTitlesForUpdates;
}

export const MangaDex = new MangaDexExtension();
