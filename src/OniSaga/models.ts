/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export const DOMAIN = "https://onisaga.com";

// State keys
export const SHOW_NSFW_KEY = "show_nsfw";
export const DISCOVER_TYPE_KEY = "discover_type";
export const DISCOVER_STATUS_KEY = "discover_status";
export const EXCLUDED_GENRES_KEY = "excluded_genres";
export const LANGUAGES_KEY = "languages";
export const READER_TOKEN_KEY_PREFIX = "reader_token_";
export const SECTIONS_ORDER_KEY = "sections_order";
export const SECTIONS_DELETED_KEY = "sections_deleted";
export const GENRES_KEY = "genres_cache";
export const GENRES_FETCHED_KEY = "genres_fetched_at";
// Refetch the genre list from the site at most once every 48h.
export const GENRES_TTL = 172_800_000;

// Discover rail catalog. The array order is the default display order; the
// section settings form lets the user reorder or hide individual rails.
export interface DiscoverSectionDef {
  id: string;
  title: string;
}

export const DISCOVER_SECTIONS: DiscoverSectionDef[] = [
  { id: "top_manga", title: "Top Manga" },
  { id: "latest", title: "Latest" },
  { id: "top_10_rising", title: "Top 10 Rising" },
  { id: "highest_rated", title: "Highest Rated" },
  { id: "fan_favorites", title: "Fan Favorites" },
  { id: "genres", title: "Genres" },
  { id: "types", title: "Types" },
];

export interface Option {
  id: string;
  title: string;
}

export interface LanguageOption {
  // Badge text the site stamps on a chapter row (e.g. "EN", "PT-BR", "ES-LA").
  badge: string;
  // Paperback langCode reported on the Chapter.
  langCode: string;
  title: string;
}

// Chapter-language badges → Paperback langCodes (used only to tag each chapter).
export const LANGUAGES: LanguageOption[] = [
  { badge: "EN", langCode: "en", title: "🇬🇧 English" },
  { badge: "JA", langCode: "ja", title: "🇯🇵 日本語" },
  { badge: "KO", langCode: "ko", title: "🇰🇷 한국어" },
  { badge: "ZH", langCode: "zh", title: "🇨🇳 中文" },
  { badge: "ZH-HANT", langCode: "zh-Hant", title: "🇹🇼 中文 (繁體)" },
  { badge: "FR", langCode: "fr", title: "🇫🇷 Français" },
  { badge: "DE", langCode: "de", title: "🇩🇪 Deutsch" },
  { badge: "IT", langCode: "it", title: "🇮🇹 Italiano" },
  { badge: "ES", langCode: "es", title: "🇪🇸 Español" },
  { badge: "ES-LA", langCode: "es-419", title: "🇲🇽 Español (Latinoamérica)" },
  { badge: "PT", langCode: "pt", title: "🇵🇹 Português" },
  { badge: "PT-BR", langCode: "pt-br", title: "🇧🇷 Português (Brasil)" },
  { badge: "RU", langCode: "ru", title: "🇷🇺 Русский" },
  { badge: "PL", langCode: "pl", title: "🇵🇱 Polski" },
  { badge: "ID", langCode: "id", title: "🇮🇩 Bahasa Indonesia" },
  { badge: "TR", langCode: "tr", title: "🇹🇷 Türkçe" },
  { badge: "AR", langCode: "ar", title: "🇸🇦 العربية" },
  { badge: "VI", langCode: "vi", title: "🇻🇳 Tiếng Việt" },
  { badge: "TH", langCode: "th", title: "🇹🇭 ไทย" },
];

// Content type (Livewire `platform` field).
export const TYPE_OPTIONS: Option[] = [
  { id: "", title: "All" },
  { id: "MANGA", title: "Manga" },
  { id: "MANHWA", title: "Manhwa" },
  { id: "MANHUA", title: "Manhua" },
  { id: "NOVEL", title: "Novel" },
  { id: "ONE-SHOT", title: "One-Shot" },
  { id: "DOUJINSHI", title: "Doujinshi" },
];

export const STATUS_OPTIONS: Option[] = [
  { id: "", title: "All" },
  { id: "ongoing", title: "Ongoing" },
  { id: "completed", title: "Completed" },
  { id: "hiatus", title: "Hiatus" },
  { id: "releasing", title: "Releasing" },
];

export const MIN_CHAPTERS_OPTIONS: Option[] = [
  { id: "", title: "Any" },
  { id: "10", title: "10+" },
  { id: "50", title: "50+" },
  { id: "100", title: "100+" },
  { id: "200", title: "200+" },
];

// Livewire `sort` field.
export const SORT_OPTIONS: Option[] = [
  { id: "created_at", title: "Latest" },
  { id: "view", title: "Popular" },
  { id: "title", title: "Title" },
  { id: "vote_average", title: "Rating" },
  { id: "like_count", title: "Most Liked" },
  { id: "fan_favorites", title: "Fan Favorites" },
  { id: "release_date", title: "Recently Released" },
];

export const DEFAULT_SORT = "created_at";

// Discover rails with an in-section toggle: each maps to its Livewire component
// + the method that switches the view (the option ids are the method's param).
export interface SectionToggle {
  component: string;
  method: string;
  options: Option[];
}

export const SECTION_TOGGLES: Record<string, SectionToggle> = {
  top_10_rising: {
    component: "trending-top10",
    method: "setPeriod",
    options: [
      { id: "day", title: "Day" },
      { id: "week", title: "Week" },
      { id: "month", title: "Month" },
    ],
  },
};

// Fallback genre list, used until the live list is fetched from the browse
// filter and cached (see parseGenres / getGenres). id = the Livewire filter's
// genre id; kept current so a fresh install or a failed fetch still filters.
export const GENRES: Option[] = [
  { id: "1", title: "Action" },
  { id: "61", title: "Adaptation" },
  { id: "67", title: "Adult" },
  { id: "6", title: "Adventure" },
  { id: "84", title: "Aliens" },
  { id: "43", title: "Avant Garde" },
  { id: "78", title: "Award Winning" },
  { id: "31", title: "Boys Love" },
  { id: "2", title: "Comedy" },
  { id: "90", title: "Comics" },
  { id: "59", title: "Crazy MC" },
  { id: "98", title: "Crime" },
  { id: "57", title: "Demon" },
  { id: "5", title: "Demons" },
  { id: "79", title: "Doujinshi" },
  { id: "15", title: "Drama" },
  { id: "56", title: "Dungeons" },
  { id: "29", title: "Ecchi" },
  { id: "68", title: "Erotica" },
  { id: "7", title: "Fantasy" },
  { id: "62", title: "Full Color" },
  { id: "46", title: "Game" },
  { id: "75", title: "Gender Bender" },
  { id: "63", title: "Genderswap" },
  { id: "49", title: "Genius MC" },
  { id: "28", title: "Girls Love" },
  { id: "80", title: "Gore" },
  { id: "42", title: "Gourmet" },
  { id: "37", title: "Harem" },
  { id: "76", title: "Hentai" },
  { id: "66", title: "Historical" },
  { id: "16", title: "Horror" },
  { id: "3", title: "Isekai" },
  { id: "34", title: "Iyashikei" },
  { id: "35", title: "Josei" },
  { id: "38", title: "Kids" },
  { id: "70", title: "Lolicon" },
  { id: "64", title: "Long Strip" },
  { id: "8", title: "Magic" },
  { id: "99", title: "Magical Girls" },
  { id: "41", title: "Mahou Shoujo" },
  { id: "11", title: "Martial Arts" },
  { id: "45", title: "Mature" },
  { id: "36", title: "Mecha" },
  { id: "101", title: "Medical" },
  { id: "17", title: "Military" },
  { id: "88", title: "Monster Girls" },
  { id: "81", title: "Monsters" },
  { id: "47", title: "Murim" },
  { id: "30", title: "Music" },
  { id: "19", title: "Mystery" },
  { id: "54", title: "Necromancer" },
  { id: "55", title: "Overpowered" },
  { id: "12", title: "Parody" },
  { id: "100", title: "Philosophical" },
  { id: "85", title: "Post-Apocalyptic" },
  { id: "18", title: "Psychological" },
  { id: "52", title: "Regression" },
  { id: "48", title: "Reincarnation" },
  { id: "51", title: "Revenge" },
  { id: "44", title: "Reverse Harem" },
  { id: "20", title: "Romance" },
  { id: "86", title: "Samurai" },
  { id: "21", title: "School" },
  { id: "24", title: "School Life" },
  { id: "13", title: "Sci-Fi" },
  { id: "14", title: "Seinen" },
  { id: "82", title: "Self-Published" },
  { id: "77", title: "Shotacon" },
  { id: "27", title: "Shoujo" },
  { id: "73", title: "Shoujo Ai" },
  { id: "4", title: "Shounen" },
  { id: "72", title: "Shounen Ai" },
  { id: "26", title: "Slice of Life" },
  { id: "69", title: "Smut" },
  { id: "22", title: "Space" },
  { id: "32", title: "Sports" },
  { id: "9", title: "Super Power" },
  { id: "89", title: "Superhero" },
  { id: "10", title: "Supernatural" },
  { id: "87", title: "Survival" },
  { id: "39", title: "Suspense" },
  { id: "50", title: "System" },
  { id: "40", title: "Thriller" },
  { id: "23", title: "Time Travel" },
  { id: "58", title: "Tower" },
  { id: "25", title: "Tragedy" },
  { id: "33", title: "Vampire" },
  { id: "53", title: "Villain" },
  { id: "60", title: "Violence" },
  { id: "65", title: "Web Comic" },
  { id: "113", title: "Wuxia" },
  { id: "74", title: "Yaoi" },
  { id: "71", title: "Yuri" },
];

// Search/discover metadata threaded through SearchQuery. Declared as a type alias
// (not an interface) so it carries the implicit index signature JSONObject needs.
export type OniSagaSearchMetadata = {
  page?: number;
  collectedIds?: string[];
  type?: string;
  status?: string;
  sort?: string;
  minChapters?: string;
  genres?: Record<string, "included" | "excluded">;
  // A discover chip tap: which toggle rail and which option were chosen.
  toggleSection?: string;
  toggleValue?: string;
};

// Livewire `post-filter` component public state. Field names (and the snake_case /
// camelCase mix) must match the component exactly; all are always serialized.
export interface PostFilterUpdates {
  platform: string;
  status: string;
  sort: string;
  min_chapters: string;
  group: string | null;
  release_start: string | null;
  release_end: string | null;
  genre: string[];
  excludeGenre: string[];
}

export interface LivewireCall {
  type: "call";
  path: string;
  method: string;
  params: (string | number)[];
}

export interface ToggleLivewireRequest {
  _token: string;
  components: {
    snapshot: string;
    updates: Record<string, never>;
    calls: LivewireCall[];
  }[];
}

export interface BrowseLivewireRequest {
  _token: string;
  components: {
    snapshot: string;
    updates: PostFilterUpdates;
    calls: LivewireCall[];
  }[];
}

export interface ChapterLivewireRequest {
  _token: string;
  components: {
    snapshot: string;
    updates: { chaptersLoaded: number; volumesLoaded: number };
    calls: LivewireCall[];
  }[];
}

export interface LivewireResponse {
  components?: {
    effects?: { html?: string | null };
    snapshot?: string;
  }[];
}

export interface PageApiResponse {
  url?: string | null;
  order?: number | null;
  message?: string | null;
}

export interface LivewireState {
  token: string;
  snapshot: string;
}
