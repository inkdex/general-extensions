import type { Cookie, Extension, MangaProviding } from "@paperback/types";
import { BasicRateLimiter, CookieStorageInterceptor } from "@paperback/types";
import { ChapterProvider } from "./implementations/chapter-providing/main";
import { DiscoverProvider } from "./implementations/discover-section-providing/main";
import { MangaProvider } from "./implementations/manga-details-providing/main";
import { SearchProvider } from "./implementations/search-result-providing/main";
import { SettingsFormProvider } from "./implementations/settings-form-providing/forms/main";
import { applyMixins } from "./implementations/shared/utils";
import { ReadComicOnlineInterceptor } from "./services/network";

export interface ReadComicOnlineImplementation
  extends SearchProvider, MangaProvider, ChapterProvider, DiscoverProvider, SettingsFormProvider {}

export class ReadComicOnlineExtension implements Omit<Extension, keyof MangaProviding> {
  cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });
  globalRateLimiter = new BasicRateLimiter("rateLimiter", {
    numberOfRequests: 10,
    bufferInterval: 1,
    ignoreImages: true,
  });
  readComicOnlineInterceptor = new ReadComicOnlineInterceptor("readcomiconline-interceptor");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.cookieStorageInterceptor.registerInterceptor();
    this.readComicOnlineInterceptor.registerInterceptor();
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

applyMixins(ReadComicOnlineExtension, [
  SearchProvider,
  MangaProvider,
  ChapterProvider,
  DiscoverProvider,
  SettingsFormProvider,
]);

export const ReadComicOnline = new ReadComicOnlineExtension();
