/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Chapter, ChapterDetails, Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { MangaProvider } from "../manga/main";
import { DOMAIN_API } from "../shared/models";
import type {
  QIScansSeriesChapter,
  QIScansSeriesChapterDetailsResponse,
  QIScansSeriesChaptersResponse,
} from "../shared/models";
import { decodeMangaId } from "../shared/utils";
import { parseChapterDetails, parseChapterList } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaId = sourceManga.mangaId;

    if (!sourceManga.mangaInfo?.additionalInfo?.slug) {
      const mangaProvider = new MangaProvider();
      const updated = await mangaProvider.getMangaDetails(mangaId);
      sourceManga.mangaInfo = updated.mangaInfo;
    }

    const slug = sourceManga.mangaInfo?.additionalInfo?.slug ?? decodeMangaId(sourceManga.mangaId);
    if (!slug) {
      throw new Error(`Missing slug for ${mangaId}`);
    }

    const chapters: QIScansSeriesChapter[] = [];
    let page = 1;

    while (true) {
      const url = new URL(DOMAIN_API)
        .addPathComponent("v1")
        .addPathComponent("series")
        .addPathComponent(slug)
        .addPathComponent("chapters")
        .setQueryItem("page", page.toString())
        .setQueryItem("perPage", "30")
        .setQueryItem("sort", "desc")
        .toString();

      const request: Request = { url, method: "GET" };
      const data = await fetchJSON<QIScansSeriesChaptersResponse>(request);
      chapters.push(...(data.data ?? []));

      if (!data.next || page >= data.totalPages) {
        break;
      }

      page = data.next;
    }

    return parseChapterList(chapters, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const sourceManga = chapter.sourceManga;
    const seriesSlug =
      sourceManga.mangaInfo?.additionalInfo?.slug ?? decodeMangaId(sourceManga.mangaId);
    const url = new URL(DOMAIN_API)
      .addPathComponent("v1")
      .addPathComponent("series")
      .addPathComponent(seriesSlug)
      .addPathComponent("chapters")
      .addPathComponent(chapter.chapterId)
      .toString();

    const request: Request = { url, method: "GET" };
    const data = await fetchJSON<QIScansSeriesChapterDetailsResponse>(request);

    return parseChapterDetails(data, chapter);
  }
}
