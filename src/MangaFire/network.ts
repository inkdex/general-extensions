/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

import { getBrokenCdnPrefixes } from "./forms";
import { CDN_HOST_REGEX, CDN_PREFIXES, DOMAIN } from "./models";

export class MangaFireInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
    let url = request.url;
    const match = url.match(CDN_HOST_REGEX);
    if (match) {
      const broken = getBrokenCdnPrefixes();
      if (broken.includes(match[2])) {
        const working = CDN_PREFIXES.find((p) => !broken.includes(p));
        if (working) {
          url = url.replace(CDN_HOST_REGEX, `$1${working}$3`);
        }
      }
    }

    return {
      ...request,
      url,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent(),
      },
    };
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: `${DOMAIN}/`,
        method: request.method ?? "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }

    return data;
  }
}
