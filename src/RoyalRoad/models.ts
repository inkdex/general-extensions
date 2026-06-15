/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type JSONObject, DiscoverSectionType } from "@paperback/types";

// Constants

export const DOMAIN = "https://www.royalroad.com";

// Discovery listings exposed by Royal Road. The `id` doubles as the path
// segment used to fetch the matching `/fictions/<id>` page.
export const DISCOVER_LISTINGS: { id: string; title: string; type: DiscoverSectionType }[] = [
  { id: "best-rated", title: "Best Rated", type: DiscoverSectionType.featured },
  { id: "trending", title: "Trending", type: DiscoverSectionType.simpleCarousel },
  { id: "active-popular", title: "Popular This Week", type: DiscoverSectionType.simpleCarousel },
  { id: "latest-updates", title: "Latest Updates", type: DiscoverSectionType.simpleCarousel },
  { id: "new", title: "Newest", type: DiscoverSectionType.simpleCarousel },
  { id: "complete", title: "Completed", type: DiscoverSectionType.simpleCarousel },
];

// Royal Road's genres. Submitted through the shared `tagsAdd` / `tagsRemove`
// search parameters (alongside TAGS below).
export const GENRES: { id: string; title: string }[] = [
  { id: "action", title: "Action" },
  { id: "adventure", title: "Adventure" },
  { id: "comedy", title: "Comedy" },
  { id: "contemporary", title: "Contemporary" },
  { id: "drama", title: "Drama" },
  { id: "fantasy", title: "Fantasy" },
  { id: "historical", title: "Historical" },
  { id: "horror", title: "Horror" },
  { id: "mystery", title: "Mystery" },
  { id: "psychological", title: "Psychological" },
  { id: "romance_main", title: "Romance" },
  { id: "satire", title: "Satire" },
  { id: "sci_fi", title: "Sci-fi" },
  { id: "one_shot", title: "Short Story" },
  { id: "thriller", title: "Thriller" },
  { id: "tragedy", title: "Tragedy" },
];

// Royal Road's content tags. Submitted through the same `tagsAdd` / `tagsRemove`
// parameters as GENRES.
export const TAGS: { id: string; title: string }[] = [
  { id: "anti-hero_lead", title: "Anti-Hero Lead" },
  { id: "antivillain_lead", title: "Anti-Villain Lead" },
  { id: "apocalypse", title: "Apocalypse" },
  { id: "artificial_intelligence", title: "Artificial Intelligence" },
  { id: "attractive_lead", title: "Attractive Lead" },
  { id: "chivalry", title: "Chivalry" },
  { id: "competing_love", title: "Competing Love Interest" },
  { id: "cozy", title: "Cozy" },
  { id: "crafting", title: "Crafting" },
  { id: "cultivation", title: "Cultivation" },
  { id: "cyberpunk", title: "Cyberpunk" },
  { id: "deck_building", title: "Deck Building" },
  { id: "dungeon_core", title: "Dungeon Core" },
  { id: "dungeon_crawler", title: "Dungeon Crawler" },
  { id: "dystopia", title: "Dystopia" },
  { id: "female_lead", title: "Female Lead" },
  { id: "first_contact", title: "First Contact" },
  { id: "gamelit", title: "GameLit" },
  { id: "gender_bender", title: "Gender Bender" },
  { id: "genetically_engineered", title: "Genetically Engineered" },
  { id: "grimdark", title: "Grimdark" },
  { id: "hard_sci-fi", title: "Hard Sci-fi" },
  { id: "high_fantasy", title: "High Fantasy" },
  { id: "kingdom_building", title: "Kingdom Building" },
  { id: "lesbian_romance", title: "Lesbian Romance" },
  { id: "litrpg", title: "LitRPG" },
  { id: "local_protagonist", title: "Local Protagonist" },
  { id: "low_fantasy", title: "Low Fantasy" },
  { id: "magic", title: "Magic" },
  { id: "magical_girl", title: "Magical Girl" },
  { id: "magitech", title: "Magitech" },
  { id: "gay_romance", title: "Male Gay Romance" },
  { id: "male_lead", title: "Male Lead" },
  { id: "martial_arts", title: "Martial Arts" },
  { id: "mecha", title: "Mecha" },
  { id: "modern_knowledge", title: "Modern Knowledge" },
  { id: "monster_evolution", title: "Monster Evolution" },
  { id: "multiple_lead", title: "Multiple Lead Characters" },
  { id: "harem", title: "Multiple Lovers" },
  { id: "mythos", title: "Mythos" },
  { id: "non-human_lead", title: "Non-Human Lead" },
  { id: "nonhumanoid_lead", title: "Non-Humanoid Lead" },
  { id: "otome", title: "Otome" },
  { id: "summoned_hero", title: "Portal Fantasy / Isekai" },
  { id: "post_apocalyptic", title: "Post Apocalyptic" },
  { id: "progression", title: "Progression" },
  { id: "reader_interactive", title: "Reader Interactive" },
  { id: "reincarnation", title: "Reincarnation" },
  { id: "romance", title: "Romance Subplot" },
  { id: "ruling_class", title: "Ruling Class" },
  { id: "school_life", title: "School Life" },
  { id: "secret_identity", title: "Secret Identity" },
  { id: "slice_of_life", title: "Slice of Life" },
  { id: "soft_sci-fi", title: "Soft Sci-fi" },
  { id: "space_opera", title: "Space Opera" },
  { id: "sports", title: "Sports" },
  { id: "steampunk", title: "Steampunk" },
  { id: "strategy", title: "Strategy" },
  { id: "strong_lead", title: "Strong Lead" },
  { id: "super_heroes", title: "Super Heroes" },
  { id: "supernatural", title: "Supernatural" },
  { id: "survival", title: "Survival" },
  { id: "system_invasion", title: "System Invasion" },
  { id: "technologically_engineered", title: "Technologically Engineered" },
  { id: "loop", title: "Time Loop" },
  { id: "time_travel", title: "Time Travel" },
  { id: "tower", title: "Tower" },
  { id: "urban_fantasy", title: "Urban Fantasy" },
  { id: "villainous_lead", title: "Villainous Lead" },
  { id: "virtual_reality", title: "Virtual Reality" },
  { id: "war_and_military", title: "War and Military" },
  { id: "wuxia", title: "Wuxia" },
];

// Submitted through the `content_warning` search parameter (include-only).
export const CONTENT_WARNINGS: { id: string; title: string }[] = [
  { id: "profanity", title: "Profanity" },
  { id: "sexuality", title: "Sexual Content" },
  { id: "graphic_violence", title: "Graphic Violence" },
  { id: "sensitive", title: "Sensitive Content" },
  { id: "ai_assisted", title: "AI-Assisted Content" },
  { id: "ai_generated", title: "AI-Generated Content" },
];

// Submitted through the single-valued `status` parameter.
export const STATUSES: { id: string; title: string }[] = [
  { id: "ALL", title: "All" },
  { id: "COMPLETED", title: "Completed" },
  { id: "ONGOING", title: "Ongoing" },
  { id: "HIATUS", title: "Hiatus" },
  { id: "DROPPED", title: "Dropped" },
  { id: "STUB", title: "Stub" },
];

// Submitted through the single-valued `type` parameter.
export const STORY_TYPES: { id: string; title: string }[] = [
  { id: "ALL", title: "All" },
  { id: "original", title: "Original" },
  { id: "fanfiction", title: "Fan Fiction" },
];

// The sort orders accepted by Royal Road's `orderBy` search parameter.
export const SORT_ORDERS: { id: string; label: string }[] = [
  { id: "relevance", label: "Relevance" },
  { id: "popularity", label: "Popularity" },
  { id: "rating", label: "Average Rating" },
  { id: "last_update", label: "Last Update" },
  { id: "release_date", label: "Release Date" },
  { id: "followers", label: "Followers" },
  { id: "length", label: "Number of Pages" },
  { id: "views", label: "Views" },
  { id: "title", label: "Title" },
  { id: "author", label: "Author" },
];

// Interfaces

export interface RoyalRoadMetadata extends JSONObject {
  page?: number;
}

// Tri-state selections map an option id to whether it should be included or
// excluded, matching the shape consumed by `TriStateSelectRow`.
export type TriState = Record<string, "included" | "excluded">;

export interface SearchMetadata extends JSONObject {
  author?: string;
  genres?: TriState;
  tags?: TriState;
  contentWarnings?: string[];
  status?: string;
  type?: string;
  ascending?: boolean;
}

export interface FictionEntry {
  mangaId: string;
  title: string;
  imageUrl: string;
  description?: string;
  stats?: {
    followers: string;
    views: string;
    rating: string;
    chapters: string;
  };
}

export interface SearchParams {
  title: string;
  author?: string;
  orderBy: string;
  ascending?: boolean;
  status?: string;
  type?: string;
  tagsAdd: string[];
  tagsRemove: string[];
  contentWarnings: string[];
  page: number;
}
