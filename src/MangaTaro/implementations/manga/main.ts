import type { Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN } from "../shared/models";
import { fetchText } from "../../services/network";
import { parseMangaId } from "../shared/utils";
import { parseMangaDetails } from "./parsers";

export class MangaProvider {
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const slug = parseMangaId(mangaId).slug;

    const url = new URL(DOMAIN).addPathComponent("manga").addPathComponent(slug).toString();

    const request: Request = { url, method: "GET" };
    const html = await fetchText(request);

    return parseMangaDetails(html, mangaId);
  }
}
