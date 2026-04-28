/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { JSONObject } from "@paperback/types";

export interface Metadata extends JSONObject {
  nsfw?: boolean;
  demographic?: string;
  tagIncluded: string[];
  tagExcluded: string[];
  originalLanguages: string[];
}

export interface filterOption {
  id: string;
  name: string;
  type: "type" | "genres";
}

export interface searchFilter {
  id: string;
  value: string;
}

export interface APIItem {
  _id: string;
  name: string;
  alternateName: string;
  cover: string;
  background: string;
  tags: string;
  authors: string;
  status: string;
  last_chapter?: string;
  url: string;
  description: string;
  updated_at: string;
  languageFlag: string;
}

export interface SearchAPIResponse {
  code: number;
  data: APIItem[];
  message: string;
  pagination?: {
    total: number;
    limit: number;
    start: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface TagCategory {
  id: string;
  label: string;
  tags: { id: string; name: string; slug: string }[];
}

export interface SearchDetails {
  sortBy: { id: string; label: string }[];
  tagCategories: TagCategory[];
  demographics: { id: string; label: string }[];
  originalLanguages: { id: string; label: string }[];
}

export interface ChapterTranslation {
  id: string;
  name: string;
  language: string;
  languageName: string;
  group?: { name?: string };
  date?: string;
  volume?: number;
}

export interface ChapterApiChapter {
  number: string;
  number_float: number;
  title: string;
  translations: ChapterTranslation[];
}

export interface ChapterApiResponse {
  code: number;
  TOTAL_CHAPTERS: number;
  ALL_CHAPTERS: ChapterApiChapter[];
}

export const STATIC_SEARCH_DETAILS: SearchDetails = {
  sortBy: [
    { id: "updated_chapters_desc", label: "Lastest Updated Chapters" },
    { id: "updated_chapters_asc", label: "Oldest Updated Chapters" },
    { id: "created_at_desc", label: "Lastest Created" },
    { id: "created_at_asc", label: "Oldest Created" },
    { id: "name_asc", label: "Title A-Z" },
    { id: "name_desc", label: "Title Z-A" },
    { id: "views_desc", label: "Views High to Low" },
    { id: "views_asc", label: "Views Low to High" },
  ],
  tagCategories: [
    {
      id: "content",
      label: "Content",
      tags: [
        { id: "685148d115e8b86aae68e4f3", name: "Gore", slug: "gore" },
        { id: "685146c5f3ed681c80f257e7", name: "Sexual Violence", slug: "sexual-violence" },
      ],
    },
    {
      id: "format",
      label: "Format",
      tags: [
        { id: "685148d115e8b86aae68e4ec", name: "4-Koma", slug: "4-koma" },
        { id: "685148cf15e8b86aae68e4de", name: "Adaptation", slug: "adaptation" },
        { id: "685148e915e8b86aae68e558", name: "Anthology", slug: "anthology" },
        { id: "685148fe15e8b86aae68e5a7", name: "Award Winning", slug: "award-winning" },
        { id: "6851490e15e8b86aae68e5da", name: "Doujinshi", slug: "doujinshi" },
        { id: "6851498215e8b86aae68e704", name: "Fan Colored", slug: "fan-colored" },
        { id: "685148d615e8b86aae68e502", name: "Full Color", slug: "full-color" },
        { id: "685148d915e8b86aae68e517", name: "Long Strip", slug: "long-strip" },
        { id: "6851493515e8b86aae68e64a", name: "Official Colored", slug: "official-colored" },
        { id: "685148eb15e8b86aae68e56c", name: "Oneshot", slug: "oneshot" },
        { id: "6851492e15e8b86aae68e633", name: "Self-Published", slug: "self-published" },
        { id: "685148d715e8b86aae68e50d", name: "Web Comic", slug: "web-comic" },
      ],
    },
    {
      id: "genre",
      label: "Genre",
      tags: [
        { id: "685146c5f3ed681c80f257e3", name: "Action", slug: "action" },
        { id: "689371f0a943baf927094f03", name: "Adult", slug: "adult" },
        { id: "685146c5f3ed681c80f257e6", name: "Adventure", slug: "adventure" },
        { id: "685148ef15e8b86aae68e573", name: "Boys' Love", slug: "boys-love" },
        { id: "685146c5f3ed681c80f257e5", name: "Comedy", slug: "comedy" },
        { id: "685148da15e8b86aae68e51f", name: "Crime", slug: "crime" },
        { id: "685148cf15e8b86aae68e4dd", name: "Drama", slug: "drama" },
        { id: "6892a73ba943baf927094e37", name: "Ecchi", slug: "ecchi" },
        { id: "685146c5f3ed681c80f257ea", name: "Fantasy", slug: "fantasy" },
        { id: "685148da15e8b86aae68e524", name: "Girls' Love", slug: "girls-love" },
        { id: "685148db15e8b86aae68e527", name: "Historical", slug: "historical" },
        { id: "685148da15e8b86aae68e520", name: "Horror", slug: "horror" },
        { id: "685146c5f3ed681c80f257e9", name: "Isekai", slug: "isekai" },
        { id: "6851490d15e8b86aae68e5d4", name: "Magical Girls", slug: "magical-girls" },
        { id: "68932d11a943baf927094e7b", name: "Mature", slug: "mature" },
        { id: "6851490c15e8b86aae68e5d2", name: "Mecha", slug: "mecha" },
        { id: "6851494e15e8b86aae68e66e", name: "Medical", slug: "medical" },
        { id: "685148d215e8b86aae68e4f4", name: "Mystery", slug: "mystery" },
        { id: "685148e215e8b86aae68e544", name: "Philosophical", slug: "philosophical" },
        { id: "685148d715e8b86aae68e507", name: "Psychological", slug: "psychological" },
        { id: "685148cf15e8b86aae68e4db", name: "Romance", slug: "romance" },
        { id: "685148cf15e8b86aae68e4da", name: "Sci-Fi", slug: "sci-fi" },
        { id: "689f0ab1f2e66744c6091524", name: "Shounen Ai", slug: "shounen-ai" },
        { id: "685148d015e8b86aae68e4e3", name: "Slice of Life", slug: "slice-of-life" },
        { id: "689371f2a943baf927094f04", name: "Smut", slug: "smut" },
        { id: "685148f515e8b86aae68e588", name: "Sports", slug: "sports" },
        { id: "6851492915e8b86aae68e61c", name: "Superhero", slug: "superhero" },
        { id: "685148d915e8b86aae68e51e", name: "Thriller", slug: "thriller" },
        { id: "685148db15e8b86aae68e529", name: "Tragedy", slug: "tragedy" },
        { id: "68932c3ea943baf927094e77", name: "User Created", slug: "user-created" },
        { id: "6851490715e8b86aae68e5c3", name: "Wuxia", slug: "wuxia" },
        { id: "68932f68a943baf927094eaa", name: "Yaoi", slug: "yaoi" },
        { id: "6896a885a943baf927094f66", name: "Yuri", slug: "yuri" },
        { id: "694cc2d9f8014f5e0a63ac73", name: "Josei(W)", slug: "josei-w" },
        { id: "694cc2d9f8014f5e0a63ac75", name: "Revenge", slug: "revenge" },
        { id: "694cc2d9f8014f5e0a63ac74", name: "Shoujo(G)", slug: "shoujo-g" },
      ],
    },
    {
      id: "theme",
      label: "Theme",
      tags: [
        { id: "6851490d15e8b86aae68e5d5", name: "Aliens", slug: "aliens" },
        { id: "68f5f5ce5f29d3c1863dec3a", name: "Manhwa 18+", slug: "manhwa-18-plus" },
        { id: "685148e715e8b86aae68e54b", name: "Animals", slug: "animals" },
        { id: "68bf09ff8fdeab0b6a9bc2b7", name: "Comics", slug: "comics" },
        { id: "685148d215e8b86aae68e4f8", name: "Cooking", slug: "cooking" },
        { id: "685148df15e8b86aae68e534", name: "Crossdressing", slug: "crossdressing" },
        { id: "685148d915e8b86aae68e519", name: "Delinquents", slug: "delinquents" },
        { id: "685146c5f3ed681c80f257e4", name: "Demons", slug: "demons" },
        { id: "685148d715e8b86aae68e505", name: "Genderswap", slug: "genderswap" },
        { id: "685148d615e8b86aae68e501", name: "Ghosts", slug: "ghosts" },
        { id: "685148d015e8b86aae68e4e8", name: "Gyaru", slug: "gyaru" },
        { id: "685146c5f3ed681c80f257e8", name: "Harem", slug: "harem" },
        { id: "68bfceaf4dbc442a26519889", name: "Hentai", slug: "hentai" },
        { id: "685148f215e8b86aae68e584", name: "Incest", slug: "incest" },
        { id: "685148d715e8b86aae68e506", name: "Loli", slug: "loli" },
        { id: "685148d915e8b86aae68e518", name: "Mafia", slug: "mafia" },
        { id: "685148d715e8b86aae68e509", name: "Magic", slug: "magic" },
        { id: "6851490615e8b86aae68e5c2", name: "Martial Arts", slug: "martial-arts" },
        { id: "685148e215e8b86aae68e541", name: "Military", slug: "military" },
        { id: "685148db15e8b86aae68e52c", name: "Monster Girls", slug: "monster-girls" },
        { id: "685146c5f3ed681c80f257e2", name: "Monsters", slug: "monsters" },
        { id: "685148d015e8b86aae68e4e4", name: "Music", slug: "music" },
        { id: "685148d715e8b86aae68e508", name: "Ninja", slug: "ninja" },
        { id: "685148d315e8b86aae68e4fd", name: "Office Workers", slug: "office-workers" },
        { id: "6851498815e8b86aae68e714", name: "Police", slug: "police" },
        { id: "685148e215e8b86aae68e540", name: "Post-Apocalyptic", slug: "post-apocalyptic" },
        { id: "685146c5f3ed681c80f257e1", name: "Reincarnation", slug: "reincarnation" },
        { id: "685148df15e8b86aae68e533", name: "Reverse Harem", slug: "reverse-harem" },
        { id: "6851490415e8b86aae68e5b9", name: "Samurai", slug: "samurai" },
        { id: "685148d015e8b86aae68e4e7", name: "School Life", slug: "school-life" },
        { id: "685148d115e8b86aae68e4ed", name: "Shota", slug: "shota" },
        { id: "685148db15e8b86aae68e528", name: "Supernatural", slug: "supernatural" },
        { id: "685148cf15e8b86aae68e4dc", name: "Survival", slug: "survival" },
        { id: "6851490c15e8b86aae68e5d1", name: "Time Travel", slug: "time-travel" },
        { id: "6851493515e8b86aae68e645", name: "Traditional Games", slug: "traditional-games" },
        { id: "685148f915e8b86aae68e597", name: "Vampires", slug: "vampires" },
        { id: "685148e115e8b86aae68e53c", name: "Video Games", slug: "video-games" },
        { id: "6851492115e8b86aae68e602", name: "Villainess", slug: "villainess" },
        { id: "68514a1115e8b86aae68e83e", name: "Virtual Reality", slug: "virtual-reality" },
        { id: "6851490c15e8b86aae68e5d3", name: "Zombies", slug: "zombies" },
      ],
    },
  ],
  demographics: [
    { id: "any", label: "Any" },
    { id: "shounen", label: "Shounen" },
    { id: "shoujo", label: "Shoujo" },
    { id: "seinen", label: "Seinen" },
    { id: "josei", label: "Josei" },
    { id: "yuri", label: "Yuri" },
    { id: "yaoi", label: "Yaoi" },
  ],
  originalLanguages: [
    { id: "en", label: "Comics" },
    { id: "jp", label: "Manga" },
    { id: "kr", label: "Manhwa" },
    { id: "zh", label: "Manhua" },
  ],
};
