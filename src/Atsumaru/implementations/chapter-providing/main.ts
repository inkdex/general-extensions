/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Chapter, ChapterDetails, Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";

import { fetchJSON, fetchText } from "../../services/network";
import { SearchProvider } from "../search-results-providing/main";
import { DOMAIN } from "../shared/models";
import type { AtsuChaptersResponse, AtsuReadChapterResponse } from "../shared/models";
import { parseMangaPage } from "../shared/utils";
import { parseChapterList } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    let mangaId = sourceManga.mangaId;
    let pageUrl = new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString();
    let pageRequest: Request = { url: pageUrl, method: "GET" };
    let html = await fetchText(pageRequest);
    let mangaPage: ReturnType<typeof parseMangaPage>;

    try {
      mangaPage = parseMangaPage(html);
    } catch {
      const searchResults = await new SearchProvider().getSearchResults({
        title: sourceManga.mangaInfo.primaryTitle,
      });
      const currentMangaId = searchResults.items.find(
        (item) => item.title === sourceManga.mangaInfo.primaryTitle,
      )?.mangaId;

      if (!currentMangaId) {
        throw new Error(`Could not resolve manga ID for: ${sourceManga.mangaInfo.primaryTitle}`);
      }

      mangaId = currentMangaId;
      pageUrl = new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString();
      pageRequest = { url: pageUrl, method: "GET" };
      html = await fetchText(pageRequest);
      mangaPage = parseMangaPage(html);
    }

    mangaId = mangaPage.id;
    const scanlatorMap = new Map((mangaPage?.scanlators ?? []).map((s) => [s.id, s.name]));

    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent("allChapters")
      .setQueryItem("mangaId", mangaId)
      .toString();

    const request: Request = { url, method: "GET" };
    const data = await fetchJSON<AtsuChaptersResponse>(request);

    return parseChapterList(data, sourceManga, scanlatorMap);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const mangaId = chapter.sourceManga.mangaId;
    const chapterId = chapter.chapterId;

    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("read")
      .addPathComponent("chapter")
      .setQueryItem("mangaId", mangaId)
      .setQueryItem("chapterId", chapterId)
      .toString();

    const request: Request = { url, method: "GET" };
    const data = await fetchJSON<AtsuReadChapterResponse>(request);

    const pages = data.readChapter.pages
      .sort((a, b) => a.number - b.number)
      .map((page) => (page.image.startsWith("http") ? page.image : `${DOMAIN}${page.image}`));

    return {
      id: chapterId,
      mangaId: mangaId,
      pages: pages,
    };
  }
}
