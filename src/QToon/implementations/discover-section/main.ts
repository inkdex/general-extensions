/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { DiscoverSection, DiscoverSectionItem, PagedResults, Request } from "@paperback/types";
import { URL } from "@paperback/types";

import { fetchEncryptedJSON } from "../../services/network";
import { DOMAIN_API } from "../shared/models";
import type {
  DiscoverMetadata,
  QToonComicsList,
  QToonCompositionBlock,
  QToonCompositionPage,
} from "../shared/models";
import { extractEndpoint, parseCompositionBlocks, parseQToonComics } from "./parsers";

// fixed homepage composition ID from QToons API
const HOMEPAGE_PSID = "ps_ErZj1GjyOOOaAVI1gdDj";

function buildCompositionUrl(page: number): string {
  return new URL(DOMAIN_API)
    .addPathComponent("api")
    .addPathComponent("w")
    .addPathComponent("navigation")
    .addPathComponent("composition")
    .addPathComponent("page")
    .addPathComponent("detail")
    .setQueryItem("platform", "h5")
    .setQueryItem("psid", HOMEPAGE_PSID)
    .setQueryItem("page", String(page))
    .toString();
}

function buildPaginatedUrl(type: "ranking" | "album", id: string, page: number): string {
  if (type === "album") {
    return new URL(DOMAIN_API)
      .addPathComponent("api")
      .addPathComponent("w")
      .addPathComponent("album")
      .addPathComponent("page")
      .addPathComponent("comics")
      .setQueryItem("page", String(page))
      .setQueryItem("asid", id)
      .toString();
  }
  return new URL(DOMAIN_API)
    .addPathComponent("api")
    .addPathComponent("w")
    .addPathComponent("ranking")
    .addPathComponent("page")
    .addPathComponent("comics")
    .setQueryItem("page", String(page))
    .setQueryItem("rsid", id)
    .toString();
}

let cachedBlocks: QToonCompositionBlock[] | null = null;

export class DiscoverProvider {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const allBlocks: QToonCompositionBlock[] = [];
    let compositionPage = 1;
    let hasMore = true;

    while (hasMore) {
      const request: Request = { url: buildCompositionUrl(compositionPage), method: "GET" };
      const data = await fetchEncryptedJSON<QToonCompositionPage>(request);
      const blocks = data.blocks ?? [];
      allBlocks.push(...blocks);
      hasMore = (data.more ?? 0) > 0 && blocks.length > 0;
      compositionPage++;
    }

    cachedBlocks = allBlocks;
    return parseCompositionBlocks(cachedBlocks);
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: DiscoverMetadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    let endpointType = metadata?.endpointType;
    let endpointId = metadata?.endpointId;

    if (!endpointId) {
      const block = cachedBlocks?.find((b) => b.msid === section.id);

      if (!block) {
        return { items: [], metadata: undefined };
      }

      const endpoint = extractEndpoint(block);

      // return inline comics only
      if (!endpoint) {
        const items = parseQToonComics(block.comics ?? []);
        return { items, metadata: undefined };
      }

      endpointType = endpoint.type;
      endpointId = endpoint.id;
    }

    const url = buildPaginatedUrl(endpointType!, endpointId, page);
    const request: Request = { url, method: "GET" };
    const data = await fetchEncryptedJSON<QToonComicsList>(request);

    const items = parseQToonComics(data.comics ?? []);
    const hasMore = data.more === 1;

    return {
      items,
      metadata: hasMore ? { page: page + 1, endpointType: endpointType!, endpointId } : undefined,
    };
  }
}
