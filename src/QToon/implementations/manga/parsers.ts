/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SourceManga } from "@paperback/types";
import { ContentRating } from "@paperback/types";

import { DOMAIN } from "../shared/models";
import type { QToonComic } from "../shared/models";
import { comicId } from "../shared/utils";

export function parseQToonMangaDetails(comic: QToonComic, mangaId: string): SourceManga {
  const tags = [
    ...comic.tags.map((t) => ({ id: t.name.toLowerCase().replace(/\s+/g, "-"), title: t.name })),
    ...comic.corners.cornerTags.map((t) => ({
      id: t.name.toLowerCase().replace(/\s+/g, "-"),
      title: t.name,
    })),
  ];

  const tagGroups = tags.length > 0 ? [{ id: "tags", title: "Tags", tags }] : [];

  let status: string | undefined;
  switch (comic.serialStatus2) {
    case 101:
      status = "Ongoing";
      break;
    case 103:
      status = "Completed";
      break;
    default:
      status = undefined;
  }

  const synopsis = comic.updateMemo
    ? `${comic.introduction}\n\nUpdates: ${comic.updateMemo}`
    : comic.introduction;

  return {
    mangaId,
    mangaInfo: {
      primaryTitle: comic.title,
      secondaryTitles: [],
      thumbnailUrl: comic.image.thumb.url,
      synopsis,
      author: comic.author,
      status,
      contentRating: ContentRating.EVERYONE,
      tagGroups,
      shareUrl: `${DOMAIN}/detail/${comicId(comic)}`,
    },
  };
}
