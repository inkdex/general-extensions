import type {
    Chapter,
    ChapterDetails,
    Request,
    SourceManga,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { QISCANS_API_BASE, QISCANS_DOMAIN } from "../../main";
import type { MangaProvider } from "../manga/main";
import type { QIScansChaptersResponse } from "../shared/models";
import { fetchJSON, fetchText } from "../shared/utils";
import { parseChapterDetails, parseChapterList } from "./parsers";

export class ChapterProvider {
    private mangaProvider: MangaProvider;

    constructor(mangaProvider: MangaProvider) {
        this.mangaProvider = mangaProvider;
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const mangaId = sourceManga.mangaId;

        // ensure postId
        if (!sourceManga.mangaInfo?.additionalInfo?.postId) {
            const updated = await this.mangaProvider.getMangaDetails(mangaId);
            sourceManga.mangaInfo = updated.mangaInfo;
        }

        const postId = sourceManga.mangaInfo?.additionalInfo?.postId;
        if (!postId) {
            throw new Error(`[QiScans] Missing postId for ${mangaId}`);
        }

        const url = new URL(QISCANS_API_BASE)
            .addPathComponent("chapters")
            .setQueryItem("postId", postId)
            .setQueryItem("skip", "0")
            .setQueryItem("take", "500")
            .setQueryItem("order", "desc")
            .setQueryItem("search", "")
            .toString();

        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<QIScansChaptersResponse>(request);

        return parseChapterList(json, sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const sourceManga = chapter.sourceManga;

        // check locked status
        if (chapter.title?.toLowerCase().includes("(locked)")) {
            throw new Error("This chapter is locked (premium/coins required).");
        }

        const shareUrl = sourceManga.mangaInfo?.shareUrl;
        if (!shareUrl) {
            throw new Error(
                `[QiScans] Missing shareUrl for ${sourceManga.mangaId}`,
            );
        }

        const seriesSlug = shareUrl.split("/").filter(Boolean).pop();
        const url = new URL(QISCANS_DOMAIN)
            .addPathComponent("series")
            .addPathComponent(seriesSlug!)
            .addPathComponent(chapter.chapterId)
            .toString();

        const html = await fetchText({ url, method: "GET" });

        return parseChapterDetails(html, chapter);
    }
}
