import type { MangaInfo, SourceManga } from "@paperback/types";
import { WEEBDEX_DOMAIN } from "../../main";
import type { WeebDexManga } from "../shared/models";
import { buildCoverUrl, capitalize, mapContentRating } from "../shared/utils";

export function parseMangaDetails(manga: WeebDexManga, mangaId: string): SourceManga {
  const authors = manga.relationships?.authors?.map((a) => a.name).join(", ") || undefined;

  const artists = manga.relationships?.artists?.map((a) => a.name).join(", ") || undefined;

  const secondaryTitles: string[] = [];
  if (manga.alt_titles) {
    for (const lang in manga.alt_titles) {
      secondaryTitles.push(...manga.alt_titles[lang]);
    }
  }

  const tagGroups = [];
  const infoTags = [];
  if (manga.demographic) {
    infoTags.push({
      id: `demographic-${manga.demographic}`,
      title: capitalize(manga.demographic),
    });
  }
  if (manga.status) {
    infoTags.push({
      id: `status-${manga.status}`,
      title: capitalize(manga.status),
    });
  }
  if (infoTags.length > 0) {
    tagGroups.push({
      id: "info",
      title: "Info",
      tags: infoTags,
    });
  }

  if (manga.relationships?.tags && manga.relationships.tags.length > 0) {
    tagGroups.push({
      id: "tags",
      title: "Tags",
      tags: manga.relationships.tags.map((tag) => ({
        id: tag.id,
        title: tag.name,
      })),
    });
  }

  const mangaInfo: MangaInfo = {
    primaryTitle: manga.title,
    secondaryTitles: secondaryTitles,
    thumbnailUrl: buildCoverUrl(mangaId, manga.relationships?.cover),
    status: manga.status || "Unknown",
    author: authors,
    artist: artists,
    synopsis: manga.description || "No description available.",
    contentRating: mapContentRating(manga.content_rating),
    tagGroups: tagGroups,
    shareUrl: `${WEEBDEX_DOMAIN}/title/${mangaId}`,
  };

  return {
    mangaId: mangaId,
    mangaInfo: mangaInfo,
  };
}
