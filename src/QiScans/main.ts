import type {
    Chapter,
    ChapterDetails,
    ChapterProviding,
    CloudflareBypassRequestProviding,
    Cookie,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    Extension,
    MangaProviding,
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SortingOption,
    SourceManga,
} from "@paperback/types";
import { BasicRateLimiter, CookieStorageInterceptor } from "@paperback/types";
import { ChapterProvider } from "./implementations/chapter-providing/main";
import { DiscoverProvider } from "./implementations/discover-section/main";
import { MangaProvider } from "./implementations/manga/main";
import { SearchProvider } from "./implementations/search-results/main";
import type { Metadata } from "./implementations/shared/models";
import { QiScansInterceptor } from "./services/interceptor";

export const QISCANS_DOMAIN = "https://qiscans.org";
export const QISCANS_API = "https://api.qiscans.org/api/query";
export const QISCANS_API_BASE = "https://api.qiscans.org/api";

type QiScansImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    DiscoverSectionProviding &
    CloudflareBypassRequestProviding;

export class QiScansExtension implements QiScansImplementation {
    private searchProvider = new SearchProvider();
    private mangaProvider = new MangaProvider();
    private chapterProvider = new ChapterProvider(this.mangaProvider);
    private discoverProvider = new DiscoverProvider();
    private cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });
    private globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 6,
        bufferInterval: 1,
        ignoreImages: true,
    });
    private qiscansInterceptor = new QiScansInterceptor("qiscans-interceptor");

    async initialise(): Promise<void> {
        this.globalRateLimiter.registerInterceptor();
        this.cookieStorageInterceptor.registerInterceptor();
        this.qiscansInterceptor.registerInterceptor();
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

    async getSearchFilters(): Promise<SearchFilter[]> {
        return this.searchProvider.getSearchFilters();
    }

    async getSortingOptions(): Promise<SortingOption[]> {
        return this.searchProvider.getSortingOptions();
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
        sortingOption?: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.searchProvider.getSearchResults(
            query,
            metadata,
            sortingOption,
        );
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        return this.mangaProvider.getMangaDetails(mangaId);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return this.chapterProvider.getChapters(sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        return this.chapterProvider.getChapterDetails(chapter);
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return this.discoverProvider.getDiscoverSections();
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        return this.discoverProvider.getDiscoverSectionItems(section, metadata);
    }

    async bypassCloudflareRequest(request: Request): Promise<Request> {
        return request;
    }
}

export const QiScans = new QiScansExtension();
