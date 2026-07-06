/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

import { API_URL, DOMAIN, type GraphQLResponse } from "./models";

export class AllMangaInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    const isApi = request.url.startsWith(API_URL);
    const isDocument = !isApi && request.url.startsWith(DOMAIN);
    const accept = isApi
      ? "application/json, text/plain, */*"
      : isDocument
        ? "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        : "image/avif,image/webp,image/apng,image/png,image/svg+xml,*/*;q=0.8";

    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        origin: DOMAIN,
        "user-agent": await Application.getDefaultUserAgent(),
        accept,
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
        url: request.url,
        method: request.method ?? "GET",
        headers: { "user-agent": await Application.getDefaultUserAgent() },
      });
    }
    return data;
  }
}

export default async function makeRequest<ResponseType>(
  query: string,
  variables: Record<string, unknown>,
): Promise<ResponseType> {
  const request: Request = {
    url: API_URL,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  };

  const [, buffer] = await Application.scheduleRequest(request);
  const data = Application.arrayBufferToUTF8String(buffer);
  const unknownResponse: unknown = JSON.parse(data);

  if (
    unknownResponse == undefined ||
    typeof unknownResponse !== "object" ||
    !("data" in unknownResponse || "errors" in unknownResponse)
  ) {
    throw new Error(`Failed to parse JSON object: ${String(unknownResponse)}`);
  }

  const response = unknownResponse as GraphQLResponse<ResponseType>;

  if (response.errors != undefined) {
    let errorMessages = "";
    for (let i = 0; i < response.errors.length; i++) {
      if (i != 0) {
        errorMessages += "\n";
      }

      errorMessages += `AllManga returned an error: ${response.errors[i].message}`;
    }

    throw new Error(errorMessages);
  }

  return response.data as ResponseType;
}
