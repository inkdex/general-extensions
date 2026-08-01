/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { DiscoverSection, DiscoverSectionItem, PagedResults } from "@paperback/types";
import { DiscoverSectionType } from "@paperback/types";

import { fetchHomeItems } from "../../services/network";
import { HOME_PAGE_SIZE, HOME_SECTION_METADATA_ID } from "../shared/models";
import { buildThumbnailUrl, getContentRating } from "../shared/utils";
import { HOME_TIMEFRAMES } from "./models";
import { buildHomeSections } from "./parsers";

export class DiscoverProvider {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return buildHomeSections().map((section) => ({
      id: section.id,
      title: section.title,
      type: section.usesTimeframes
        ? DiscoverSectionType.genres
        : DiscoverSectionType.simpleCarousel,
    }));
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: { page?: number },
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const definition = buildHomeSections().find((candidate) => candidate.id === section.id);
    if (!definition) throw new Error(`Unknown section: ${section.id}`);

    if (definition.usesTimeframes) {
      return {
        items: HOME_TIMEFRAMES.map((timeframe) => ({
          type: "genresCarouselItem" as const,
          name: timeframe.title,
          searchQuery: {
            title: `${definition.title}: ${timeframe.title}`,
            metadata: [
              {
                id: HOME_SECTION_METADATA_ID,
                value: `${definition.endpoint}:${timeframe.id}`,
              },
            ],
          },
          contentRating: getContentRating(),
        })),
        metadata: undefined,
      };
    }

    const page = metadata?.page ?? 0;
    const genre =
      definition.id === "genre-spotlight" ? section.title.replace(/^Spotlight:\s*/, "") : undefined;
    const homeItems = await fetchHomeItems(definition.endpoint, page, {
      genre,
      timeframe: definition.timeframe,
    });
    const items: DiscoverSectionItem[] = homeItems.map((item) => ({
      type: "simpleCarouselItem",
      mangaId: item.id,
      title: item.title,
      imageUrl: buildThumbnailUrl(item.mediumImage ?? item.smallImage ?? item.image),
      subtitle: item.type,
      contentRating: getContentRating(),
    }));

    return {
      items,
      metadata: items.length === HOME_PAGE_SIZE ? { page: page + 1 } : undefined,
    };
  }
}
