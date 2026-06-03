/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";

import { RR_DOMAIN } from "./models";

export class RoyalRoadInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${RR_DOMAIN}/`,
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
    if (response.status === 403 || response.status === 503 || cfMitigated === "challenge") {
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

async function fetchPage(url: string): Promise<[Response, ArrayBuffer]> {
  return await Application.scheduleRequest({ url, method: "GET" });
}

export async function fetchListingPage(
  listingId: string,
  page: number,
): Promise<[Response, ArrayBuffer]> {
  return await fetchPage(`${RR_DOMAIN}/fictions/${listingId}?page=${page}`);
}

export async function fetchMangaDetailsPage(mangaId: string): Promise<[Response, ArrayBuffer]> {
  return await fetchPage(`${RR_DOMAIN}/fiction/${mangaId}`);
}

export async function fetchChapterPage(chapterId: string): Promise<[Response, ArrayBuffer]> {
  return await fetchPage(`${RR_DOMAIN}/${chapterId}`);
}

export interface SearchParams {
  title: string;
  author?: string;
  orderBy: string;
  ascending?: boolean;
  status?: string;
  type?: string;
  tagsAdd: string[];
  tagsRemove: string[];
  contentWarnings: string[];
  page: number;
}

export async function fetchSearchPage(params: SearchParams): Promise<[Response, ArrayBuffer]> {
  // `globalFilters=false` keeps the user's global content filters from
  // overriding the explicit selections made in the advanced search form.
  const qs: string[] = [
    "globalFilters=false",
    `page=${params.page}`,
    `orderBy=${encodeURIComponent(params.orderBy)}`,
    `dir=${params.ascending ? "asc" : "desc"}`,
  ];
  if (params.title) {
    qs.push(`title=${encodeURIComponent(params.title)}`);
  }
  if (params.author) {
    qs.push(`author=${encodeURIComponent(params.author)}`);
  }
  if (params.status && params.status !== "ALL") {
    qs.push(`status=${encodeURIComponent(params.status)}`);
  }
  if (params.type && params.type !== "ALL") {
    qs.push(`type=${encodeURIComponent(params.type)}`);
  }
  for (const tag of params.tagsAdd) {
    qs.push(`tagsAdd=${encodeURIComponent(tag)}`);
  }
  for (const tag of params.tagsRemove) {
    qs.push(`tagsRemove=${encodeURIComponent(tag)}`);
  }
  for (const warning of params.contentWarnings) {
    qs.push(`content_warning=${encodeURIComponent(warning)}`);
  }
  return await fetchPage(`${RR_DOMAIN}/fictions/search?${qs.join("&")}`);
}
