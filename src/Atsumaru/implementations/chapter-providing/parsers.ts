import type { Chapter, SourceManga } from "@paperback/types";
import type { AtsuChaptersResponse } from "../shared/models";

export function parseChapterList(json: AtsuChaptersResponse, sourceManga: SourceManga): Chapter[] {
  return json.chapters.map((ch) => {
    // look for chapter/episode
    const episodeMatch = ch.title.match(/Episode\s+([\d.]+)/i);
    const chapterMatch = ch.title.match(/Ch(?:apter)?\.?\s+([\d.]+)/i);
    const chapterNumber = episodeMatch?.[1]
      ? parseFloat(episodeMatch[1])
      : chapterMatch?.[1]
        ? parseFloat(chapterMatch[1])
        : ch.number;

    // look for season number
    const seasonMatch = ch.title.match(/S(?:eason)?\s*(\d+)/i);
    const volumeNumber = seasonMatch ? parseInt(seasonMatch[1]) : 0;

    return {
      chapterId: ch.id,
      sourceManga,
      title: "",
      chapNum: chapterNumber,
      volume: volumeNumber,
      langCode: "en",
      sortingIndex: ch.index,
      publishDate: new Date(ch.createdAt),
    };
  });
}
