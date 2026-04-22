import type { DiscoverSectionItem } from "@paperback/types";
import type { CheerioAPI } from "cheerio";
import { DOMAIN } from "../shared/models";

export function parseDiscoverItems($: CheerioAPI): DiscoverSectionItem[] {
  const items: DiscoverSectionItem[] = [];

  $("div.item-list div.section.group.list").each((_, element) => {
    const cover = $("div.col.cover", element);
    const info = $("div.col.info", element);

    const href = $("a", cover).attr("href") ?? "";
    const img = $("img", cover);
    const title = $("a", info).first().text().trim();
    const subtitle = info.find("p").eq(1).text().trim();
    const imageUrl = img.attr("src") ?? "";
    const mangaId = extractMangaId(href);

    if (!mangaId || !title) {
      return;
    }

    items.push({
      type: "simpleCarouselItem" as const,
      mangaId,
      title: Application.decodeHTMLEntities(title),
      imageUrl: resolveImageUrl(imageUrl),
      subtitle: Application.decodeHTMLEntities(subtitle),
    });
  });

  return items;
}

export function parseDesktopTabItems(
  $: CheerioAPI,
  tabId: "top-day" | "top-week" | "top-month",
): DiscoverSectionItem[] {
  const items: DiscoverSectionItem[] = [];

  $(`#tab-${tabId} > div[style*='position:relative']`).each((_, element) => {
    const coverLink = $("a", element).first();
    const titleLink = $("a.title", element).first();
    const latestLink = $("p", element).eq(1).find("a").first();
    const imageUrl = $("img", coverLink).attr("src") ?? "";
    const href = titleLink.attr("href") ?? coverLink.attr("href") ?? "";
    const title = titleLink.text().trim();
    const subtitle = latestLink.text().trim();
    const mangaId = extractMangaId(href);

    if (!mangaId || !title) {
      return;
    }

    items.push({
      type: "simpleCarouselItem" as const,
      mangaId,
      title: Application.decodeHTMLEntities(title),
      imageUrl: resolveImageUrl(imageUrl),
      subtitle: Application.decodeHTMLEntities(subtitle),
    });
  });

  return items;
}

function extractMangaId(href: string): string {
  return href.replace(/^\/?Comic\//, "").replace(/\/$/, "");
}

function resolveImageUrl(imageUrl: string): string {
  return imageUrl.startsWith("/") ? `${DOMAIN}${imageUrl}` : imageUrl;
}
