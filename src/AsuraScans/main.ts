import {
  BasicRateLimiter,
  DiscoverSectionType,
  Form,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  type Extension,
  type MangaProviding,
  type PagedResults,
  type Request,
  type SearchFilter,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SourceManga,
  type TagSection,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { URLBuilder } from "../utils/url-builder/array-query-variant";
import { AS_API_DOMAIN, AS_DOMAIN } from "./AsuraConfig";
import { getFilterTagsBySection } from "./AsuraHelper";
import { AsuraInterceptor } from "./AsuraInterceptor";
import {
  isLastPage,
  parseChapters,
  parseFeaturedSection,
  parseMangaDetails,
  parsePopularSection,
  parseSearch,
  parseTags,
  parseUpdateSection,
} from "./AsuraParser";
import { AsuraSettingForm } from "./AsuraSettings";
import { setFilters } from "./AsuraUtils";
import {
  type AsuraScansMetadata,
  type Filters,
  type Page,
} from "./interfaces/AsuraScansInterfaces";

export class AsuraScansExtension
  implements
    Extension,
    SearchResultsProviding,
    MangaProviding,
    ChapterProviding,
    SettingsFormProviding,
    DiscoverSectionProviding
{
  globalRateLimiter = new BasicRateLimiter("ratelimiter", {
    numberOfRequests: 10,
    bufferInterval: 0.5,
    ignoreImages: true,
  });

  requestManager = new AsuraInterceptor("main");

  async initialise(): Promise<void> {
    this.globalRateLimiter.registerInterceptor();
    this.requestManager.registerInterceptor();
    if (Application.isResourceLimited) return;
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "featured",
        title: "Featured",
        type: DiscoverSectionType.featured,
      },

      {
        id: "latest_updates",
        title: "Latest Updates",
        type: DiscoverSectionType.chapterUpdates,
      },

      {
        id: "popular_today",
        title: "Popular Today",
        type: DiscoverSectionType.simpleCarousel,
      },

      { id: "type", title: "Types", type: DiscoverSectionType.genres },

      { id: "genres", title: "Genres", type: DiscoverSectionType.genres },

      { id: "status", title: "Status", type: DiscoverSectionType.genres },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: AsuraScansMetadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let items: DiscoverSectionItem[] = [];
    let urlBuilder = new URLBuilder(AS_DOMAIN);
    const page: number = metadata?.page ?? 1;
    if (section.type === DiscoverSectionType.chapterUpdates) {
      urlBuilder = urlBuilder.addPath("series");
      urlBuilder = urlBuilder.addQuery("page", page.toString());
    }

    switch (section.type) {
      case DiscoverSectionType.featured: {
        const [_, buffer] = await Application.scheduleRequest({
          url: urlBuilder.build(),
          method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        items = await parseFeaturedSection($);
        break;
      }
      case DiscoverSectionType.simpleCarousel: {
        const [_, buffer] = await Application.scheduleRequest({
          url: urlBuilder.build(),
          method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        items = await parsePopularSection($);
        break;
      }
      case DiscoverSectionType.chapterUpdates: {
        const [_, buffer] = await Application.scheduleRequest({
          url: urlBuilder.build(),
          method: "GET",
        });
        const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
        items = await parseUpdateSection($);
        metadata = !isLastPage($) ? { page: page + 1 } : undefined;
        break;
      }
      case DiscoverSectionType.genres:
        if (section.id === "type") {
          items = [];
          const tags: TagSection[] = await this.getSearchTags();
          for (const tag of tags[2].tags) {
            items.push({
              type: "genresCarouselItem",
              searchQuery: {
                title: "",
                filters: [
                  {
                    id: tag.id,
                    value: { [tag.id]: "included" },
                  },
                ],
              },
              name: tag.title,
              metadata: metadata,
            });
          }
        }
        if (section.id === "genres") {
          items = [];
          const tags: TagSection[] = await this.getSearchTags();
          for (const tag of tags[0].tags) {
            items.push({
              type: "genresCarouselItem",
              searchQuery: {
                title: "",
                filters: [
                  {
                    id: tag.id,
                    value: { [tag.id]: "included" },
                  },
                ],
              },
              name: tag.title,
              metadata: metadata,
            });
          }
        }
        if (section.id === "status") {
          items = [];
          const tags: TagSection[] = await this.getSearchTags();
          for (const tag of tags[1].tags) {
            items.push({
              type: "genresCarouselItem",
              searchQuery: {
                title: "",
                filters: [
                  {
                    id: tag.id,
                    value: { [tag.id]: "included" },
                  },
                ],
              },
              name: tag.title,
              metadata: metadata,
            });
          }
        }
    }
    return { items, metadata };
  }

  async getSettingsForm(): Promise<Form> {
    return new AsuraSettingForm();
  }

  getMangaShareUrl(mangaId: string): string {
    return `${AS_DOMAIN}/series/${mangaId}`;
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const request = {
      url: new URLBuilder(AS_DOMAIN).addPath("series").addPath(mangaId).build(),
      method: "GET",
    };

    const [_, buffer] = await Application.scheduleRequest(request);

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return await parseMangaDetails($, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const request = {
      url: new URLBuilder(AS_DOMAIN).addPath("series").addPath(sourceManga.mangaId).build(),
      method: "GET",
    };
    const [_, buffer] = await Application.scheduleRequest(request);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
    return parseChapters($, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const url = new URLBuilder(AS_DOMAIN)
      .addPath("series")
      .addPath(chapter.sourceManga.mangaId)
      .addPath("chapter")
      .addPath(chapter.chapterId)
      .build();

    const request: Request = { url, method: "GET" };

    const [, buffer] = await Application.scheduleRequest(request);
    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const scripts = $("script")
      .toArray()
      .filter((script) => $(script).text().includes("self.__next_f.push"))
      .map((script) => $(script).text())
      .join("");

    const re = /\\"pages\\":(\[.*?\])/;
    const match = scripts.match(re);
    if (!match) {
      throw new Error(`Could not parse page data for chapter ${chapter.chapNum}`);
    }
    const json = JSON.parse(match[1].replaceAll('\\"', '"')) as Page[];

    const pages: string[] = json.map((value) => {
      return value.url;
    });
    return {
      mangaId: chapter.sourceManga.mangaId,
      id: chapter.chapterId,
      pages,
    };
  }

  async getGenres(): Promise<string[]> {
    try {
      const request = {
        url: new URLBuilder(AS_API_DOMAIN)
          .addPath("api")
          .addPath("series")
          .addPath("filters")
          .build(),
        method: "GET",
      };

      const [_, buffer] = await Application.scheduleRequest(request);
      const data: Filters = JSON.parse(Application.arrayBufferToUTF8String(buffer)) as Filters;
      return data.genres.map((a) => a.name);
    } catch (error) {
      throw new Error(error as string);
    }
  }

  async getSearchTags(): Promise<TagSection[]> {
    let tags = Application.getState("tags") as TagSection[];
    if (tags !== undefined) {
      console.log("bypassing web request");
      return tags;
    }
    try {
      const request = {
        url: new URLBuilder(AS_API_DOMAIN)
          .addPath("api")
          .addPath("series")
          .addPath("filters")
          .build(),
        method: "GET",
      };

      const [_, buffer] = await Application.scheduleRequest(request);
      const data: Filters = JSON.parse(Application.arrayBufferToUTF8String(buffer)) as Filters;

      // Set filters for mangaDetails
      await setFilters(data);

      tags = parseTags(data);
      Application.setState(tags, "tags");
      return tags;
    } catch (error) {
      throw new Error(error as string);
    }
  }

  async supportsTagExclusion(): Promise<boolean> {
    return false;
  }

  async getSearchFilters(): Promise<SearchFilter[]> {
    const tags = await this.getSearchTags();
    return tags.map((tag) => ({
      id: tag.id,
      title: tag.title,
      type: "multiselect",
      options: tag.tags.map((x) => ({ id: x.id, value: x.title })),
      allowExclusion: false,
      value: {},
      allowEmptySelection: true,
      maximum: undefined,
    }));
  }

  async getSearchResults(
    query: SearchQuery,
    metadata: AsuraScansMetadata | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const page: number = metadata?.page ?? 1;
    let newUrlBuilder: URLBuilder = new URLBuilder(AS_DOMAIN)
      .addPath("series")
      .addQuery("page", page.toString());

    if (query?.title) {
      newUrlBuilder = newUrlBuilder.addQuery(
        "name",
        encodeURIComponent(query?.title.replace(/[’‘´`'-][a-z]*/g, "%") ?? ""),
      );
    }
    const includedTags = [];
    for (const filter of query.filters) {
      const tags = (filter.value ?? {}) as Record<string, "included" | "excluded">;
      for (const tag of Object.entries(tags)) {
        includedTags.push(tag[0]);
      }
    }

    newUrlBuilder = newUrlBuilder
      .addQuery("genres", getFilterTagsBySection("genres", includedTags))
      .addQuery("status", getFilterTagsBySection("status", includedTags))
      .addQuery("types", getFilterTagsBySection("type", includedTags))
      .addQuery("order", getFilterTagsBySection("order", includedTags));

    const response = await Application.scheduleRequest({
      url: newUrlBuilder.build(),
      method: "GET",
    });
    const $ = cheerio.load(Application.arrayBufferToUTF8String(response[1]));

    const items = await parseSearch($);
    metadata = !isLastPage($) ? { page: page + 1 } : undefined;
    return { items, metadata };
  }
}

export const AsuraScans = new AsuraScansExtension();
