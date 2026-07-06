/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

import { getBrokenCdnPrefixes } from "./forms/settings";
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

export async function fetchApi<T>(url: string): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest({
    url,
    method: "GET",
    headers: { accept: "application/json" },
  });
  const data = Application.arrayBufferToUTF8String(buffer);

  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${url} (HTTP ${response.status})`, {
      cause: error,
    });
  }

  if (response.status >= 400) {
    const message = (json as { message?: string }).message ?? `HTTP ${response.status}`;
    throw new Error(`MangaFire API error: ${message}`);
  }

  return json as T;
}
