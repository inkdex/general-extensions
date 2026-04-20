/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Request, SourceManga } from "@paperback/types";
import { URL } from "@paperback/types";
import { DOMAIN_API } from "../shared/models";
import type { QIScansSeriesDetailsResponse } from "../shared/models";
import { fetchJSON } from "../../services/network";
import { decodeMangaId } from "../shared/utils";
import { parseMangaDetails } from "./parsers";

export class MangaProvider {
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const slug = decodeMangaId(mangaId);
    const url = new URL(DOMAIN_API)
      .addPathComponent("v1")
      .addPathComponent("series")
      .addPathComponent(slug)
      .toString();
    const request: Request = { url, method: "GET" };
    const data = await fetchJSON<QIScansSeriesDetailsResponse>(request);

    return parseMangaDetails(data);
  }
}
