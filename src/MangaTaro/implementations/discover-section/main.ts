/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { DiscoverSection, DiscoverSectionItem, PagedResults, Request } from "@paperback/types";
import { DiscoverSectionType, URL } from "@paperback/types";

import { fetchJSON } from "../../services/network";
import { DOMAIN } from "../shared/models";
import type {
  MangaTaroFollowedMangaResponse,
  MangaTaroPopularChaptersResponse,
  MangaTaroPopularMangaItem,
  MangaTaroStatusSliderResponse,
} from "../shared/models";
import {
  parseFollowedManga,
  parsePopularChapters,
  parsePopularManga,
  parseStatusManga,
} from "./parsers";

const SECTIONS: DiscoverSection[] = [
  { id: "popular-chapters", title: "Popular Chapters", type: DiscoverSectionType.chapterUpdates },
  { id: "manga-status", title: "Completed Manga", type: DiscoverSectionType.simpleCarousel },
  { id: "most-followed-new", title: "Hot New Manga", type: DiscoverSectionType.simpleCarousel },
  { id: "most-followed", title: "Most Followed", type: DiscoverSectionType.simpleCarousel },
  { id: "popular-manga", title: "Popular Manga", type: DiscoverSectionType.simpleCarousel },
  { id: "high-score", title: "High Score Manga", type: DiscoverSectionType.simpleCarousel },
];

export class DiscoverProvider {
  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return SECTIONS;
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    _metadata?: { page?: number },
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let items: DiscoverSectionItem[];

    switch (section.id) {
      case "popular-chapters": {
        const url = new URL(DOMAIN)
          .addPathComponent("auth")
          .addPathComponent("popular-chapters")
          .setQueryItem("period", "today")
          .setQueryItem("limit", "15")
          .toString();
        const data = await fetchJSON<MangaTaroPopularChaptersResponse>({
          url,
          method: "GET",
        } as Request);
        items = parsePopularChapters(data.chapters);
        break;
      }

      case "manga-status": {
        const url = new URL(DOMAIN)
          .addPathComponent("auth")
          .addPathComponent("manga-status-slider")
          .setQueryItem("status", "completed")
          .setQueryItem("limit", "15")
          .toString();
        const data = await fetchJSON<MangaTaroStatusSliderResponse>({
          url,
          method: "GET",
        } as Request);
        items = parseStatusManga(data.manga);
        break;
      }

      case "most-followed-new": {
        const url = new URL(DOMAIN)
          .addPathComponent("auth")
          .addPathComponent("most-followed-new-manga")
          .setQueryItem("period", "7d")
          .setQueryItem("limit", "15")
          .toString();
        const data = await fetchJSON<MangaTaroFollowedMangaResponse>({
          url,
          method: "GET",
        } as Request);
        items = parseFollowedManga(data.manga);
        break;
      }

      case "most-followed": {
        const url = new URL(DOMAIN)
          .addPathComponent("auth")
          .addPathComponent("most-followed-manga")
          .setQueryItem("period", "month")
          .setQueryItem("limit", "15")
          .toString();
        const data = await fetchJSON<MangaTaroFollowedMangaResponse>({
          url,
          method: "GET",
        } as Request);
        items = parseFollowedManga(data.manga);
        break;
      }

      case "popular-manga": {
        const url = new URL(DOMAIN)
          .addPathComponent("wp-json")
          .addPathComponent("manga")
          .addPathComponent("v1")
          .addPathComponent("popular")
          .setQueryItem("period", "week")
          .setQueryItem("number", "15")
          .toString();
        const data = await fetchJSON<MangaTaroPopularMangaItem[]>({
          url,
          method: "GET",
        } as Request);
        items = parsePopularManga(data);
        break;
      }

      case "high-score": {
        const url = new URL(DOMAIN)
          .addPathComponent("wp-json")
          .addPathComponent("manga")
          .addPathComponent("v1")
          .addPathComponent("highscore")
          .setQueryItem("type", "all")
          .setQueryItem("number", "15")
          .toString();
        const data = await fetchJSON<MangaTaroPopularMangaItem[]>({
          url,
          method: "GET",
        } as Request);
        items = parsePopularManga(data);
        break;
      }

      default:
        items = [];
    }

    return { items, metadata: undefined };
  }
}
