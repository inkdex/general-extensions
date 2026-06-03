/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { BasicRateLimiter, type ExtensionImpl } from "@paperback/types";

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
import { runStateMigrations } from "./implementations/shared/state";
import type MangaDexConfig from "./pbconfig";
import { MangaDexInterceptor } from "./services/network";

export class MangaDexExtension implements ExtensionImpl<typeof MangaDexConfig> {
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });
  mainRequestInterceptor = new MangaDexInterceptor("main");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.mainRequestInterceptor.registerInterceptor();
    runStateMigrations();
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
