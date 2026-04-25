/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { DiscoverSection, DiscoverSectionItem, PagedResults, Request } from "@paperback/types";
import { DiscoverSectionType, URL } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { DOMAIN_API } from "../shared/models";
import type { QIScansHomeResponse } from "../shared/models";
import { parseDiscoverItems } from "./parsers";

export class DiscoverProvider {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return [
      {
        id: "featured",
        title: "Featured",
        type: DiscoverSectionType.prominentCarousel,
      },
      {
        id: "popular",
        title: "Popular Today",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: "pinned",
        title: "Pinned",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: "new",
        title: "New Series",
        type: DiscoverSectionType.chapterUpdates,
      },
      {
        id: "editors-pick",
        title: "Editor's Pick",
        type: DiscoverSectionType.simpleCarousel,
      },
    ];
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    _metadata?: { page?: number },
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const url = new URL(DOMAIN_API).addPathComponent("v1").addPathComponent("home").toString();
    const request: Request = { url, method: "GET" };
    const data = await fetchJSON<QIScansHomeResponse>(request);
    const items = parseDiscoverItems(data, section.id);

    return {
      items,
      metadata: undefined,
    };
  }
}
