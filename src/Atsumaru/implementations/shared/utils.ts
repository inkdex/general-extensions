/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";
import { DOMAIN } from "../../main";
import { getShowAdult } from "../settings-form/main";
import type { AtsuMangaPageResponse } from "./models";

export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      );
    });
  });
}

export function buildThumbnailUrl(path: string): string {
  return `${DOMAIN}/static/${path}`;
}

export function getContentRating(): ContentRating {
  return getShowAdult() ? ContentRating.ADULT : ContentRating.EVERYONE;
}

export function parseMangaPage(html: string): AtsuMangaPageResponse["mangaPage"] {
  const match = html.match(/window\.mangaPage\s*=\s*({[\s\S]*?});/);
  if (!match) {
    throw new Error("Could not find manga data in page");
  }
  return (JSON.parse(match[1]) as AtsuMangaPageResponse).mangaPage;
}
