/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Request, Response } from "@paperback/types";
import { CloudflareError, PaperbackInterceptor } from "@paperback/types";
import { DOMAIN, DOMAIN_API } from "../implementations/shared/models";
import type { QToonEncryptedResponse } from "../implementations/shared/models";
import { requestToken } from "../main";
import { getLanguage } from "../implementations/settings-form/main";
import { decryptResponse } from "../implementations/shared/utils";

export class QToonInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent(),
        ...(request.url.includes(DOMAIN_API) && {
          platform: "h5",
          lth: getLanguage(),
          did: requestToken,
        }),
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
        url: request.url,
        method: request.method ?? "GET",
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }

    return data;
  }
}

export async function fetchEncryptedJSON<T>(request: Request): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest(request);

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  const raw = Application.arrayBufferToUTF8String(buffer);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${request.url}: ${reason}`);
  }

  const envelope = parsed as QToonEncryptedResponse;
  if (envelope.code !== 0) {
    throw new Error(`QToon API error code ${envelope.code}: ${request.url}`);
  }

  const decrypted = await decryptResponse(envelope.data, envelope.ts, requestToken);

  try {
    return JSON.parse(decrypted) as T;
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse decrypted JSON from ${request.url}: ${reason}`);
  }
}
