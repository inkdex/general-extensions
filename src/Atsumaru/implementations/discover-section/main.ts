import type { DiscoverSection, DiscoverSectionItem, PagedResults, Request } from "@paperback/types";
import { ContentRating, URL } from "@paperback/types";
import { ATSUMARU_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import { getShowAdult } from "../settings-form/main";
import type { AtsuHomePageResponse, AtsuInfiniteResponse } from "../shared/models";
import { parseDiscoverItems, parseDiscoverSections } from "./parsers";

export class DiscoverProvider {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const showAdult = getShowAdult();
    const url = new URL(ATSUMARU_DOMAIN)
      .addPathComponent("api")
      .addPathComponent("home")
      .addPathComponent("page");
    if (showAdult) url.setQueryItem("adult", "1");

    const request: Request = { url: url.toString(), method: "GET" };
    const json = await fetchJSON<AtsuHomePageResponse>(request);

    return parseDiscoverSections(json);
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: { page?: number },
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const showAdult = getShowAdult();

    // top-rated uses home page, no pagination
    if (section.id === "top-rated") {
      const url = new URL(ATSUMARU_DOMAIN)
        .addPathComponent("api")
        .addPathComponent("home")
        .addPathComponent("page");
      if (showAdult) url.setQueryItem("adult", "1");

      const request: Request = { url: url.toString(), method: "GET" };
      const json = await fetchJSON<AtsuHomePageResponse>(request);

      const items = parseDiscoverItems(json, section.id);
      return { items, metadata: undefined };
    }

    // rest of sections use infinite endpoints
    const page = metadata?.page ?? 0;

    const endpointMap: Record<string, string> = {
      "trending-carousel": "trending",
      "most-bookmarked": "mostBookmarked",
      "recently-updated": "recentlyUpdated",
      popular: "popular",
      "recently-added": "recentlyAdded",
    };

    const endpoint = endpointMap[section.id];
    if (!endpoint) {
      throw new Error(`Unknown section: ${section.id}`);
    }

    const url = new URL(ATSUMARU_DOMAIN)
      .addPathComponent("api")
      .addPathComponent("infinite")
      .addPathComponent(endpoint)
      .setQueryItem("page", page.toString())
      .setQueryItem("types", "Manga,Manwha,Manhua");
    if (showAdult) url.setQueryItem("adult", "1");

    const request: Request = { url: url.toString(), method: "GET" };
    const json = await fetchJSON<AtsuInfiniteResponse>(request);

    const items = json.items.map((item) => ({
      type: "simpleCarouselItem" as const,
      mangaId: item.id,
      title: item.title,
      imageUrl: `${ATSUMARU_DOMAIN}/static/${item.image}`,
      subtitle: item.type,
      contentRating: showAdult ? ContentRating.ADULT : ContentRating.EVERYONE,
    }));

    return {
      items,
      metadata: items.length > 0 ? { page: page + 1 } : undefined,
    };
  }
}
