import {
  BasicRateLimiter,
  CookieStorageInterceptor,
  type Cookie,
  type Extension,
  type MangaProviding,
} from "@paperback/types";
import { ChapterProvider } from "./implementations/chapter-providing/main";
import { DiscoverProvider } from "./implementations/discover-section/main";
import { MangaProvider } from "./implementations/manga/main";
import { SearchProvider } from "./implementations/search-results/main";
import { SettingsFormProvider } from "./implementations/settings-form/forms/main";
import { applyMixins } from "./implementations/shared/utils";
import { WeebInterceptor } from "./services/network";

export const WEEBDEX_DOMAIN = "https://weebdex.org";
export const WEEBDEX_API_DOMAIN = "https://api.weebdex.org";
export const WEEBDEX_COVER_DOMAIN = "https://srv.weebdex.net";

export interface WeebDexImplementation
  extends SearchProvider, MangaProvider, ChapterProvider, DiscoverProvider, SettingsFormProvider {}

export class WeebDexExtension implements Omit<Extension, keyof MangaProviding> {
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 5,
    bufferInterval: 1,
    ignoreImages: true,
  });
  weebInterceptor = new WeebInterceptor("weebdex-interceptor");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.weebInterceptor.registerInterceptor();
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

applyMixins(WeebDexExtension, [
  SearchProvider,
  MangaProvider,
  ChapterProvider,
  DiscoverProvider,
  SettingsFormProvider,
]);

export const WeebDex = new WeebDexExtension();
