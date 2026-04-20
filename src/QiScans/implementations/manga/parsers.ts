/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SourceManga } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { QIScansSeriesDetailsResponse } from "../shared/models";
import { encodeMangaId } from "../shared/utils";
import { DOMAIN } from "../shared/models";

export function parseMangaDetails(series: QIScansSeriesDetailsResponse): SourceManga {
  const author = series.author?.trim();
  const artist = series.artist?.trim();

  return {
    mangaId: encodeMangaId(series.slug),
    mangaInfo: {
      primaryTitle: Application.decodeHTMLEntities(series.title),

      secondaryTitles: series.alternativeTitles
        ? series.alternativeTitles
            .split(/, ?/)
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : [],

      thumbnailUrl: series.cover || "",

      synopsis: Application.decodeHTMLEntities(series.description.replace(/<[^>]+>/g, "")),

      ...(author ? { author } : {}),
      ...(artist ? { artist } : {}),

      status: series.status ?? "UNKNOWN",
      contentRating: ContentRating.EVERYONE,

      tagGroups:
        series.genres && series.genres.length > 0
          ? [
              {
                id: "genres",
                title: "Genres",
                tags: series.genres.map((g) => ({
                  id: g.id.toString(),
                  title: g.name,
                })),
              },
            ]
          : [],

      additionalInfo: {
        seriesId: series.id.toString(),
        slug: series.slug,
      },

      shareUrl: `${DOMAIN}/series/${series.slug}`,
    },
  };
}
