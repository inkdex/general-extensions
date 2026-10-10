/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type Request,
  type Response,
} from "@paperback/types";

import { getHideAdultContent } from "./forms/settings";
import {
  ADULT_EXCLUSIONS,
  API_URL,
  DOMAIN,
  PAGE_SIZE,
  STATE_KEYS,
  type GenreListResponse,
  type GenreOption,
  type NovelSource,
  type NovelSourceListResponse,
  type SourceChapter,
  type SourceChapterListResponse,
  type TriState,
} from "./models";
import { pickGenreValues } from "./parsers";

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
      // API paths can't render the challenge; bounce to the site root so one
      // bypass clears the clearance cookie domain-wide.
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

export const fetchApi = async <T>(url: string): Promise<T> => {
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

export const novelsFeedUrl = (segment: string, limit?: number): string => {
  const url = new URL(novelsUrl(segment));
  if (limit !== undefined) url.setQueryItem("limit", limit.toString());
  return url.toString();
};

export const fetchGenres = async (): Promise<GenreOption[]> => {
  const data = await fetchApi<GenreListResponse>(novelsUrl("genres"));
  return data.genres;
};

export const fetchSources = async (novelId: string): Promise<NovelSource[]> => {
  const request = fetchApi<NovelSourceListResponse>(novelsUrl(novelId, "sources"));
  try {
    // /sources is optional and can hang ~30s before a 504; fall back to native chapters after 8s.
    const data = await Promise.race([request, Application.sleep(8).then(() => undefined)]);
    return data?.sources ?? [];
  } catch (error: unknown) {
    if (error instanceof CloudflareError) throw error;
    return [];
  }
};

export const fetchSourceChapters = async (
  novelId: string,
  sourceId: string,
): Promise<SourceChapter[]> => {
  try {
    const data = await fetchApi<SourceChapterListResponse>(
      novelsUrl(novelId, "sources", sourceId, "chapters"),
    );
    return data.chapters;
  } catch (error: unknown) {
    if (error instanceof CloudflareError) throw error;
    return [];
  }
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

  const defaults = (Application.getState(STATE_KEYS.DEFAULT_GENRES) as TriState | undefined) ?? {};
  const explicitIncludes = options.genresInclude ?? [];
  const explicitExcludes = options.genresExclude ?? [];
  const defaultIncludes = pickGenreValues(defaults, "included");
  const defaultExcludes = pickGenreValues(defaults, "excluded");
  const adultExcludes = getHideAdultContent() ? ADULT_EXCLUSIONS : [];

  const includes = [
    ...new Set([
      ...explicitIncludes.filter((genre) => !adultExcludes.includes(genre)),
      ...defaultIncludes.filter(
        (genre) => !explicitExcludes.includes(genre) && !adultExcludes.includes(genre),
      ),
    ]),
  ];
  if (includes.length > 0) url.setQueryItem("genres_include", includes.join(","));

  const excludes = [
    ...new Set(
      [
        ...explicitExcludes,
        ...defaultExcludes.filter((genre) => !explicitIncludes.includes(genre)),
        ...adultExcludes,
      ].filter(Boolean),
    ),
  ];
  if (excludes.length > 0) url.setQueryItem("genres_exclude", excludes.join(","));

  return url.toString();
};
