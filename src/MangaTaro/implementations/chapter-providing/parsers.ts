import type { Chapter, SourceManga } from "@paperback/types";
import type { MangaTaroChapter } from "../shared/models";
import { parseRelativeDate } from "../shared/utils";

export function parseChapterList(
  chapters: MangaTaroChapter[],
  sourceManga: SourceManga,
): Chapter[] {
  return chapters.map((ch) => {
    const groupName = ch.group_name?.trim() || "No Group";

    // use empty string when title is N/A
    const rawTitle = ch.title?.trim();
    const title = !rawTitle || rawTitle === "N/A" ? "" : rawTitle;

    const chapNum = parseFloat(ch.chapter) || 0;

    return {
      chapterId: ch.id,
      sourceManga,
      title,
      chapNum,
      volume: 0,
      langCode: ch.language ?? "en",
      version: groupName,
      sortingIndex: chapNum,
      publishDate: parseRelativeDate(ch.date),
    };
  });
}
