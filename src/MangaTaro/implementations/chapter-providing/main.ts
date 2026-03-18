import type { Chapter, ChapterDetails, Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN } from "../../main";
import { fetchJSON, fetchText } from "../../services/network";
import { extractNumericId, generateToken, parseMangaId } from "../shared/utils";
import type {
  MangaTaroChapter,
  MangaTaroChaptersResponse,
  MangaTaroChapterContentResponse,
} from "../shared/models";
import { parseChapterList } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const { slug, numericId: resolvedId } = parseMangaId(sourceManga.mangaId);
    let numericId = resolvedId;

    // slug-only mangaIds (from wp-json discover sections) have no numeric id. resolve by fetching the manga page
    if (!numericId || !/^\d+$/.test(numericId)) {
      const pageUrl = new URL(DOMAIN).addPathComponent("manga").addPathComponent(slug).toString();
      const html = await fetchText({ url: pageUrl, method: "GET" } as Request);
      const resolved = extractNumericId(html);
      if (!resolved) throw new Error(`Could not resolve numeric ID for manga: ${slug}`);
      numericId = resolved;
    }

    const LIMIT = 500; // API max per request
    const allChapters: MangaTaroChapter[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { token, timestamp } = generateToken();
      const url = new URL(DOMAIN)
        .addPathComponent("auth")
        .addPathComponent("manga-chapters")
        .setQueryItem("manga_id", numericId)
        .setQueryItem("offset", String(offset))
        .setQueryItem("limit", String(LIMIT))
        .setQueryItem("order", "DESC")
        .setQueryItem("_t", token)
        .setQueryItem("_ts", timestamp.toString())
        .toString();

      const request: Request = { url, method: "GET" };
      const data = await fetchJSON<MangaTaroChaptersResponse>(request);
      allChapters.push(...data.chapters);

      hasMore = data.has_more;
      offset += LIMIT;
    }

    return parseChapterList(allChapters, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const chapterId = chapter.chapterId;

    const url = new URL(DOMAIN)
      .addPathComponent("auth")
      .addPathComponent("chapter-content")
      .setQueryItem("chapter_id", chapterId)
      .toString();

    const request: Request = { url, method: "GET" };
    const data = await fetchJSON<MangaTaroChapterContentResponse>(request);

    return {
      id: chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages: data.images,
    };
  }
}
