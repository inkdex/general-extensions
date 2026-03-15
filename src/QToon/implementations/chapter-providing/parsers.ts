import type { Chapter, SourceManga } from "@paperback/types";
import type { QToonEpisode } from "../shared/models";

// season in multiple languages
const SEASON_PATTERN = /\(?(?:S(?:eason|aison)?|T(?:emporada)?)\s*(\d+)\)?/i;

// chapter/episode in multiple languages + common abbreviations
const CHAPTER_PATTERN =
  /(?:chapter|chapitre|cap[ií]tulo|ch\.?|cap\.?|episode|episodio|[eé]pisode|ep\.?)\s*\d+\s*[-:–—]?\s*/gi;

function extractSeason(title: string): number {
  const match = title.match(SEASON_PATTERN);
  return match ? parseInt(match[1], 10) : 0;
}

function cleanTitle(title: string): string {
  return title
    .replace(CHAPTER_PATTERN, "")
    .replace(SEASON_PATTERN, "")
    .replace(/^\s*[-:–—]\s*/, "")
    .trim();
}

export function parseQToonEpisodes(episodes: QToonEpisode[], sourceManga: SourceManga): Chapter[] {
  return episodes.map((ep) => ({
    chapterId: ep.esid,
    sourceManga,
    title: cleanTitle(ep.title),
    chapNum: ep.serialNo,
    volume: extractSeason(ep.title),
    langCode: "en",
    sortingIndex: ep.serialNo,
  }));
}
