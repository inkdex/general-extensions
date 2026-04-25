/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";

import { fetchEncryptedJSON } from "../../services/network";
import { DOMAIN_API } from "../shared/models";
import type { QToonComicDetailsResponse } from "../shared/models";
import { parseQToonMangaDetails } from "./parsers";

export class MangaProvider {
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const url = new URL(DOMAIN_API)
      .addPathComponent("api")
      .addPathComponent("w")
      .addPathComponent("comic")
      .addPathComponent("detail")
      .setQueryItem("csid", mangaId)
      .toString();

    const request: Request = { url, method: "GET" };
    const data = await fetchEncryptedJSON<QToonComicDetailsResponse>(request);

    return parseQToonMangaDetails(data.comic, mangaId);
  }
}
