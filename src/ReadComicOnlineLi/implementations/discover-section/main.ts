import {
  DiscoverSectionType,
  URL,
  type DiscoverSection,
  type DiscoverSectionItem,
  type PagedResults,
  type Request,
} from "@paperback/types";
import { fetchCheerio } from "../../services/network";
import { getDiscoverSectionOrder, getHiddenDiscoverSections } from "../settings-form/forms/main";
import { DOMAIN, type DiscoverSectionDefinition, type Metadata } from "../shared/models";
import { getDiscoverSectionDefinition } from "../shared/utils";
import { parseDesktopTabItems, parseDiscoverItems } from "./parsers";

export class DiscoverProvider {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    const hiddenSections = getHiddenDiscoverSections();

    return getDiscoverSectionOrder()
      .map((sectionId) => getDiscoverSectionDefinition(sectionId))
      .filter(
        (section): section is DiscoverSectionDefinition =>
          section !== undefined && !hiddenSections.includes(section.id),
      )
      .map((section) => ({
        id: section.id,
        title: section.title,
        type: DiscoverSectionType.simpleCarousel,
      }));
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: Metadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const definition = getDiscoverSectionDefinition(section.id);
    if (!definition) {
      throw new Error(`[ReadComicOnlineLi] Unknown discover section: ${section.id}`);
    }

    if (definition.source === "desktop-tab") {
      const request: Request = {
        url: DOMAIN,
        method: "GET",
        headers: {
          cookie: "dsk_ui=1",
        },
      };
      const $ = await fetchCheerio(request);

      return {
        items: parseDesktopTabItems($, definition.tabId),
        metadata: undefined,
      };
    }

    const page = metadata?.page ?? 1;
    const request: Request = {
      url: buildSectionUrl(definition.path, page),
      method: "GET",
    };
    const $ = await fetchCheerio(request);
    const items = parseDiscoverItems($);
    const hasMore = $("a.next_bt").length > 0;

    return {
      items,
      metadata: hasMore ? { page: page + 1 } : undefined,
    };
  }
}

function buildSectionUrl(path: string[], page: number): string {
  const url = new URL(DOMAIN);

  for (const segment of path) {
    url.addPathComponent(segment);
  }

  if (page > 1) {
    url.setQueryItem("page", String(page));
  }

  return url.toString();
}
