/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { DiscoverSection, DiscoverSectionItem } from "@paperback/types";
import { DiscoverSectionType } from "@paperback/types";
import type { AtsuHomePageResponse } from "../shared/models";
import { buildThumbnailUrl, getContentRating } from "../shared/utils";

export function parseDiscoverSections(json: AtsuHomePageResponse): DiscoverSection[] {
  const sections = json.homePage.sections;

  // filter for carousel sections only and map
  return sections
    .filter((section) => section.layout === "carousel" && section.key !== "hot-updates")
    .map((section) => ({
      id: section.key,
      title: section.title || "Unknown",
      type: DiscoverSectionType.simpleCarousel,
    }));
}

export function parseDiscoverItems(
  json: AtsuHomePageResponse,
  sectionId: string,
): DiscoverSectionItem[] {
  const sections = json.homePage.sections;

  // find the section matching the sectionId
  const section = sections.find((s) => s.key === sectionId);

  if (!section || !section.items) {
    return [];
  }

  return section.items.map((item) => ({
    type: "simpleCarouselItem" as const,
    mangaId: item.id,
    title: item.title,
    imageUrl: buildThumbnailUrl(item.image),
    subtitle: item.type,
    contentRating: getContentRating(),
  }));
}
