import { URL, type Request, type SourceManga } from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import type { WeebDexManga } from "../shared/models";
import { parseMangaDetails } from "./parsers";

export class MangaProvider {
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const url = new URL(WEEBDEX_API_DOMAIN)
      .addPathComponent("manga")
      .addPathComponent(mangaId)
      .toString();

    const request: Request = { url, method: "GET" };
    const json = await fetchJSON<WeebDexManga>(request);

    return parseMangaDetails(json, mangaId);
  }
}
