/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  CloudflareError,
  PaperbackInterceptor,
  URL,
  type PagedResults,
  type Request,
  type Response,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type Tag,
} from "@paperback/types";

import {
  API_URL,
  DOMAIN,
  PAGE_SIZE,
  type HiveToonsGenre,
  type HiveToonsPostDetailsResponse,
  type HiveToonsSearchResponse,
  type SearchMetadata,
} from "./models";
import { decodeMangaId, encodeMangaId, normalizeSearchTerm, parseMangaDetails } from "./parsers";

const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|webp|gif|avif|bmp|svg)(\?|#|$)/i;

export class HiveToonsInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    const accept = IMAGE_EXTENSION_REGEX.test(request.url)
      ? "image/avif,image/webp,image/apng,image/png,image/svg+xml,*/*;q=0.8"
      : "application/json, text/plain, */*";

    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        origin: DOMAIN,
        "user-agent": await Application.getDefaultUserAgent(),
        accept,
        "accept-language": "en-US,en;q=0.5",
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
        headers: {
          "user-agent": await Application.getDefaultUserAgent(),
        },
      });
    }

    return data;
  }
}

export const fetchJSON = async <T>(request: Request): Promise<T> => {
  const [response, buffer] = await Application.scheduleRequest(request);

  if (response.status === 404) {
    throw new Error(`Content not found: ${request.url}`);
  }
  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  const data = Application.arrayBufferToUTF8String(buffer);

  try {
    return JSON.parse(data) as T;
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${request.url}: ${reason}`, { cause: error });
  }
};

export const fetchGenres = async (): Promise<Tag[]> => {
  const url = new URL(API_URL).addPathComponent("genres").toString();
  const genres = await fetchJSON<HiveToonsGenre[]>({ url, method: "GET" });
  return genres.map((genre) => ({ id: genre.id.toString(), title: genre.name.trim() }));
};

export const fetchSearchPage = async (
  query: SearchQuery<SearchMetadata>,
  sortingOption: SortingOption | undefined,
  page: number,
): Promise<HiveToonsSearchResponse> => {
  const term = normalizeSearchTerm(query.title ?? "");
  const builder = new URL(API_URL)
    .addPathComponent("query")
    .setQueryItem("page", page.toString())
    .setQueryItem("perPage", PAGE_SIZE.toString());

  if (term) builder.setQueryItem("searchTerm", term);
  if (sortingOption?.id) builder.setQueryItem("orderBy", sortingOption.id);

  const meta = query.metadata;
  if (meta?.status?.[0]) builder.setQueryItem("seriesStatus", meta.status[0]);
  if (meta?.type?.[0]) builder.setQueryItem("seriesType", meta.type[0]);
  if (meta?.direction?.[0]) builder.setQueryItem("orderDirection", meta.direction[0]);

  const genres = Object.entries(meta?.genres ?? {});
  const includeIds = genres.filter(([, state]) => state === "included").map(([id]) => id);
  const excludeIds = genres.filter(([, state]) => state === "excluded").map(([id]) => id);

  if (includeIds.length > 0) builder.setQueryItem("genreIds", includeIds.join(","));
  if (excludeIds.length > 0) builder.setQueryItem("excludedGenreIds", excludeIds.join(","));

  return fetchJSON<HiveToonsSearchResponse>({ url: builder.toString(), method: "GET" });
};

export const fetchPostDetails = async (mangaId: string): Promise<HiveToonsPostDetailsResponse> => {
  const slug = decodeMangaId(mangaId);
  const url = new URL(API_URL).addPathComponent("post").setQueryItem("postSlug", slug).toString();
  return fetchJSON<HiveToonsPostDetailsResponse>({ url, method: "GET" });
};

export const resolveUrlQuery = async (
  query: string,
): Promise<PagedResults<SearchResultItem> | undefined> => {
  const match = query.trim().match(/^https?:\/\/(?:www\.)?hivetoons\.org\/series\/([^/?#]+)/i);
  const slug = match?.[1];
  if (!slug) return undefined;

  try {
    const manga = parseMangaDetails((await fetchPostDetails(encodeMangaId(slug))).post);
    return {
      items: [
        {
          mangaId: manga.mangaId,
          title: manga.mangaInfo.primaryTitle,
          imageUrl: manga.mangaInfo.thumbnailUrl,
          contentRating: manga.mangaInfo.contentRating,
        },
      ],
    };
  } catch {
    return undefined;
  }
};
