/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  DiscoverSectionType,
  URL,
  type DiscoverSection,
  type DiscoverSectionItem,
  type PagedResults,
  type TagSection,
} from "@paperback/types";

import tagJSON from "../external/tag.json";
import { parseChapterTitle, parseMangaList } from "../MangaDexParser";
import {
  DISCOVER_SECTIONS,
  getDiscoverSectionOrder,
  getDiscoverThumbnail,
  getLanguages,
  getLatestUpdatesEnabled,
  getPopularEnabled,
  getRatings,
  getRecentlyAddedEnabled,
  getSeasonalEnabled,
  getTagSectionsEnabled,
} from "../MangaDexSettings";
import { fetchJSON, MANGADEX_API, SEASONAL_LIST } from "../utils/CommonUtil";

/**
 * Provides manga discover sections and content for the home page
 */
export class DiscoverProvider {
  /**
   * Returns configured discover sections based on user settings
   */
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const sections: DiscoverSection[] = [];

    const sectionOrder = getDiscoverSectionOrder();

    const availableSections = [
      {
        id: DISCOVER_SECTIONS.SEASONAL,
        title: "Seasonal",
        type: DiscoverSectionType.featured,
        enabled: getSeasonalEnabled(),
      },
      {
        id: DISCOVER_SECTIONS.LATEST_UPDATES,
        title: "Latest Updates",
        type: DiscoverSectionType.chapterUpdates,
        enabled: getLatestUpdatesEnabled(),
      },
      {
        id: DISCOVER_SECTIONS.POPULAR,
        title: "Popular",
        type: DiscoverSectionType.prominentCarousel,
        enabled: getPopularEnabled(),
      },
      {
        id: DISCOVER_SECTIONS.RECENTLY_ADDED,
        title: "Recently Added",
        type: DiscoverSectionType.simpleCarousel,
        enabled: getRecentlyAddedEnabled(),
      },
      {
        id: DISCOVER_SECTIONS.TAG_SECTIONS,
        title: "Tag Sections",
        type: DiscoverSectionType.genres,
        enabled: getTagSectionsEnabled(),
        isTagSection: true,
      },
    ];

    const sectionMap = new Map<string, (typeof availableSections)[0]>();
    for (const section of availableSections) {
      sectionMap.set(section.id, section);
    }

    for (const sectionId of sectionOrder) {
      const section = sectionMap.get(sectionId);
      if (section && section.enabled) {
        if (section.isTagSection) {
          if (getTagSectionsEnabled()) {
            sections.push(...this.getTagSections());
          }
        } else {
          sections.push({
            id: section.id,
            title: section.title,
            type: section.type,
          });
        }
      }
    }

    return sections;
  }

  /**
   * Creates tag sections from available manga tags
   */
  getTagSections(): DiscoverSection[] {
    const uniqueGroups = new Set<string>();
    const sections: DiscoverSection[] = [];

    for (const tag of tagJSON) {
      const group = tag.data.attributes.group;

      if (!uniqueGroups.has(group)) {
        uniqueGroups.add(group);
        sections.push({
          id: group,
          title: group.charAt(0).toUpperCase() + group.slice(1),
          type: DiscoverSectionType.genres,
        });
      }
    }

    return sections;
  }

  /**
   * Gets items for tag-based discover sections
   */
  async getTags(section: DiscoverSection): Promise<PagedResults<DiscoverSectionItem>> {
    const sections: Record<string, TagSection> = {};

    for (const tag of tagJSON) {
      const group = tag.data.attributes.group;

      if (sections[group] == null) {
        sections[group] = {
          id: group,
          title: group.charAt(0).toUpperCase() + group.slice(1),
          tags: [],
        };
      }

      const tagObject = {
        id: tag.data.id,
        title: tag.data.attributes.name.en,
      };
      sections[group].tags = [...(sections[group]?.tags ?? []), tagObject];
    }

    return {
      items:
        sections[section.id]?.tags.map((x) => ({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            filters: [
              {
                id: `tags-${section.id}`,
                value: { [x.id]: "included" },
              },
            ],
          },
          name: x.title,
        })) ?? [],
      metadata: undefined,
    };
  }

  /**
   * Fetches content for a specific discover section
   */
  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: MangaDex.Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const sectionId = section.id;

    if (sectionId === DISCOVER_SECTIONS.SEASONAL) {
      if (!getSeasonalEnabled()) return { items: [], metadata: undefined };
      return this.getMangaListDiscoverSectionItems(section);
    }

    if (sectionId === DISCOVER_SECTIONS.LATEST_UPDATES) {
      if (!getLatestUpdatesEnabled()) return { items: [], metadata: undefined };
      return this.getLatestUpdatesDiscoverSectionItems(section, metadata);
    }

    if (sectionId === DISCOVER_SECTIONS.POPULAR) {
      if (!getPopularEnabled()) return { items: [], metadata: undefined };
      return this.getPopularDiscoverSectionItems(section, metadata);
    }

    if (sectionId === DISCOVER_SECTIONS.RECENTLY_ADDED) {
      if (!getRecentlyAddedEnabled()) return { items: [], metadata: undefined };
      return this.getRecentlyAddedDiscoverSectionItems(section, metadata);
    }

    if (!getTagSectionsEnabled()) return { items: [], metadata: undefined };
    return this.getTags(section);
  }

  /**
   * Builds URL for fetching custom list content
   */
  async getCustomListRequestURL(listId: string, ratings: string[]): Promise<string> {
    const request = {
      url: `${MANGADEX_API}/list/${listId}`,
      method: "GET",
    };

    const json = await fetchJSON<MangaDex.CustomListResponse>(request);

    return new URL(MANGADEX_API)
      .addPathComponent("manga")
      .setQueryItem("limit", "100")
      .setQueryItem("contentRating[]", ratings)
      .setQueryItem("includes[]", "cover_art")
      .setQueryItem(
        "ids[]",
        json.data.relationships
          .filter((x: MangaDex.Relationship) => x.type.valueOf() === "manga")
          .map((x: MangaDex.Relationship) => x.id),
      )
      .toString();
  }

  /**
   * Fetches seasonal manga list for featured section
   */
  async getMangaListDiscoverSectionItems(
    section: DiscoverSection,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const ratings: string[] = getRatings();

    const request = {
      url: await this.getCustomListRequestURL(SEASONAL_LIST, ratings),
      method: "GET",
    };
    const json = await fetchJSON<MangaDex.SearchResponse>(request);
    if (json.data === undefined) {
      throw new Error(`Failed to create results for ${section.title}, check MangaDex status`);
    }

    const items = await parseMangaList(json.data, getDiscoverThumbnail);

    return {
      items: items.map((x) => ({
        type: "featuredCarouselItem",
        imageUrl: x.imageUrl,
        mangaId: x.mangaId,
        title: x.title,
        supertitle: undefined,
        metadata: undefined,
        contentRating: x.contentRating,
      })),
      metadata: undefined,
    };
  }

  /**
   * Fetches popular manga for carousel display
   */
  async getPopularDiscoverSectionItems(
    section: DiscoverSection,
    metadata: MangaDex.Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const offset: number = metadata?.offset ?? 0;
    const collectedIds: string[] = metadata?.collectedIds ?? [];

    const ratings: string[] = getRatings();
    const languages: string[] = getLanguages();

    const request = {
      url: new URL(MANGADEX_API)
        .addPathComponent("manga")
        .setQueryItem("limit", "100")
        .setQueryItem("hasAvailableChapters", "true")
        .setQueryItem("availableTranslatedLanguage[]", languages)
        .setQueryItem("order[followedCount]", "desc")
        .setQueryItem("offset", offset.toString())
        .setQueryItem("contentRating[]", ratings)
        .setQueryItem("includes[]", "cover_art")
        .toString(),
      method: "GET",
    };
    const json = await fetchJSON<MangaDex.SearchResponse>(request);
    if (json.data === undefined) {
      throw new Error(`Failed to create results for ${section.title}, check MangaDex status`);
    }

    const items = await parseMangaList(json.data, getDiscoverThumbnail);
    const nextMetadata: MangaDex.Metadata | undefined =
      items.length < 100 ? undefined : { offset: offset + 100, collectedIds };
    return {
      items: items.map((x) => ({ ...x, type: "prominentCarouselItem" })),
      metadata: nextMetadata,
    };
  }

  /**
   * Fetches latest chapter updates for the updates section
   */
  async getLatestUpdatesDiscoverSectionItems(
    section: DiscoverSection,
    metadata: MangaDex.Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const offset: number = metadata?.offset ?? 0;
    const collectedIds: string[] = metadata?.collectedIds ?? [];

    const ratings: string[] = getRatings();
    const languages: string[] = getLanguages();

    const chapterRequest = {
      url: new URL(MANGADEX_API)
        .addPathComponent("chapter")
        .setQueryItem("translatedLanguage[]", languages)
        .setQueryItem("limit", "100")
        .setQueryItem("order[readableAt]", "desc")
        .setQueryItem("contentRating[]", ratings)
        .setQueryItem("offset", offset.toString())
        .toString(),
      method: "GET",
    };

    const chapters = await fetchJSON<MangaDex.ChapterResponse>(chapterRequest);

    const request = {
      url: new URL(MANGADEX_API)
        .addPathComponent("manga")
        .setQueryItem(
          "ids[]",
          chapters.data.map((x) => x.relationships.find((x) => x.type == "manga")!.id),
        )
        .setQueryItem("limit", "100")
        .setQueryItem("includes[]", "cover_art")
        .toString(),
      method: "GET",
    };

    const json = await fetchJSON<MangaDex.SearchResponse>(request);
    if (json.data === undefined) {
      throw new Error(`Failed to create results for ${section.title}, check MangaDex status`);
    }

    const items = await parseMangaList(json.data, getDiscoverThumbnail);

    const chapterIdToChapter: Record<string, MangaDex.ChapterData> = {};
    for (const chapter of chapters.data) {
      chapterIdToChapter[chapter.id] = chapter;
    }

    const nextMetadata: MangaDex.Metadata | undefined =
      chapters.data.length < 100 ? undefined : { offset: offset + 100, collectedIds };
    return {
      items: items
        .filter((x) => x.attributes.latestUploadedChapter != null)
        .map((x) => ({
          chapterId: x.attributes.latestUploadedChapter,
          imageUrl: x.imageUrl,
          mangaId: x.mangaId,
          title: x.title,
          subtitle: parseChapterTitle(
            chapterIdToChapter[x.attributes.latestUploadedChapter]?.attributes ?? {},
          ),
          publishDate: new Date(
            chapterIdToChapter[x.attributes.latestUploadedChapter]?.attributes.readableAt,
          ),
          contentRating: x.contentRating,
          type: "chapterUpdatesCarouselItem",
        })),
      metadata: nextMetadata,
    };
  }

  /**
   * Fetches recently added manga for display
   */
  async getRecentlyAddedDiscoverSectionItems(
    section: DiscoverSection,
    metadata: MangaDex.Metadata | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const offset: number = metadata?.offset ?? 0;
    const collectedIds: string[] = metadata?.collectedIds ?? [];

    const ratings: string[] = getRatings();
    const languages: string[] = getLanguages();

    const request = {
      url: new URL(MANGADEX_API)
        .addPathComponent("manga")
        .setQueryItem("limit", "100")
        .setQueryItem("hasAvailableChapters", "true")
        .setQueryItem("availableTranslatedLanguage[]", languages)
        .setQueryItem("order[createdAt]", "desc")
        .setQueryItem("offset", offset.toString())
        .setQueryItem("contentRating[]", ratings)
        .setQueryItem("includes[]", "cover_art")
        .toString(),
      method: "GET",
    };
    const json = await fetchJSON<MangaDex.SearchResponse>(request);
    if (json.data === undefined) {
      throw new Error(`Failed to create results for ${section.title}, check MangaDex status`);
    }

    const items = await parseMangaList(json.data, getDiscoverThumbnail);
    const nextMetadata: MangaDex.Metadata | undefined =
      items.length < 100 ? undefined : { offset: offset + 100, collectedIds };
    return {
      items: items.map((x) => ({ ...x, type: "simpleCarouselItem" })),
      metadata: nextMetadata,
    };
  }
}
