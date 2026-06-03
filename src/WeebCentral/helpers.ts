/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, type Tag, type TagSection } from "@paperback/types";
import * as cheerio from "cheerio";

import { getState } from "../utils/state";
import type { TagSectionId } from "./models";
import { WC_DOMAIN } from "./models";
import { fetchSearchPage, type Query } from "./network";
import { parseTags } from "./parsers";

export function formatTagId(tagId: string): string {
  return tagId.replaceAll(" ", "_");
}

export function parseTagId(tagId: string): string {
  return tagId.replace("_", " ");
}

export function isInvalidTags(tags: Tag[]): boolean {
  return tags.some((tag) => !/^[a-zA-Z0-9._\-@()[\]]+$/.test(tag.id));
}

export function getTagFromTagStore(tagId: TagSectionId, tags: TagSection[]): TagSection {
  const tag = tags.find((x) => (x.id as TagSectionId) === tagId);
  if (tag === undefined) {
    throw new Error(`${tagId} Tag section not found`);
  }
  return tag;
}

export function getShareUrl(mangaId: string): string {
  return `${WC_DOMAIN}/series/${mangaId}`;
}

export function getRating(rating: string): ContentRating {
  return rating === "Yes" ? ContentRating.ADULT : ContentRating.EVERYONE;
}

export function newQuery(key: string, value: string | string[]): Query {
  return {
    key,
    value,
  };
}

export async function getSearchTags(): Promise<TagSection[]> {
  let tags = getState<TagSection[]>("tags", []);
  if (tags.length > 0) {
    return tags;
  }
  const [_, buffer] = await fetchSearchPage([], []);
  const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
  tags = await parseTags($);
  Application.setState(tags, "tags");
  return tags;
}
