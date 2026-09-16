/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { AtsuMedium, DOMAIN_CDN } from "./models";
import type { AtsuComicType, AtsuContentType, AtsuSearchDocument } from "./models";

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
  return `${DOMAIN_CDN}${imagePath.startsWith("/") ? imagePath : `/static/${imagePath}`}`;
}

export function getContentTypeLabel(item: { medium: AtsuMedium; type: string }): string {
  if (item.medium === AtsuMedium.Novel) return "Novel";
  return item.type === "Manwha" ? "Manhwa" : item.type;
}

export function splitContentTypes(contentTypes: readonly AtsuContentType[]): {
  comicTypes: AtsuComicType[];
  includesNovels: boolean;
} {
  return {
    comicTypes: contentTypes.filter(
      (contentType): contentType is AtsuComicType => contentType !== AtsuMedium.Novel,
    ),
    includesNovels: contentTypes.includes(AtsuMedium.Novel),
  };
}
