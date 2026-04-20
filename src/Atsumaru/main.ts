/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Cookie, Extension, MangaProviding } from "@paperback/types";
import { BasicRateLimiter, CookieStorageInterceptor } from "@paperback/types";
import { ChapterProvider } from "./implementations/chapter-providing/main";
import { DiscoverProvider } from "./implementations/discover-section/main";
import { MangaProvider } from "./implementations/manga/main";
import { SearchProvider } from "./implementations/search-results/main";
import { SettingsFormProvider } from "./implementations/settings-form/main";
import { applyMixins } from "./implementations/shared/utils";
import { AtsuInterceptor } from "./services/network";

export const DOMAIN = "https://atsu.moe";

export interface AtsumaruImplementation
  extends SearchProvider, MangaProvider, ChapterProvider, DiscoverProvider, SettingsFormProvider {}

export class AtsumaruExtension implements Omit<Extension, keyof MangaProviding> {
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });
  atsuInterceptor = new AtsuInterceptor("atsumaru-interceptor");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.atsuInterceptor.registerInterceptor();
  }

  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (
        cookie.name.startsWith("cf") ||
        cookie.name.startsWith("_cf") ||
        cookie.name.startsWith("__cf")
      ) {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  async bypassCloudflareRequest(request: Request): Promise<Request> {
    return request;
  }
}

applyMixins(AtsumaruExtension, [
  SearchProvider,
  MangaProvider,
  ChapterProvider,
  DiscoverProvider,
  SettingsFormProvider,
]);

export const Atsumaru = new AtsumaruExtension();
