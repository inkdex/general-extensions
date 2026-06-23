/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SourceManga } from "@paperback/types";

import { DOMAIN } from "../shared/models";
import { buildThumbnailUrl, getContentRating, parseMangaPage } from "../shared/utils";

export function parseMangaDetails(html: string, mangaId: string): SourceManga {
  const manga = parseMangaPage(html);

  return {
    mangaId: mangaId,
    mangaInfo: {
      primaryTitle: manga.title,
      secondaryTitles: manga.otherNames,
      thumbnailUrl: buildThumbnailUrl(manga.poster.image),
      synopsis: manga.synopsis,
      author: manga.authors.length > 0 ? manga.authors.map((a) => a.name).join(", ") : undefined,
      status: manga.status,
      contentRating: getContentRating(),
      tagGroups:
        manga.genres?.length > 0
          ? [
              {
                id: "tags",
                title: "Tags",
                tags: manga.genres.map((genre) => ({
                  id: genre.id,
                  title: genre.name,
                })),
              },
            ]
          : [],
      shareUrl: `${DOMAIN}/manga/${mangaId}`,
    },
  };
}
