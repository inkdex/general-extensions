/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Chapter, ChapterDetails, Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";

import { DOMAIN } from "../../main";
import { fetchJSON, fetchText } from "../../services/network";
import type { AtsuChaptersResponse, AtsuReadChapterResponse } from "../shared/models";
import { parseMangaPage } from "../shared/utils";
import { parseChapterList } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId;

    const pageUrl = new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString();
    const pageRequest: Request = { url: pageUrl, method: "GET" };
    const html = await fetchText(pageRequest);
    const mangaPage = parseMangaPage(html);
    const scanlatorMap = new Map((mangaPage?.scanlators ?? []).map((s) => [s.id, s.name]));

    const url = new URL(DOMAIN)
      .addPathComponent("api")
      .addPathComponent("manga")
      .addPathComponent("allChapters")
      .setQueryItem("mangaId", mangaId)
      .toString();

    const request: Request = { url, method: "GET" };
    const json = await fetchJSON<AtsuChaptersResponse>(request);

    json.chapters.sort((a, b) => b.number - a.number || b.createdAt - a.createdAt);

    return parseChapterList(json, sourceManga, scanlatorMap);
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
    const json = await fetchJSON<AtsuReadChapterResponse>(request);

    const pages = json.readChapter.pages
      .sort((a, b) => a.number - b.number)
      .map((page) => (page.image.startsWith("http") ? page.image : `${DOMAIN}${page.image}`));

    return {
      id: chapterId,
      mangaId: mangaId,
      pages: pages,
    };
  }
}
