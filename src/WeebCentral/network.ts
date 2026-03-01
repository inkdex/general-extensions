import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
  URL,
} from "@paperback/types";
import { WC_DOMAIN } from "./models";

export class WeebCentralInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referrer: `${WC_DOMAIN}/`,
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
      });
    }

    return data;
  }
}

export interface Query {
  key: string;
  value: string | string[];
}

export async function fetchHomepage(): Promise<[Response, ArrayBuffer]> {
  return await Application.scheduleRequest({
    url: new URL(WC_DOMAIN).toString(),
    method: "GET",
  });
}

export async function fetchMangaDetailsPage(mangaId: string): Promise<[Response, ArrayBuffer]> {
  const request = {
    url: new URL(WC_DOMAIN).addPathComponent("series").addPathComponent(mangaId).toString(),
    method: "GET",
  };

  return await Application.scheduleRequest(request);
}

export async function fetchChaptersPage(mangaId: string): Promise<[Response, ArrayBuffer]> {
  const request = {
    url: new URL(WC_DOMAIN)
      .addPathComponent("series")
      .addPathComponent(mangaId)
      .addPathComponent("full-chapter-list")
      .toString(),
    method: "GET",
  };
  return await Application.scheduleRequest(request);
}

export async function fetchChapterDetailsPage(chapterId: string): Promise<[Response, ArrayBuffer]> {
  const request = {
    url: new URL(WC_DOMAIN)
      .addPathComponent("chapters")
      .addPathComponent(chapterId)
      .addPathComponent("images")
      .setQueryItem("reading_style", "long_strip")
      .toString(),
    method: "GET",
  };

  return await Application.scheduleRequest(request);
}

export async function fetchSearchPage(
  paths: Array<string>,
  queries: Array<Query>,
): Promise<[Response, ArrayBuffer]> {
  const urlBuilder = new URL(WC_DOMAIN).addPathComponent("search");
  for (const path of paths) {
    urlBuilder.addPathComponent(path);
  }

  for (const query of queries) {
    urlBuilder.setQueryItem(query.key, query.value);
  }

  const request = {
    url: urlBuilder.toString(),
    method: "GET",
  };

  return await Application.scheduleRequest(request);
}

export async function fetchRecentViewMorePage(page: number): Promise<[Response, ArrayBuffer]> {
  const request = {
    url: new URL(WC_DOMAIN)
      .addPathComponent("latest-updates")
      .addPathComponent(page.toString())
      .toString(),
    method: "GET",
  };

  return await Application.scheduleRequest(request);
}
