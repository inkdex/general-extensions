/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
  type Tag,
} from "@paperback/types";

import { getDefaultGenres, getHideAdultContent } from "./forms/settings";
import {
  ADULT_EXCLUSIONS,
  API_URL,
  DOMAIN,
  PAGE_SIZE,
  type GenreListResponse,
  type NovelSource,
  type NovelSourceListResponse,
  type SourceChapter,
  type SourceChapterListResponse,
} from "./models";
import { parseGenreOptions, pickGenreValues } from "./parsers";

export class NovelArchiveInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    // The cover endpoint redirects only when the request accepts images.
    const isCover = /\/cover(\?|$)/.test(request.url);
    const isApi = request.url.startsWith(API_URL) && !isCover;
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent(),
        ...(isApi
          ? {
              origin: DOMAIN,
              accept: "application/json, text/plain, */*",
              "accept-language": "en-US,en;q=0.5",
            }
          : isCover
            ? { accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" }
            : {}),
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
      // JSON endpoints cannot display the browser challenge.
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

export const fetchJSON = async <T>(url: string): Promise<T> => {
  const [response, buffer] = await Application.scheduleRequest({ url, method: "GET" });
  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${url}`);
  }
  const data = Application.arrayBufferToUTF8String(buffer);
  try {
    return JSON.parse(data) as T;
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${url}: ${reason}`, { cause: error });
  }
};

export const novelsUrl = (...segments: string[]): string => {
  const url = new URL(API_URL).addPathComponent("novels");
  for (const segment of segments) url.addPathComponent(segment);
  return url.toString();
};

export const fetchGenres = async (): Promise<Tag[]> => {
  const data = await fetchJSON<GenreListResponse>(novelsUrl("genres"));
  return parseGenreOptions(data.genres);
};

export const fetchSources = async (novelId: string): Promise<NovelSource[]> => {
  const data = await fetchJSON<NovelSourceListResponse>(novelsUrl(novelId, "sources"));
  return data.sources;
};

export const fetchSourceChapters = async (
  novelId: string,
  sourceId: string,
): Promise<SourceChapter[]> => {
  const data = await fetchJSON<SourceChapterListResponse>(
    novelsUrl(novelId, "sources", sourceId, "chapters"),
  );
  return data.chapters;
};

export const buildNovelsUrl = (options: {
  page: number;
  search?: string;
  sort?: string;
  status?: string;
  genreMatch?: string;
  genresInclude?: string[];
  genresExclude?: string[];
}): string => {
  const url = new URL(API_URL)
    .addPathComponent("novels")
    .setQueryItem("page", options.page.toString())
    .setQueryItem("per_page", PAGE_SIZE.toString());

  if (options.search) {
    url.setQueryItem("search", options.search);
    url.setQueryItem("fuzzy", "1");
  }
  if (options.sort && options.sort !== "recent") url.setQueryItem("sort", options.sort);
  if (options.status && options.status !== "all") url.setQueryItem("status", options.status);
  if (options.genreMatch === "any") url.setQueryItem("genre_match", "any");

  const defaults = getDefaultGenres();
  const adultExcludes = getHideAdultContent() ? ADULT_EXCLUSIONS : [];
  const includes = (options.genresInclude ?? pickGenreValues(defaults, "included")).filter(
    (genre) => !adultExcludes.includes(genre.toLowerCase()),
  );
  const excludes = [
    ...new Set([
      ...(options.genresExclude ?? pickGenreValues(defaults, "excluded")),
      ...adultExcludes,
    ]),
  ];
  if (includes.length) url.setQueryItem("genres_include", includes.join(","));
  if (excludes.length) url.setQueryItem("genres_exclude", excludes.join(","));
  return url.toString();
};
