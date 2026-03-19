import type { Chapter, ChapterDetails, Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN_API } from "../shared/models";
import { requestToken } from "../../main";
import { fetchEncryptedJSON } from "../../services/network";
import { decryptImageUrl } from "../shared/utils";
import type {
  QToonComicDetailsResponse,
  QToonEpisodeResources,
  QToonEpisodeResponse,
} from "../shared/models";
import { parseQToonEpisodes } from "./parsers";

export class ChapterProvider {
  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const url = new URL(DOMAIN_API)
      .addPathComponent("api")
      .addPathComponent("w")
      .addPathComponent("comic")
      .addPathComponent("detail")
      .setQueryItem("csid", sourceManga.mangaId)
      .toString();

    const request: Request = { url, method: "GET" };
    const data = await fetchEncryptedJSON<QToonComicDetailsResponse>(request);

    return parseQToonEpisodes(data.episodes ?? [], sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const episodeUrl = new URL(DOMAIN_API)
      .addPathComponent("api")
      .addPathComponent("w")
      .addPathComponent("comic")
      .addPathComponent("episode")
      .addPathComponent("detail")
      .setQueryItem("esid", chapter.chapterId)
      .toString();

    const episodeRequest: Request = { url: episodeUrl, method: "GET" };
    const episodeData = await fetchEncryptedJSON<QToonEpisodeResponse>(episodeRequest);

    const token = episodeData.definitions?.[0]?.token;
    if (!token) {
      throw new Error(`No resource token found for episode: ${chapter.chapterId}`);
    }

    const allPages: { url: string; idx: number }[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const resourceUrl = new URL(DOMAIN_API)
        .addPathComponent("api")
        .addPathComponent("w")
        .addPathComponent("resource")
        .addPathComponent("group")
        .addPathComponent("rslv")
        .setQueryItem("token", token)
        .setQueryItem("page", String(page))
        .toString();

      const resourceRequest: Request = { url: resourceUrl, method: "GET" };
      const resourceData = await fetchEncryptedJSON<QToonEpisodeResources>(resourceRequest);

      for (const resource of resourceData.resources ?? []) {
        allPages.push({
          url: await decryptImageUrl(resource.url, requestToken),
          idx: resource.rgIdx,
        });
      }

      hasMore = resourceData.more === 1;
      page++;
    }

    // sort by rgIdx to ensure correct page order
    allPages.sort((a, b) => a.idx - b.idx);

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages: allPages.map((p) => p.url),
    };
  }
}
