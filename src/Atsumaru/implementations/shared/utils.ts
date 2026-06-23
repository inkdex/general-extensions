/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { getShowAdult } from "../settings-form-providing/main";
import { DOMAIN } from "./models";
import type { AtsuMangaPageResponse, AtsuSearchDocument } from "./models";

type ThumbnailSource = string | Pick<AtsuSearchDocument, "poster" | "posterMedium" | "posterSmall">;

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

export function buildThumbnailUrl(source?: ThumbnailSource): string {
  const imagePath =
    typeof source === "string"
      ? source
      : (source?.posterMedium ?? source?.posterSmall ?? source?.poster);
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${DOMAIN}${imagePath.startsWith("/") ? imagePath : `/static/${imagePath}`}`;
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
