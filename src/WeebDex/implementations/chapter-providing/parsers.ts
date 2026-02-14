import type { Chapter, ChapterDetails, SourceManga } from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../main";
import type { WeebDexChapter, WeebDexChapterFeedResponse } from "../shared/models";

export function parseChapterList(
  json: WeebDexChapterFeedResponse,
  sourceManga: SourceManga,
  startIndex: number = 0,
): Chapter[] {
  const chapters = json.data ?? [];

  if (chapters.length === 0) {
    return [];
  }

  return chapters
    .filter((ch) => !ch.is_unavailable)
    .map((ch, index) => {
      const chapterNum = ch.chapter ? parseFloat(ch.chapter) : 0;
      const volumeNum = ch.volume ? parseFloat(ch.volume) : 0;
      const groupName = ch.relationships?.groups?.[0]?.name || "No Group";

      return {
        chapterId: ch.id,
        sourceManga,
        title: ch.title || "",
        chapNum: chapterNum,
        volume: volumeNum,
        langCode: ch.language || "en",
        version: groupName,
        sortingIndex: startIndex + index,
        publishDate: new Date(ch.published_at || ch.created_at),
      };
    });
}

export function parseChapterDetails(
  chapter: WeebDexChapter,
  chapterObj: Chapter,
  dataSaver: boolean,
): ChapterDetails {
  const node = chapter.node || WEEBDEX_API_DOMAIN;
  const chapterId = chapter.id;

  // data saver prioritizes optimized, full quality prioritizes original
  const pageData = dataSaver
    ? chapter.data_optimized || chapter.data || []
    : chapter.data || chapter.data_optimized || [];

  const pages = pageData.map((page) => `${node}/data/${chapterId}/${page.name}`);

  if (pages.length === 0) {
    throw new Error("No pages found for this chapter");
  }

  return {
    id: chapterId,
    mangaId: chapterObj.sourceManga.mangaId,
    pages: pages,
  };
}
