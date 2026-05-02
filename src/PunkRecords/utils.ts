/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { Request } from "@paperback/types";

const DOMAIN = "https://punkrecordz.com";
const API_DOMAIN = "https://api.punkrecordz.com";
const MANGA_PATH = `${DOMAIN}/mangas`;

export { API_DOMAIN, DOMAIN, MANGA_PATH };

export async function fetchText(request: Request): Promise<string> {
  const [response, data] = await Application.scheduleRequest(request);
  if (response.status >= 400) {
    throw new Error(`Request failed with status ${response.status} for ${request.url}`);
  }

  return Application.arrayBufferToUTF8String(data);
}

export function toAbsoluteImage(thumb: string): string {
  return `${API_DOMAIN}/images/webp/${thumb}.webp`;
}

export function toMangaUrl(mangaId: string): string {
  return `${MANGA_PATH}/${mangaId}`;
}

export function toChapterUrl(mangaId: string, chapterId: string): string {
  return `${MANGA_PATH}/${mangaId}/${chapterId}`;
}
