/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { DiscoverSection, SimpleCarouselItem } from "@paperback/types";
import { ContentRating, DiscoverSectionType } from "@paperback/types";

import type { QToonComic, QToonCompositionBlock, SectionEndpoint } from "../shared/models";
import { comicId } from "../shared/utils";

export function extractEndpoint(block: QToonCompositionBlock): SectionEndpoint | undefined {
  if (block.ranking?.rsid) return { type: "ranking", id: block.ranking.rsid };
  if (block.album?.asid) return { type: "album", id: block.album.asid };
  return undefined;
}

export function parseCompositionBlocks(blocks: QToonCompositionBlock[]): DiscoverSection[] {
  return blocks
    .filter((block) => block.comics && block.comics.length > 0)
    .map((block) => ({
      id: block.msid,
      title: block.title,
      type: DiscoverSectionType.simpleCarousel,
    }));
}

export function parseQToonComics(comics: QToonComic[]): SimpleCarouselItem[] {
  return comics
    .filter((comic) => comicId(comic))
    .map((comic) => ({
      type: "simpleCarouselItem" as const,
      mangaId: comicId(comic),
      imageUrl: comic.image.thumb.url,
      title: comic.title ?? "",
      subtitle: comic.author ?? "",
      contentRating: ContentRating.EVERYONE,
    }));
}
