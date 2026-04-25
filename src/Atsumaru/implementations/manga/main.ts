/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";

import { DOMAIN } from "../../main";
import { fetchText } from "../../services/network";
import { parseMangaDetails } from "./parsers";

export class MangaProvider {
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const url = new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString();

    const request: Request = { url, method: "GET" };
    const html = await fetchText(request);

    return parseMangaDetails(html, mangaId);
  }
}
