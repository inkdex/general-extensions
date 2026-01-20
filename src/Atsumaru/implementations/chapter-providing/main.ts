import type { Chapter, ChapterDetails, Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";
import { ATSUMARU_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import type { AtsuChaptersResponse, AtsuReadChapterResponse } from "../shared/models";
import { parseChapterList } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId;
    const allChapters: Chapter[] = [];
    let currentPage = 0;
    let totalPages = 1;

    // fetch all pages
    while (currentPage < totalPages) {
      const url = new URL(ATSUMARU_DOMAIN)
        .addPathComponent("api")
        .addPathComponent("manga")
        .addPathComponent("chapters")
        .setQueryItem("id", mangaId)
        .setQueryItem("filter", "all")
        .setQueryItem("sort", "desc")
        .setQueryItem("page", currentPage.toString())
        .toString();

      const request: Request = { url, method: "GET" };
      const json = await fetchJSON<AtsuChaptersResponse>(request);

      totalPages = json.pages;
      allChapters.push(...parseChapterList(json, sourceManga));
      currentPage++;
    }

    return allChapters;
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const mangaId = chapter.sourceManga.mangaId;
    const chapterId = chapter.chapterId;

    const url = new URL(ATSUMARU_DOMAIN)
      .addPathComponent("api")
      .addPathComponent("read")
      .addPathComponent("chapter")
      .setQueryItem("mangaId", mangaId)
      .setQueryItem("chapterId", chapterId)
      .toString();

    const request: Request = { url, method: "GET" };
    const json = await fetchJSON<AtsuReadChapterResponse>(request);

    const pages = json.readChapter.pages
      .sort((a, b) => a.number - b.number)
      .map((page) => `${ATSUMARU_DOMAIN}${page.image}`);

    return {
      id: chapterId,
      mangaId: mangaId,
      pages: pages,
    };
  }
}
