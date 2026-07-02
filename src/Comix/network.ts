/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";

import { DOMAIN } from "./models";
import { decryptImage, readEncHeaders } from "./utils/decryptImage";
import { descrambleImage, readScrambleHeaders } from "./utils/descramble";

export class ComixInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
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
    if (response.headers?.["cf-mitigated"] === "challenge") {
      throw new CloudflareError({
        url: DOMAIN,
        method: "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }

    // Page images are tile-shuffled (X-Scramble-*) or byte-XOR'd (X-Enc-*) — the
    // site mixes both. Key off headers (a scrambled prefix defeats mime-sniffing).
    const scrambleParams = readScrambleHeaders(response.headers);
    if (scrambleParams) {
      try {
        return await descrambleImage(data, scrambleParams, response.mimeType ?? "image/webp");
      } catch (error) {
        console.log(
          `[Comix] descramble failed for ${request.url} (algo=${scrambleParams.algo} seed=${scrambleParams.seed}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return data;
      }
    }

    const encParams = readEncHeaders(response.headers);
    if (encParams) {
      try {
        return decryptImage(data, encParams);
      } catch (error) {
        console.log(
          `[Comix] image decrypt failed for ${request.url}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        return data;
      }
    }

    return data;
  }
}

export async function fetchText(url: string): Promise<string> {
  const [, buffer] = await Application.scheduleRequest({ url, method: "GET" });
  return Application.arrayBufferToUTF8String(buffer);
}

export function browseUrl(query: Record<string, string | string[]>): string {
  const url = new URL(DOMAIN).addPathComponent("browse");
  for (const [key, value] of Object.entries(query)) {
    url.setQueryItem(key, value);
  }
  return url.toString();
}
