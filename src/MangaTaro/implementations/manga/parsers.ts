import type { SourceManga } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { MangaTaroSchemaOrg } from "../shared/models";
import { extractNumericId, formatMangaId, parseMangaId } from "../shared/utils";

export function parseMangaDetails(html: string, mangaId: string): SourceManga {
  // mangataro embeds schema.org json-ld (ComicSeries) in the first inline <script> tag
  const scriptMatch = html.match(
    /<script[^>]*>\s*(\{[\s\S]*?"@type"\s*:\s*"ComicSeries"[\s\S]*?\})\s*<\/script>/,
  );
  if (!scriptMatch) {
    throw new Error("Could not find Schema.org ComicSeries data in page");
  }

  const schema = JSON.parse(scriptMatch[1]) as MangaTaroSchemaOrg;

  // extract numeric id from data-manga-id to upgrade slug-only mangaIds so getChapters works
  const slug = parseMangaId(mangaId).slug;
  const numericId = extractNumericId(html);
  const resolvedMangaId = numericId ? formatMangaId(slug, numericId) : mangaId;

  // strip site suffix
  const primaryTitle = schema.name
    .replace(/\s*\|.*$/, "")
    .replace(/\s+(Manhwa|Manga|Manhua|Webtoon)$/i, "")
    .trim();

  // full synopsis lives in a <p> inside the text-justify div
  const synopsisMatch = html.match(/class="[^"]*text-justify[^"]*"[^>]*>\s*<p>([\s\S]*?)<\/p>/);
  const rawSynopsis = synopsisMatch
    ? synopsisMatch[1].replace(/<[^>]+>/g, "").trim()
    : (schema.description ?? "");
  // decode numeric html entities (&#8220;)
  const synopsis = rawSynopsis.replace(/&#(\d+);/g, (_, code: string) =>
    String.fromCharCode(parseInt(code, 10)),
  );

  // genre is a single string on this api
  const tagGroups = schema.genre
    ? [
        {
          id: "tags",
          title: "Tags",
          tags: [{ id: schema.genre.toLowerCase(), title: schema.genre }],
        },
      ]
    : [];

  return {
    mangaId: resolvedMangaId,
    mangaInfo: {
      primaryTitle,
      secondaryTitles: [],
      thumbnailUrl: schema.image ?? "",
      synopsis,
      author: schema.author?.name,
      status: schema.status,
      contentRating: ContentRating.EVERYONE,
      tagGroups,
      shareUrl: schema.url ?? "",
    },
  };
}
