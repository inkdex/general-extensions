/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type PagedResults,
  type SearchResultItem,
  type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { VOID_TAGS, type Series } from "./models";

export class LNoriParser {
  async parseProminent(html: string): Promise<PagedResults<DiscoverSectionItem>> {
    const $ = cheerio.load(html);
    const novels: Series[] = $("#hero-stack article.hero-card")
      .map((_, el) => {
        const article = $(el);
        return {
          title: article.attr("data-title") ?? "",
          author: article.attr("data-author") ?? "",
          description: article.attr("data-desc") ?? "",
          cover: article.attr("data-image") ?? "",
          link: article.attr("data-link") ?? "",
        };
      })
      .get();
    return {
      items: novels.map((item) => ({
        type: "featuredCarouselItem",
        mangaId: item.link,
        summary: item.description,
        title: item.title,
        supertitle: item.author,
        imageUrl: item.cover,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }

  async extractSection(
    html: string,
    sectionId: string,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const $ = cheerio.load(html);
    const heading = $(`#${sectionId}`).first();
    const header = heading.closest("header");
    const list = header.next("ul");
    const sections = {
      items: list
        .find("li")
        .map((_, el) => {
          const a = $(el).find("a").first();
          const img = a.find("img").first();
          return {
            title: img.attr("alt")?.trim() ?? "",
            cover: img.attr("src") ?? "",
            link: a.attr("href") ?? "",
          };
        })
        .get(),
    };
    return {
      items: sections.items.map((item) => ({
        type: "prominentCarouselItem",
        mangaId: item.link,
        title: item.title,
        imageUrl: item.cover,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }

  async extractSeriesDetails(mangaId: string, html: string): Promise<SourceManga> {
    const $ = cheerio.load(html);

    const title = $(".s-title").first().text().trim();

    const author = $(".author").first().text().trim();

    const cover = $(".cover-wrap img").first().attr("src") ?? "";

    const description = $('meta[name="description"]').attr("content") ?? "";

    const genres = [
      ...new Set(
        $('a[href^="/genre/"]')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter(Boolean),
      ),
    ];

    const volumes = $("section.vol-grid article.card")
      .map((_, el) => {
        const isDot5 = $(el).find("p.popup-author").text() === ".5";
        const linkEl = $(el).find("figure.card-cover a").first();
        const img = $(el).find("figure.card-cover img").first();
        const title =
          $(el).find("h3.card-title span").text().trim() || linkEl.attr("aria-label") || "";

        return {
          title: title,
          link: linkEl.attr("href") ?? "",
          cover: img.attr("src") ?? "",
          dot5: isDot5,
        };
      })
      .get();

    return {
      mangaId: mangaId,
      mangaInfo: {
        thumbnailUrl: cover,
        author: author,
        synopsis: description,
        primaryTitle: title,
        tagGroups: [
          {
            title: "Genres",
            tags: genres.map((genre) => ({
              id: genre.toLocaleLowerCase().replaceAll("-", "_").replaceAll(" ", "_"),
              title: this.toTitleCase(genre),
            })),
            id: "genres",
          },
        ],
        artworkUrls: volumes.map((volume) => volume.cover),
        secondaryTitles: [],
        contentRating: ContentRating.EVERYONE,
        contentType: "novel",
        additionalInfo: { volumes: JSON.stringify(volumes) },
      },
    };
  }
  async parseChapter(chapter: Chapter, html: string): Promise<ChapterDetails> {
    const $ = cheerio.load(html);
    const content = $(".content-body");
    const htmlSection = $.html(content);
    const contentDiv = this.fixVoidElements(htmlSection)
      .replaceAll(/\u00a0/g, " ")
      .replaceAll("&nbsp;", " ");
    return {
      type: "html",
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      html: `<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>${contentDiv}</body></html>`,
    };
  }

  async parseSearch(html: string, title: string): Promise<PagedResults<SearchResultItem>> {
    const $ = cheerio.load(html);

    let results = $("article.card:not([style*='display: none'])")
      .map((_, el) => {
        const card = $(el);
        return {
          title: card.attr("data-t")?.trim() ?? "",
          author: card.attr("data-a")?.trim() ?? "",
          cover: card.find("img").first().attr("src") ?? "",
          link: card.find("a").first().attr("href") ?? "",
        };
      })
      .get()
      .filter((item) => item.title && item.author && item.cover && item.link);
    results = results.filter(
      (card) =>
        card.title.toLowerCase().includes(title) || card.author.toLowerCase().includes(title),
    );
    return {
      items: results.map((novel) => ({
        mangaId: novel.link,
        title: novel.title,
        subtitle: novel.author,
        imageUrl: novel.cover,
        contentRating: ContentRating.EVERYONE,
      })),
    };
  }

  toTitleCase(str: string): string {
    return str.replace(
      /\b[\p{L}\p{N}]+/gu,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
  }

  fixVoidElements(html: string): string {
    return (
      html
        // EPUB
        .replaceAll(/\s+epub:[\w-]+=(["'])(.*?)\1/gi, "")
        // namespace XML
        .replaceAll(/\s+xmlns:[\w-]+=(["'])(.*?)\1/gi, "")
        // handler
        .replaceAll(/\s+on[\w-]+=(["'])(.*?)\1/gi, "")
        // <picture> ... <img ...> ... </picture> -> <img ... />
        .replaceAll(
          /<picture[^>]*>[\s\S]*?<img([^>]*)>[\s\S]*?<\/picture>/gi,
          `<img$1 style="display:block; margin:0 auto;"/>`,
        )
        .replaceAll(new RegExp(`<(${VOID_TAGS})(\\s[^>]*?)?>`, "gi"), (match, tag, attrs = "") => {
          if (match.endsWith("/>")) {
            return match;
          }
          return `<${tag}${attrs} />`;
        })
    );
  }
}
