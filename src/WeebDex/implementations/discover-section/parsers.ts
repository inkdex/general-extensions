import type { DiscoverSectionItem } from "@paperback/types";
import { getDiscoverSubtitle, getForceDiscoverSubtitle } from "../settings-form/forms/main";
import type { WeebDexChapterFeedResponse, WeebDexMangaListResponse } from "../shared/models";
import { buildCoverUrl, buildMangaSubtitle } from "../shared/utils";

export function parseDiscoverItems(json: WeebDexMangaListResponse): DiscoverSectionItem[] {
  const manga = json.data ?? [];

  if (manga.length === 0) {
    return [];
  }

  return manga
    .filter((item) => item.title && item.title.trim().length > 0)
    .map((item) => {
      return {
        type: "simpleCarouselItem" as const,
        mangaId: item.id,
        title: item.title,
        imageUrl: buildCoverUrl(item.id, item.relationships?.cover),
        subtitle: buildMangaSubtitle(item, getDiscoverSubtitle()),
      };
    });
}

export function parseLatestUpdates(json: WeebDexChapterFeedResponse): DiscoverSectionItem[] {
  const chapters = json.data ?? [];

  if (chapters.length === 0) {
    return [];
  }

  return chapters
    .filter((ch) => ch.relationships?.manga?.title)
    .map((ch) => {
      const manga = ch.relationships.manga;
      const mangaId = manga.id;

      let subtitle: string;
      if (getForceDiscoverSubtitle()) {
        subtitle = buildMangaSubtitle(manga, getDiscoverSubtitle());
      } else {
        const chapterNum = ch.chapter ? `Ch. ${ch.chapter}` : "";
        const volumeNum = ch.volume ? `Vol. ${ch.volume}` : "";
        subtitle = [volumeNum, chapterNum].filter(Boolean).join(" ") || "New Chapter";
      }

      return {
        type: "chapterUpdatesCarouselItem" as const,
        mangaId: mangaId,
        chapterId: ch.id,
        title: manga.title,
        imageUrl: buildCoverUrl(mangaId, manga.relationships?.cover),
        subtitle: subtitle,
      };
    });
}
