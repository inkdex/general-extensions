/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SourceManga } from "@paperback/types";

import { DOMAIN } from "../shared/models";
import { parseContentRating, parseMangaPage } from "../shared/parsers";
import { buildThumbnailUrl } from "../shared/utils";

export function parseMangaDetails(html: string, mangaId: string): SourceManga {
  const manga = parseMangaPage(html);
  const primaryTitle = manga.englishTitle || manga.title;
  const secondaryTitles = Array.from(
    new Set([manga.title, ...manga.otherNames].map((title) => title.trim())),
  ).filter((title) => title && title !== primaryTitle);

  return {
    mangaId: mangaId,
    mangaInfo: {
      primaryTitle,
      secondaryTitles,
      thumbnailUrl: buildThumbnailUrl(
        manga.poster.mediumImage ?? manga.poster.smallImage ?? manga.poster.image,
      ),
      synopsis: manga.synopsis,
      author: manga.authors.length > 0 ? manga.authors.map((a) => a.name).join(", ") : undefined,
      status: manga.status,
      contentRating: parseContentRating(manga.isAdult),
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
