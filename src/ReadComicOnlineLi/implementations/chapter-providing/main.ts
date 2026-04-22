import type { Chapter, ChapterDetails, Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN } from "../shared/models";
import { createChapterPageUrls, fetchCheerio } from "../../services/network";
import { parseChapterDetails, parseChapterList } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const url = new URL(DOMAIN)
      .addPathComponent("Comic")
      .addPathComponent(sourceManga.mangaId)
      .toString();

    const request: Request = { url, method: "GET" };
    const $ = await fetchCheerio(request);
    return parseChapterList($, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const url = new URL(`${DOMAIN}/Comic/${chapter.chapterId}`)
      .setQueryItem("readType", "1")
      .toString();

    const request: Request = { url, method: "GET" };
    const $ = await fetchCheerio(request);
    const pages = createChapterPageUrls(
      chapter.sourceManga.mangaId,
      chapter.chapterId,
      parseChapterDetails($),
    );

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages,
    };
  }
}
