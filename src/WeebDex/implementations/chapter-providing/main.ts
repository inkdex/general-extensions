import {
  URL,
  type Chapter,
  type ChapterDetails,
  type Request,
  type SourceManga,
} from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import { getChapterLanguages, getHideBonusChapters } from "../settings-form/forms/main";
import type { WeebDexChapter, WeebDexChapterFeedResponse } from "../shared/models";
import { parseChapterDetails, parseChapterList } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId;
    const allChapters: Chapter[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const url = new URL(WEEBDEX_API_DOMAIN)
        .addPathComponent("manga")
        .addPathComponent(mangaId)
        .addPathComponent("chapters")
        .setQueryItem("limit", "100")
        .setQueryItem("page", currentPage.toString())
        .toString();

      const request: Request = { url, method: "GET" };
      const json = await fetchJSON<WeebDexChapterFeedResponse>(request);

      const chapters = parseChapterList(json, sourceManga);
      allChapters.push(...chapters);

      hasMore = json.data.length >= 100;
      currentPage++;
    }

    const selectedLanguages = getChapterLanguages();
    let filteredChapters =
      selectedLanguages.length === 0
        ? allChapters
        : allChapters.filter((ch) => selectedLanguages.includes(ch.langCode));

    if (getHideBonusChapters()) {
      filteredChapters = filteredChapters.filter((ch) => ch.chapNum % 1 === 0);
    }

    const maxIndex = filteredChapters.length - 1;
    filteredChapters.forEach((ch, index) => {
      ch.sortingIndex = maxIndex - index;
    });

    return filteredChapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const chapterId = chapter.chapterId;

    const url = new URL(WEEBDEX_API_DOMAIN)
      .addPathComponent("chapter")
      .addPathComponent(chapterId)
      .toString();

    const request: Request = { url, method: "GET" };
    const json = await fetchJSON<WeebDexChapter>(request);

    return parseChapterDetails(json, chapter);
  }
}
