import {
    BasicRateLimiter,
    Chapter,
    ChapterDetails,
    ChapterProviding,
    CloudflareError,
    ContentRating,
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionProviding,
    DiscoverSectionType,
    Extension,
    MangaProviding,
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SearchResultsProviding,
    SourceManga,
    TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import * as htmlparser2 from "htmlparser2";
import { URLBuilder } from "../utils/url-builder/base";
import { Interceptor } from "./interceptors";
import {
    ChapterApiResponse,
    ChapterDetailsApiResponse,
    HomePageApiResponse,
    InfiniteApiResponse,
    MangaApiResponse,
    metadata,
    SearchApiResponse,
} from "./model";

const baseUrl = "https://atsu.moe/";

type AtsumaruImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    DiscoverSectionProviding;

export class AtsumaruExtension implements AtsumaruImplementation {
    requestManager = new Interceptor("main");
    globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 10,
        bufferInterval: 1,
        ignoreImages: true,
    });

    async initialise(): Promise<void> {
        this.requestManager.registerInterceptor();
        this.globalRateLimiter.registerInterceptor();
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "popular_updates_section",
                title: "Popular Updates",
                type: DiscoverSectionType.featured,
            },
            {
                id: "trending_section",
                title: "Trending",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "recently_updated_section",
                title: "Recently Updated",
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        switch (section.id) {
            case "popular_updates_section":
                return this.getPopularSectionItems(section, metadata);
            case "trending_section":
                return this.getTrendingSectionItems(section, metadata);
            case "recently_updated_section":
                return this.getRecentlyUpdatedSectionItems(section, metadata);
            default:
                return { items: [] };
        }
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const filters: SearchFilter[] = [];

        return filters;
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: metadata | undefined,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;
        const collectedIds = metadata?.searchCollectedIds ?? [];

        if (!query.title) {
            // Show recently updated instead
            const apiPage = page - 1; // API starts from 0
            const apiUrl = new URLBuilder(baseUrl)
                .addPath("api")
                .addPath("infinite")
                .addPath("recentlyUpdated")
                .addQuery("page", apiPage.toString())
                .build();
            const request = { url: apiUrl, method: "GET" };
            const data = await this.fetchJson<InfiniteApiResponse>(request);
            const items: SearchResultItem[] = [];

            for (const item of data.items || []) {
                const mangaId = item.id;
                if (collectedIds.includes(mangaId)) continue;
                collectedIds.push(mangaId);
                const imageUrl = item.image.startsWith("http")
                    ? item.image
                    : `${baseUrl}${item.image.slice(1)}`;
                items.push({
                    mangaId,
                    imageUrl,
                    title: item.title,
                    subtitle: undefined,
                    metadata: undefined,
                });
            }

            return {
                items,
                metadata:
                    items.length > 0
                        ? { page: page + 1, searchCollectedIds: collectedIds }
                        : undefined,
            };
        }

        // Use new search API
        const searchUrl = new URLBuilder(baseUrl)
            .addPath("api")
            .addPath("search")
            .addPath("page")
            .addQuery("query", query.title.replace(/\s+/g, "+"));

        const url = searchUrl.build();
        const request = { url, method: "GET" };
        const data = await this.fetchJson<SearchApiResponse>(request);

        const items: SearchResultItem[] = [];
        for (const hit of data.hits || []) {
            const mangaId = hit.id;
            if (collectedIds.includes(mangaId)) continue;
            collectedIds.push(mangaId);
            const imageUrl = hit.image.startsWith("http")
                ? hit.image
                : `${baseUrl}${hit.image}`;
            items.push({
                mangaId,
                imageUrl,
                title: hit.title,
                subtitle: undefined,
                metadata: undefined,
            });
        }

        return {
            items,
            metadata:
                items.length > 0
                    ? { page: page + 1, searchCollectedIds: collectedIds }
                    : undefined,
        };
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const apiUrl = new URLBuilder(baseUrl)
            .addPath("api")
            .addPath("manga")
            .addPath("page")
            .addQuery("id", mangaId)
            .build();
        const request = { url: apiUrl, method: "GET" };
        const data = await this.fetchJson<MangaApiResponse>(request);
        const mangaPage = data.mangaPage;

        const title = mangaPage.englishTitle || mangaPage.title;
        const altTitles = mangaPage.otherNames || [];
        const image = mangaPage.poster?.image;
        const imageUrl =
            image && !image.startsWith("http")
                ? `${baseUrl}${image.slice(1)}`
                : image;
        const description = mangaPage.synopsis || "";
        const authors: string[] =
            mangaPage.authors?.map((author) => author.name) || [];

        let status = "UNKNOWN";
        const statusText = mangaPage.status;
        if (statusText?.toLowerCase().includes("ongoing")) {
            status = "ONGOING";
        } else if (statusText?.toLowerCase().includes("completed")) {
            status = "COMPLETED";
        }

        const tags: TagSection[] = [];
        const genres: string[] = mangaPage.tags?.map((tag) => tag.name) || [];

        if (genres.length > 0) {
            tags.push({
                id: "genres",
                title: "Genres",
                tags: genres.map((genre: string) => ({
                    id: genre
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    title: genre,
                })),
            });
        }

        // Add authors as a separate tag section if available
        if (authors.length > 0) {
            tags.push({
                id: "authors",
                title: "Authors",
                tags: authors.map((author: string) => ({
                    id: author
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    title: author,
                })),
            });
        }

        return {
            mangaId: mangaId,
            mangaInfo: {
                primaryTitle: title,
                secondaryTitles: altTitles,
                thumbnailUrl: imageUrl,
                synopsis: description,
                rating: 1, // API doesn't provide rating
                contentRating: ContentRating.EVERYONE,
                status: status as "ONGOING" | "COMPLETED" | "UNKNOWN",
                tagGroups: tags,
            },
        };
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const mangaId = sourceManga.mangaId;
        const chapters: Chapter[] = [];
        let currentPage = 0;
        let totalPages = 1;

        do {
            const request: Request = {
                url: `${baseUrl}api/manga/chapters?id=${mangaId}&filter=all&sort=desc&page=${currentPage}`,
                method: "GET",
            };

            try {
                const response =
                    await this.fetchJson<ChapterApiResponse>(request);

                if (!response?.chapters?.length) {
                    console.warn(
                        `[chapters] No chapters found on page ${currentPage} for ${mangaId}`,
                    );
                    break;
                }

                for (const ch of response.chapters) {
                    const stripped = ch.title
                        ?.replace(/^Chapter\s*/i, "")
                        .trim();
                    const isNumeric = /^\d+$/.test(stripped ?? "");

                    chapters.push({
                        chapterId: ch.id,
                        sourceManga,
                        title: isNumeric ? undefined : stripped, // let Paperback generate title if number only
                        volume: 0,
                        chapNum: ch.number ?? 0,
                        publishDate: new Date(ch.createdAt),
                        langCode: "🇬🇧",
                    });
                }

                totalPages = response.pages ?? 1;
                currentPage++;
            } catch (err: unknown) {
                console.error(
                    `[chapters] fetchJson error on page ${currentPage}:`,
                    err,
                );
                break;
            }
        } while (currentPage < totalPages);

        chapters.sort((a, b) => (b.chapNum ?? 0) - (a.chapNum ?? 0));

        console.log(
            `[chapters] Loaded ${chapters.length} chapters for ${mangaId} (${totalPages} pages)`,
        );

        return chapters;
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const apiUrl = new URLBuilder(baseUrl)
            .addPath("api")
            .addPath("read")
            .addPath("chapter")
            .addQuery("mangaId", chapter.sourceManga.mangaId)
            .addQuery("chapterId", chapter.chapterId)
            .build();

        const request = { url: apiUrl, method: "GET" };
        const data = await this.fetchJson<ChapterDetailsApiResponse>(request);

        const pages: string[] = data.readChapter.pages.map((page) => {
            const imageUrl = page.image.startsWith("http")
                ? page.image
                : `${baseUrl}${page.image}`;
            return imageUrl;
        });

        return {
            id: chapter.chapterId,
            mangaId: chapter.sourceManga.mangaId,
            pages,
        };
    }

    getMangaShareUrl(mangaId: string): string {
        return `${baseUrl}/title/${mangaId}`;
    }

    async getTrendingSectionItems(
        section: DiscoverSection,
        metadata: { page?: number; collectedIds?: string[] } | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 0;
        const collectedIds: string[] = metadata?.collectedIds ?? [];
        const apiUrl = new URLBuilder(baseUrl)
            .addPath("api")
            .addPath("infinite")
            .addPath("trending")
            .addQuery("page", page.toString())
            .build();
        const request = { url: apiUrl, method: "GET" };
        const data = await this.fetchJson<InfiniteApiResponse>(request);
        const items: DiscoverSectionItem[] = [];

        for (const item of data.items || []) {
            const mangaId = item.id;
            if (collectedIds.includes(mangaId)) continue;
            collectedIds.push(mangaId);
            const imageUrl = item.image.startsWith("http")
                ? item.image
                : `${baseUrl}${item.image.slice(1)}`;
            items.push({
                type: "prominentCarouselItem",
                mangaId,
                imageUrl,
                title: item.title,
                subtitle: undefined,
                metadata: undefined,
            });
        }

        return {
            items,
            metadata:
                items.length > 0 ? { page: page + 1, collectedIds } : undefined,
        };
    }

    async getPopularSectionItems(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        section: DiscoverSection,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        metadata: metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const apiUrl = new URLBuilder(baseUrl)
            .addPath("api")
            .addPath("home")
            .addPath("page")
            .build();
        const request = { url: apiUrl, method: "GET" };
        const data = await this.fetchJson<HomePageApiResponse>(request);
        const homePage = data.homePage;
        const trendingSection = homePage.sections.find(
            (s) => s.type === "slideshow" && s.key === "trending",
        );
        const items: DiscoverSectionItem[] = [];

        if (trendingSection) {
            for (const item of trendingSection.items || []) {
                const mangaId = item.id;
                const imageUrl = item.banner.startsWith("http")
                    ? item.banner
                    : `${baseUrl}${item.banner.slice(1)}`;
                items.push({
                    type: "featuredCarouselItem",
                    mangaId,
                    imageUrl,
                    title: item.title,
                    supertitle: undefined,
                    metadata: undefined,
                });
            }
        }

        return {
            items,
        };
    }

    async getRecentlyUpdatedSectionItems(
        section: DiscoverSection,
        metadata: metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 0;
        const collectedIds: string[] = metadata?.collectedIds ?? [];
        const apiUrl = new URLBuilder(baseUrl)
            .addPath("api")
            .addPath("infinite")
            .addPath("recentlyUpdated")
            .addQuery("page", page.toString())
            .build();
        const request = { url: apiUrl, method: "GET" };
        const data = await this.fetchJson<InfiniteApiResponse>(request);
        const items: DiscoverSectionItem[] = [];

        for (const item of data.items || []) {
            const mangaId = item.id;
            if (collectedIds.includes(mangaId)) continue;
            collectedIds.push(mangaId);
            const imageUrl = item.image.startsWith("http")
                ? item.image
                : `${baseUrl}${item.image.slice(1)}`;
            items.push({
                type: "simpleCarouselItem",
                mangaId,
                imageUrl,
                title: item.title,
                subtitle: undefined,
                metadata: undefined,
            });
        }

        return {
            items,
            metadata:
                items.length > 0 ? { page: page + 1, collectedIds } : undefined,
        };
    }

    checkCloudflareStatus(status: number): void {
        if (status == 503 || status == 403) {
            throw new CloudflareError({ url: baseUrl, method: "GET" });
        }
    }

    async fetchCheerio(request: Request): Promise<CheerioAPI> {
        const [response, data] = await Application.scheduleRequest(request);
        this.checkCloudflareStatus(response.status);
        const htmlStr = Application.arrayBufferToUTF8String(data);
        const dom = htmlparser2.parseDocument(htmlStr);
        return cheerio.load(dom);
    }

    async fetchJson<T = unknown>(request: Request): Promise<T> {
        const [response, data] = await Application.scheduleRequest(request);
        this.checkCloudflareStatus(response.status);
        const jsonStr = Application.arrayBufferToUTF8String(data);
        return JSON.parse(jsonStr) as T;
    }
}

export const Atsumaru = new AtsumaruExtension();
