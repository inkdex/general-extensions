/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";

import {
  API_URL,
  DOMAIN,
  MIRROR_HOSTS,
  PAGES_QUERY,
  type ChapterPageEdge,
  type GraphQLResponse,
  type PagesData,
  type SigningBootstrap,
} from "./models";
import {
  buildAaReq,
  BUILD_ID,
  decryptTobeParsed,
  deriveSigningKey,
  sha256Hex,
  TS_BUCKET_MS,
} from "./utils/crypto";

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

let cachedSigningBootstrap: SigningBootstrap | undefined;

export async function fetchChapterPagesViaApi(
  mangaId: string,
  chapterString: string,
): Promise<PagesData | undefined> {
  const bootstrap = await getSigningBootstrap();
  if (!bootstrap) return undefined;

  const key = await deriveSigningKey(bootstrap.partB);
  const queryHash = await sha256Hex(PAGES_QUERY);
  const aaReq = await buildAaReq(key, bootstrap.epoch, queryHash);

  const url = new URL(API_URL)
    .setQueryItem("query", PAGES_QUERY)
    .setQueryItem(
      "variables",
      JSON.stringify({
        mangaId,
        translationType: "sub",
        chapterString,
        limit: 10,
        offset: 0,
      }),
    )
    .setQueryItem(
      "extensions",
      JSON.stringify({ persistedQuery: { version: 1, sha256Hash: queryHash }, aaReq }),
    )
    .toString();

  const [response, buffer] = await Application.scheduleRequest({ url, method: "GET" });
  if (response.status !== 200) return undefined;

  const parsed = JSON.parse(Application.arrayBufferToUTF8String(buffer)) as {
    data?: { chapterPages?: PagesData["chapterPages"]; tobeparsed?: string } | null;
  };

  let chapterPages = parsed.data?.chapterPages ?? undefined;
  if (!chapterPages?.edges?.length && parsed.data?.tobeparsed) {
    const decrypted = (await decryptTobeParsed(parsed.data.tobeparsed, key)) as
      | { chapterPages?: PagesData["chapterPages"]; edges?: ChapterPageEdge[] }
      | undefined;
    chapterPages =
      decrypted?.chapterPages ?? (decrypted?.edges ? { edges: decrypted.edges } : undefined);
  }

  return chapterPages?.edges?.length ? { chapterPages } : undefined;
}

async function getSigningBootstrap(): Promise<SigningBootstrap | undefined> {
  const now = Date.now();
  if (cachedSigningBootstrap && cachedSigningBootstrap.switchAt > now) {
    return cachedSigningBootstrap;
  }

  for (const host of MIRROR_HOSTS) {
    let response: Response;
    let buffer: ArrayBuffer;
    try {
      [response, buffer] = await Application.scheduleRequest({
        url: `https://${host}/client-crypto/v1/bootstrap?buildId=${BUILD_ID}`,
        method: "GET",
      });
    } catch (error) {
      if (error instanceof CloudflareError) throw error;
      continue;
    }

    if (response.status !== 200) continue;

    const match = Application.arrayBufferToUTF8String(buffer).match(
      /window\.__aaCrypto\s*=\s*(\{.*?\})\s*;/,
    );
    if (!match?.[1]) continue;

    const json = JSON.parse(match[1]) as { epoch?: number; partB?: string; switchAt?: number };
    if (typeof json.epoch !== "number" || typeof json.partB !== "string") continue;

    cachedSigningBootstrap = {
      epoch: json.epoch,
      partB: json.partB,
      switchAt: typeof json.switchAt === "number" ? json.switchAt : now + TS_BUCKET_MS,
    };
    return cachedSigningBootstrap;
  }
  return undefined;
}
