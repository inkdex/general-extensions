/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { URL, type Response } from "@paperback/types";
import { DOMAIN } from "./models";

interface Query {
  key: string;
  value: string | string[];
}

export async function fetchHomepage(): Promise<[Response, ArrayBuffer]> {
  const request = {
    url: new URL(DOMAIN).toString(),
    method: "GET",
  };
  return await Application.scheduleRequest(request);
}

export async function fetchMangaDetailsPage(mangaId: string): Promise<[Response, ArrayBuffer]> {
  const request = {
    url: new URL(DOMAIN).addPathComponent("manga").addPathComponent(mangaId).toString(),
    method: "GET",
  };
  return await Application.scheduleRequest(request);
}

export async function fetchChapterDetailsPage(chapterId: string): Promise<[Response, ArrayBuffer]> {
  const request = {
    url: new URL(DOMAIN).addPathComponent("chapters").addPathComponent(chapterId).toString(),
    method: "GET",
  };
  return await Application.scheduleRequest(request);
}

export async function fetchSearchPage(
  paths: Array<string>,
  queries: Array<Query>,
): Promise<[Response, ArrayBuffer]> {
  const urlBuilder = new URL(DOMAIN).addPathComponent("search");
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
