import type { Request, Response } from "@paperback/types";
import { CloudflareError, PaperbackInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";
import { DOMAIN } from "../implementations/shared/models";

const IMAGE_PROXY_PREFIX = `${DOMAIN}/__pb__/img/`;
const CHAPTER_PAGE_STATE_PREFIX = "readcomiconline:chapter-pages:";
const chapterPageCache = new Map<string, string[]>();

export class ReadComicOnlineInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
    const rewrittenUrl = resolveImageRequestUrl(request.url);

    return {
      ...request,
      url: rewrittenUrl,
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

export async function fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
  const [response, data] = await Application.scheduleRequest(request);

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  return cheerio.load(Application.arrayBufferToUTF8String(data), {
    xml: {
      xmlMode: false,
      decodeEntities: true,
    },
  });
}

export function createChapterPageUrls(
  mangaId: string,
  chapterId: string,
  pages: string[],
  cacheVariant?: string,
): string[] {
  const chapterKey = hashString([mangaId, chapterId, cacheVariant].filter(Boolean).join(":"));
  chapterPageCache.set(chapterKey, pages);
  Application.setState(JSON.stringify(pages), getChapterPageStateKey(chapterKey));

  return pages.map((_, index) => `${IMAGE_PROXY_PREFIX}${chapterKey}/${index + 1}.jpg`);
}

function resolveImageRequestUrl(url: string): string {
  if (!url.startsWith(IMAGE_PROXY_PREFIX)) {
    return url;
  }

  const imagePath = url.slice(IMAGE_PROXY_PREFIX.length);
  const [chapterKey, fileName] = imagePath.split("/");
  const pageNumber = Number(fileName?.replace(/\.[^.]+$/, ""));

  if (!chapterKey || !Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new Error(`Invalid proxied image URL: ${url}`);
  }

  const pages = getChapterPages(chapterKey);
  const resolvedUrl = pages?.[pageNumber - 1];
  if (!resolvedUrl) {
    throw new Error(`Missing cached image URL for ${url}`);
  }

  return resolvedUrl;
}

function getChapterPages(chapterKey: string): string[] | undefined {
  const cachedPages = chapterPageCache.get(chapterKey);
  if (cachedPages) {
    return cachedPages;
  }

  const rawPages = Application.getState(getChapterPageStateKey(chapterKey));
  if (typeof rawPages !== "string") {
    return undefined;
  }

  try {
    const parsedPages = JSON.parse(rawPages);
    if (!Array.isArray(parsedPages) || parsedPages.some((page) => typeof page !== "string")) {
      return undefined;
    }

    chapterPageCache.set(chapterKey, parsedPages);
    return parsedPages;
  } catch {
    return undefined;
  }
}

function getChapterPageStateKey(chapterKey: string): string {
  return `${CHAPTER_PAGE_STATE_PREFIX}${chapterKey}`;
}

function hashString(value: string): string {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
