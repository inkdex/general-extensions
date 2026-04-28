/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type TagSection, URL } from "@paperback/types";
import * as cheerio from "cheerio";

import { DOMAIN } from "./models";
import { parseTags } from "./parsers";

export function formatTagId(tagId: string): string {
  return tagId.replaceAll(" ", "_");
}

export function parseTagId(tagId: string): string {
  return tagId.replace("_", " ");
}

export async function getSearchTags(): Promise<TagSection[]> {
  const request = {
    url: new URL(DOMAIN).addPathComponent("search").toString(),
    method: "GET",
  };

  const [_, buffer] = await Application.scheduleRequest(request);
  const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
  return await parseTags($);
}

export function getGenresFromTags(tags: TagSection[]): TagSection {
  return tags[0];
}

export function getTypesFromTags(tags: TagSection[]): TagSection {
  return tags[1];
}

export function getStatusesFromTags(tags: TagSection[]): TagSection {
  return tags[2];
}
