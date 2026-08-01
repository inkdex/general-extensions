/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Request, Response } from "@paperback/types";
import { CloudflareError, PaperbackInterceptor, URL } from "@paperback/types";

import { getShowAdult } from "../implementations/settings-form-providing/main";
import { DOMAIN, HOME_PAGE_SIZE } from "../implementations/shared/models";
import type {
  AtsuInfiniteResponse,
  AtsuMangaItem,
  HomeEndpoint,
  HomeTimeframe,
} from "../implementations/shared/models";

export class AtsuInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
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

export async function fetchJSON<T>(request: Request): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest(request);

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  const data = Application.arrayBufferToUTF8String(buffer);

  try {
    return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${request.url}: ${reason}`);
  }
}

export async function fetchText(request: Request): Promise<string> {
  const [response, buffer] = await Application.scheduleRequest(request);

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  const data = Application.arrayBufferToUTF8String(buffer);
  return typeof data === "string" ? data : String(data);
}

export const fetchHomeItems = async (
  endpoint: HomeEndpoint,
  page: number,
  options: { genre?: string; timeframe?: HomeTimeframe } = {},
): Promise<AtsuMangaItem[]> => {
  const url = new URL(DOMAIN)
    .addPathComponent("api")
    .addPathComponent("home2")
    .addPathComponent(endpoint)
    .setQueryItem("offset", String(page * HOME_PAGE_SIZE))
    .setQueryItem("limit", String(HOME_PAGE_SIZE));

  if (options.genre) url.setQueryItem("genre", options.genre);
  if (options.timeframe) url.setQueryItem("timeframe", options.timeframe);
  if (getShowAdult()) url.setQueryItem("adult", "1");

  const request: Request = { url: url.toString(), method: "GET" };
  return (await fetchJSON<AtsuInfiniteResponse>(request)).items;
};
