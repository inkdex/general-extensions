import type { SourceManga } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { CheerioAPI } from "cheerio";
import { DOMAIN } from "../shared/models";

export function parseMangaDetails($: CheerioAPI, mangaId: string): SourceManga {
  const info = $("div.col.info");

  const primaryTitle = $("div.heading h3").first().text().trim();

  const thumbnailHref =
    $('link[rel="image_src"]').attr("href") ?? $("div.col.cover img").attr("src") ?? "";
  const fullThumbnail = thumbnailHref.startsWith("/") ? DOMAIN + thumbnailHref : thumbnailHref;

  function collectLinks(label: string): string[] {
    const links: string[] = [];
    $(`p:has(span:contains("${label}")) a`, info).each((_, el) => {
      const text = $(el).text().trim();
      if (text) links.push(text);
    });
    return links;
  }

  const author = collectLinks("Writer:").join(", ");
  const artist = collectLinks("Artist:").join(", ");
  const status = $('p:has(span:contains("Status:"))', info).contents().not("span").text().trim();
  const synopsis = $("div.section.group").eq(1).text().trim();

  const genres: { id: string; title: string }[] = [];
  $("a[href^='/Genre/']").each((_, el) => {
    const name = $(el).text().trim();
    if (name)
      genres.push({
        id: name.toLowerCase().replace(/[^a-z0-9._\-@()[\]%?#+=/&:]/g, "-"),
        title: name,
      });
  });
  const tagGroups = genres.length > 0 ? [{ id: "genres", title: "Genres", tags: genres }] : [];

  return {
    mangaId,
    mangaInfo: {
      primaryTitle,
      secondaryTitles: [],
      thumbnailUrl: fullThumbnail,
      synopsis,
      author,
      artist,
      status,
      contentRating: ContentRating.EVERYONE,
      tagGroups,
      shareUrl: `${DOMAIN}/Comic/${mangaId}`,
    },
  };
}
