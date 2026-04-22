import type { Chapter, SourceManga } from "@paperback/types";
import type { CheerioAPI } from "cheerio";
import { beauDecode } from "../shared/utils";

export function parseChapterList($: CheerioAPI, sourceManga: SourceManga): Chapter[] {
  const chapters: Chapter[] = [];
  const publisher = $('p:has(span:contains("Publisher:")) a', "div.col.info").text().trim();

  const items = $("ul.list li").toArray();
  const total = items.length;

  items.forEach((li, index) => {
    const a = $("div.col-1 a", li);
    if (!a.length) return;

    const href = a.attr("href") ?? "";
    const title = a.text().trim();
    const dateText = $("div.col-2 span", li).text().trim();

    const chapterId = href.replace(/^\/Comic\//, "");

    const numMatch = title.match(/#(\d+(?:\.\d+)?)/);
    const chapNum = numMatch ? parseFloat(numMatch[1]) : 0;

    const parsedPublishDate = dateText ? new Date(dateText) : undefined;
    const publishDate =
      parsedPublishDate && !Number.isNaN(parsedPublishDate.getTime())
        ? parsedPublishDate
        : new Date();

    chapters.push({
      chapterId,
      sourceManga,
      title,
      chapNum,
      volume: 0,
      langCode: "en",
      version: publisher || undefined,
      sortingIndex: total - index,
      publishDate,
    });
  });

  return chapters;
}

// extracts obfuscated `pth` image assignments and decodes them through rguard beau()
export function parseChapterDetails($: CheerioAPI): string[] {
  const html = $.html();

  // collect page-specific pth.replace() substitutions
  const replacements: { pattern: RegExp; replacement: string }[] = [];
  const replaceRegex = /pth\s*=\s*pth\.replace\(\/([^/]+)\/g,\s*'([^']*)'\)/g;
  let replMatch;
  while ((replMatch = replaceRegex.exec(html)) !== null) {
    const pattern = replMatch[1];
    const replacement = replMatch[2];
    if (pattern.length > replacement.length) {
      replacements.push({ pattern: new RegExp(pattern, "g"), replacement });
    }
  }

  // extract raw pth assignments; lstImages.push() only receives variable refs
  const rawPaths: string[] = [];
  const seen = new Set<string>();
  const pthRegex = /(?:var\s+)?pth\s*=\s*'([^']+)'/g;
  let match;
  while ((match = pthRegex.exec(html)) !== null) {
    const val = match[1];
    if (seen.has(val)) continue;
    seen.add(val);
    rawPaths.push(val);
  }

  // apply page substitutions before rguard beau() decoding
  return rawPaths
    .map((pth) => {
      for (const { pattern, replacement } of replacements) {
        pth = pth.replace(pattern, replacement);
      }
      return beauDecode(pth);
    })
    .filter(Boolean) as string[];
}
