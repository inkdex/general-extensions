import type { Request, SourceManga } from "@paperback/types";
import { QISCANS_API_BASE } from "../../main";
import type { QIScansPost } from "../shared/models";
import { fetchJSON } from "../shared/utils";
import { parseMangaDetails } from "./parsers";

export class MangaProvider {
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        const url = `${QISCANS_API_BASE}/v2/posts/${mangaId}`;
        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<QIScansPost>(request);

        return parseMangaDetails(json);
    }
}
