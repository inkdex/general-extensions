/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type AdvancedSearchForm,
  BasicRateLimiter,
  CloudflareError,
  ContentRating,
  CookieStorageInterceptor,
  type Chapter,
  type ChapterDetails,
  type ChapterProviding,
  type CloudflareBypassRequestProviding,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type DiscoverSectionProviding,
  DiscoverSectionType,
  type Extension,
  type FeaturedCarouselItem,
  type Form,
  type MangaProviding,
  type PagedResults,
  type Request,
  type Response,
  type SearchQuery,
  type SearchResultItem,
  type SearchResultsProviding,
  type SettingsFormProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { MangagoAdvancedSearchForm } from "./forms/search";
import { MangagoSettingsForm } from "./forms/settings";
import {
  DISCOVER_SECTION_OPTIONS,
  DOMAIN,
  GENRE_OPTIONS,
  getContentType,
  getDiscoverSectionEnabled,
  getGenreTitle,
  getHiddenGenreIds,
  type MangagoSearchMetadata,
} from "./models";
import { MangagoInterceptor, applyMangagoHeaders, fetchText } from "./network";
import {
  type FeaturedDetail,
  chapterUrlFromId,
  hasNextPage,
  mangaUrlFromId,
  parseChapters,
  parseFeaturedDetail,
  parseLatestUpdates,
  parseListings,
  parseMangaDetails,
} from "./parsers";
import { getMangagoPageUrls } from "./utils/reader";
import { canonicalReaderUrl, isNumericChapterReaderUrl, isReadMangaReaderUrl } from "./utils/urls";

type MangagoImplementation = Extension &
  SearchResultsProviding &
  MangaProviding &
  ChapterProviding &
  DiscoverSectionProviding &
  SettingsFormProviding &
  CloudflareBypassRequestProviding;

// These genre tops add the "Webtoons" tag so they list only manhwa/manhua.
const MANHWA_TOP_SECTION_IDS = new Set(["top_supernatural", "top_mystery"]);

// Genre tops alternate banner/carousel by position so the run isn't repetitive.
const TOP_SECTION_IDS: string[] = DISCOVER_SECTION_OPTIONS.map((section) => section.id).filter(
  (id) => id.startsWith("top_"),
);

// Rating/status/author/summary only exist on detail pages, so the hero is
// capped and each per-title lookup is cached to keep this to a few requests.
const FEATURED_HERO_LIMIT = 8;
const featuredInfoCache = new Map<string, FeaturedDetail>();

async function getFeaturedInfo(mangaId: string): Promise<FeaturedDetail> {
  const cached = featuredInfoCache.get(mangaId);
  if (cached) return cached;
  try {
    const info = parseFeaturedDetail(await fetchText(mangaUrlFromId(mangaId)));
    featuredInfoCache.set(mangaId, info);
    return info;
  } catch {
    return {};
  }
}

const DISCOVER_SECTION_ALIASES: Record<string, string> = {
  popular: "popular_manga",
  latest: "new_chapters",
};

function normalizeDiscoverSectionId(sectionId: string): string {
  return DISCOVER_SECTION_ALIASES[sectionId] ?? sectionId;
}

function discoverSectionType(sectionId: string): DiscoverSectionType {
  if (sectionId === "featured_manga") return DiscoverSectionType.featured;
  if (sectionId === "new_chapters") return DiscoverSectionType.chapterUpdates;
  if (sectionId === "popular_manga") return DiscoverSectionType.prominentCarousel;
  if (sectionId === "genres") return DiscoverSectionType.genres;
  if (sectionId.startsWith("top_")) {
    const index = TOP_SECTION_IDS.indexOf(sectionId);
    return index % 2 === 0 ? DiscoverSectionType.featured : DiscoverSectionType.simpleCarousel;
  }
  return DiscoverSectionType.simpleCarousel;
}

// Listing pages don't expose a per-title rating, but a genre-locked section tells
// us one. Mirror parseMangaDetails so discover badges match the detail view:
// Adult/Smut/Yaoi -> Adult, Ecchi -> Mature.
function contentRatingForGenres(genreTitles: string[]): ContentRating {
  // Match case-insensitively since the New Chapters list scrapes genres raw.
  const lower = genreTitles.map((title) => title.trim().toLowerCase());
  if (lower.some((title) => title === "adult" || title === "smut" || title === "yaoi")) {
    return ContentRating.ADULT;
  }
  if (lower.some((title) => title === "ecchi")) return ContentRating.MATURE;
  return ContentRating.EVERYONE;
}

// Genres hidden via settings (Content Type "Manga" also hides Webtoons).
function settingsExcludedGenres(): string[] {
  const excluded = getHiddenGenreIds().map((id) => getGenreTitle(id));
  if (getContentType() === "manga") excluded.push("Webtoons");
  return excluded;
}

// New Chapters comes from /list/latest (no `e=` support), so filter it here
// using each row's parsed genres. "Manhwa/Manhua only" drops rows not confirmed
// to be webtoons (ungenred rows included); hidden genres can only drop rows we
// can identify. Settings are read once, not per row.
function filterNewChapters<T extends { genres?: string[] }>(items: T[]): T[] {
  const hidden = new Set(settingsExcludedGenres().map((genre) => genre.toLowerCase()));
  const webtoonsOnly = getContentType() === "webtoons";
  if (hidden.size === 0 && !webtoonsOnly) return items;

  return items.filter((item) => {
    const genres = (item.genres ?? []).map((genre) => genre.trim().toLowerCase());
    if (genres.some((genre) => hidden.has(genre))) return false;
    if (webtoonsOnly && !genres.includes("webtoons")) return false;
    return true;
  });
}

// Build a /genre/ browse URL, folding in the global Hide-Genres / Content-Type
// settings. With no filters set, output matches an unfiltered browse exactly.
// mangago matches genres by display title ("Shounen Ai"), comma-joined in the
// path for includes and in `e` for excludes; statuses map to `f`/`o`.
function buildGenreBrowseUrl(
  includedTitles: string[],
  excludedTitles: string[],
  page: number,
  sortby: string,
  statuses?: { completed: number; ongoing: number },
): string {
  const included = [...includedTitles];
  if (getContentType() === "webtoons" && !included.includes("Webtoons")) included.push("Webtoons");

  // A genre can't be both included and excluded (e.g. a manhwa Top + "Manga only").
  const excluded = [...new Set([...excludedTitles, ...settingsExcludedGenres()])].filter(
    (genre) => !included.includes(genre),
  );

  const path = included.length > 0 ? included.map(encodeURIComponent).join(",") : "all";
  const params: string[] = [];
  if (excluded.length > 0) params.push(`e=${excluded.map(encodeURIComponent).join(",")}`);
  if (statuses) params.push(`f=${statuses.completed}`, `o=${statuses.ongoing}`);
  if (sortby) params.push(`sortby=${encodeURIComponent(sortby)}`);
  const query = params.length > 0 ? `?${params.join("&")}` : "";

  return `${DOMAIN}/genre/${path}/${page}/${query}`;
}

function buildGenreFilterUrl(
  metadata: MangagoSearchMetadata | undefined,
  page: number,
  sortby: string,
): string {
  const genres = metadata?.genres ?? {};
  const included = Object.entries(genres)
    .filter(([, state]) => state === "included")
    .map(([id]) => getGenreTitle(id));
  const excluded = Object.entries(genres)
    .filter(([, state]) => state === "excluded")
    .map(([id]) => getGenreTitle(id));

  // `statuses` is omitted by the form when both are selected (= show all).
  const statuses = metadata?.statuses;
  const completed = !statuses || statuses.includes("f") ? 1 : 0;
  const ongoing = !statuses || statuses.includes("o") ? 1 : 0;

  return buildGenreBrowseUrl(included, excluded, page, sortby, { completed, ongoing });
}

function discoverItemLimit(sectionId: string): number | undefined {
  // Sections named "Top N" stay capped to that N by design.
  if (["top_mystery", "top_supernatural", "top_shoujo"].includes(sectionId)) return 10;
  if (sectionId.startsWith("top_")) return 5;

  // Everything else returns the whole page and paginates on scroll rather than
  // being truncated to a preview. Only one page is fetched up front.
  return undefined;
}

function genreSlugFromTopSection(sectionId: string): string {
  return sectionId.replace(/^top_/, "");
}

function buildDiscoverUrl(sectionId: string, page: number): string {
  switch (sectionId) {
    case "featured_manga":
      return buildGenreBrowseUrl([], [], page, "view");

    case "new_chapters":
      // The dedicated Last Updates page carries update times + genres per row.
      return `${DOMAIN}/list/latest/all/${page}/`;

    case "popular_manga":
      return buildGenreBrowseUrl([], [], page, "comment_count");

    default:
      if (sectionId.startsWith("top_")) {
        // mangago matches a genre by its display title in the path, not the
        // underscore slug, so map the section slug back to the title.
        const genre = getGenreTitle(genreSlugFromTopSection(sectionId));
        if (MANHWA_TOP_SECTION_IDS.has(sectionId)) {
          // ANDing ",Webtoons" restricts the top to manhwa/manhua. Sort by
          // popularity; the Genres picker already covers views.
          return buildGenreBrowseUrl([genre, "Webtoons"], [], page, "comment_count", {
            completed: 1,
            ongoing: 1,
          });
        }
        return buildGenreBrowseUrl([genre], [], page, "comment_count");
      }

      return buildGenreBrowseUrl([], [], page, "view");
  }
}

function sortingIdToMangagoSort(sortingOption?: SortingOption): string {
  switch (sortingOption?.id) {
    case "views":
      return "view";

    case "popularity":
      return "comment_count";

    case "create_date":
      return "create_date";

    case "update_date":
      return "update_date";

    case "alphabetical":
    default:
      return "";
  }
}

class MangagoExtension implements MangagoImplementation {
  private interceptor = new MangagoInterceptor("mangago-interceptor");

  // Balanced limiter (3 req/s) for HTML/API traffic — gentle on mangago's
  // Cloudflare while keeping discover responsive. Images aren't counted, and the
  // reader walk has its own targeted pacing.
  private rateLimiter = new BasicRateLimiter("mangago-rate-limiter", {
    numberOfRequests: 3,
    bufferInterval: 1,
    ignoreImages: true,
  });

  private cookieStorageInterceptor = new CookieStorageInterceptor({
    storage: "stateManager",
  });

  async initialise(): Promise<void> {
    // Register the Mangago interceptor last. The runtime chains interceptors, so
    // registering last lets us read the Cloudflare-bypass cookies the
    // CookieStorageInterceptor injected and merge our headers/cookie/UA on top.
    this.cookieStorageInterceptor.registerInterceptor();
    this.rateLimiter.registerInterceptor();
    this.interceptor.registerInterceptor();

    // Re-apply the desktop UA (+ _m_superu cookie) to redirect targets, since the
    // app only runs interceptRequest on the initial request. mangago.me redirects
    // numeric /chapter/ URLs to the /read-manga/ desktop reader, which we must
    // arrive at as a desktop browser to get the complete page.
    Application.setRedirectHandler(
      Application.Selector(this as MangagoExtension, "handleRedirect"),
    );
  }

  async handleRedirect(request: Request, _response: Response): Promise<Request> {
    return await applyMangagoHeaders(request);
  }

  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (cookie.expires && cookie.expires.getTime() <= Date.now()) continue;

      this.cookieStorageInterceptor.setCookie(cookie);
    }
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return [
      {
        id: "alphabetical",
        label: "Alphabetical",
      },
      {
        id: "views",
        label: "Views",
      },
      {
        id: "popularity",
        label: "Popularity",
      },
      {
        id: "create_date",
        label: "Create Date",
      },
      {
        id: "update_date",
        label: "Update Date",
      },
    ];
  }

  async getSettingsForm(): Promise<Form> {
    return new MangagoSettingsForm();
  }

  async getAdvancedSearchForm(
    query: SearchQuery<MangagoSearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    return new MangagoAdvancedSearchForm(query);
  }

  async getSearchResults(
    query: SearchQuery<MangagoSearchMetadata>,
    metadata?: MangagoSearchMetadata,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;
    const title = query.title?.trim() ?? "";

    // A text query uses mangago's title search; mangago can't combine free text
    // with the genre filter, so genre/status from the advanced-search form only
    // apply to the no-title browse path.
    // Explicit sort picker wins; else the query's own default (genre tiles use "view").
    const sortby = sortingIdToMangagoSort(sortingOption) || query.metadata?.sortby || "";
    const url = title
      ? `${DOMAIN}/r/l_search?name=${encodeURIComponent(title)}&page=${page}`
      : buildGenreFilterUrl(query.metadata, page, sortby);

    const html = await fetchText(url);
    const items = parseListings(html);

    return {
      items,
      metadata: hasNextPage(html) ? { page: page + 1 } : undefined,
    };
  }

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    return DISCOVER_SECTION_OPTIONS.filter((section) => getDiscoverSectionEnabled(section.id)).map(
      (section) => ({
        id: section.id,
        title: section.title,
        type: discoverSectionType(section.id),
      }),
    );
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata?: MangagoSearchMetadata,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const sectionId = normalizeDiscoverSectionId(section.id);

    // Genre grid: each tile runs a genre-filtered search when tapped. No fetch
    // needed — the genres are static, so this is a single page of items.
    if (sectionId === "genres") {
      const items: DiscoverSectionItem[] = GENRE_OPTIONS.map((genre) => ({
        type: "genresCarouselItem",
        name: genre.title,
        searchQuery: {
          title: "",
          // `genres` (keyed by genre id) drives getSearchResults; `genre` (the
          // display title) lets the advanced-search form pre-select this genre
          // when opened from the results.
          metadata: { genre: genre.title, genres: { [genre.id]: "included" }, sortby: "view" },
        },
        contentRating: contentRatingForGenres([genre.title]),
      }));

      return { items, metadata: undefined };
    }

    const page = metadata?.page ?? 1;
    const url = buildDiscoverUrl(sectionId, page);

    const html = await fetchText(url);
    const limit = discoverItemLimit(sectionId);

    // slice(0, undefined) returns the whole list, so uncapped sections keep
    // every item on the page.
    const searchItems = (
      sectionId === "new_chapters"
        ? filterNewChapters(parseLatestUpdates(html))
        : parseListings(html)
    ).slice(0, limit);

    const sectionType = discoverSectionType(sectionId);
    // Genre-locked tops (e.g. "top_yaoi") carry a known rating for every item.
    // Mixed sections (Featured/New/Popular) span all genres, so we leave their
    // rating unset rather than guessing.
    const sectionRating = sectionId.startsWith("top_")
      ? contentRatingForGenres([getGenreTitle(genreSlugFromTopSection(sectionId))])
      : undefined;

    // Featured hero: add rating + status pills from each title's detail page
    // (cached). Banner genre tops skip this and just show cover + latest chapter.
    if (sectionId === "featured_manga") {
      const heroItems = await Promise.all(
        searchItems
          .slice(0, FEATURED_HERO_LIMIT)
          .map(async (item): Promise<DiscoverSectionItem> => {
            const info = await getFeaturedInfo(item.mangaId);
            const pills: { symbol: string; text: string }[] = [];
            if (info.rating) pills.push({ symbol: "star.fill", text: info.rating });
            if (info.status) pills.push({ symbol: "book.fill", text: info.status });

            return {
              type: "featuredCarouselItem",
              mangaId: item.mangaId,
              title: item.title,
              imageUrl: item.imageUrl,
              supertitle: info.author ?? item.subtitle,
              summary: info.summary,
              infoItems: pills.length
                ? (pills.slice(0, 2) as FeaturedCarouselItem["infoItems"])
                : undefined,
              metadata: undefined,
            };
          }),
      );

      return { items: heroItems, metadata: undefined };
    }

    const items: DiscoverSectionItem[] = searchItems.flatMap((item): DiscoverSectionItem[] => {
      if (sectionType === DiscoverSectionType.featured) {
        return [
          {
            type: "featuredCarouselItem",
            mangaId: item.mangaId,
            title: item.title,
            imageUrl: item.imageUrl,
            supertitle: item.subtitle,
            contentRating: sectionRating,
            metadata: undefined,
          },
        ];
      }

      if (sectionType === DiscoverSectionType.chapterUpdates) {
        // chapterUpdatesCarouselItem requires a chapterId; drop tiles whose
        // latest-chapter link wasn't parseable.
        if (!item.chapterId) return [];
        return [
          {
            type: "chapterUpdatesCarouselItem",
            mangaId: item.mangaId,
            chapterId: item.chapterId,
            title: item.title,
            imageUrl: item.imageUrl,
            subtitle: item.subtitle,
            publishDate: item.publishDate,
            contentRating: item.genres?.length
              ? contentRatingForGenres(item.genres)
              : sectionRating,
            metadata: undefined,
          },
        ];
      }

      if (sectionType === DiscoverSectionType.prominentCarousel) {
        return [
          {
            type: "prominentCarouselItem",
            mangaId: item.mangaId,
            title: item.title,
            imageUrl: item.imageUrl,
            subtitle: item.subtitle,
            contentRating: sectionRating,
            metadata: undefined,
          },
        ];
      }

      return [
        {
          type: "simpleCarouselItem",
          mangaId: item.mangaId,
          title: item.title,
          imageUrl: item.imageUrl,
          subtitle: item.subtitle,
          contentRating: sectionRating,
          metadata: undefined,
        },
      ];
    });

    // Uncapped sections paginate: hand back the next page cursor whenever the
    // fetched page advertises a next page. Capped "Top N" sections and the
    // single-page zone homepage carousels (no pager) stop after one page.
    return {
      items,
      metadata:
        limit === undefined && hasNextPage(html) ? { ...metadata, page: page + 1 } : undefined,
    };
  }

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const html = await fetchText(mangaUrlFromId(mangaId));

    return parseMangaDetails(html, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const html = await fetchText(mangaUrlFromId(sourceManga.mangaId));

    return parseChapters(html, sourceManga);
  }

  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const originalChapterUrl = (
      chapter as Chapter & { additionalInfo?: { originalChapterUrl?: string } }
    ).additionalInfo?.originalChapterUrl;
    const initialChapterUrl = originalChapterUrl ?? chapterUrlFromId(chapter.chapterId);

    // Self-heal stale chapter URLs. A stored URL that is neither a proper
    // read-manga reader nor a numeric reader can never load (e.g. a prefix-less
    // "/uu/<chapter>/pg-N/"), so re-resolve it to the real read-manga URL by
    // matching this chapter in the freshly parsed list. Numeric URLs are not
    // re-resolved here — getMangagoPageUrls already sweeps every mirror, and many
    // titles only expose numeric links. Normalise first so the check and fetch
    // both see the real path.
    let chapterUrl = canonicalReaderUrl(initialChapterUrl);
    if (!isReadMangaReaderUrl(chapterUrl) && !isNumericChapterReaderUrl(chapterUrl)) {
      const resolved = await this.resolveReadMangaChapterUrl(chapter);
      if (resolved) chapterUrl = resolved;
    }

    // Fetch the reader, which returns the complete image list in one request. A
    // Cloudflare challenge surfaces as the bypass webview; a decode/parse failure
    // surfaces as an error rather than a silently short chapter.
    let pages: string[];
    try {
      pages = await getMangagoPageUrls(chapterUrl);
    } catch (error) {
      // A Cloudflare wall must reach the user as the bypass prompt.
      if (error instanceof CloudflareError) throw error;
      // Last resort for a numeric reader that failed on every mirror: try
      // upgrading to the read-manga reader via the fresh chapter list. Titles
      // with only numeric links won't match, so the original error stands.
      if (!isReadMangaReaderUrl(chapterUrl)) {
        const resolved = await this.resolveReadMangaChapterUrl(chapter);
        if (resolved && resolved !== chapterUrl) {
          pages = await getMangagoPageUrls(resolved);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages,
    };
  }

  // Upgrade a stale numeric chapter entry to its read-manga reader URL by
  // re-parsing the manga's chapter list and matching this chapter (by number +
  // title + version). Browsing uses the mobile UA, so the list comes back as
  // read-manga URLs; the retry + cache-bust guards against a momentarily stale
  // list. If no match is found, the caller surfaces a clear error.
  private async resolveReadMangaChapterUrl(chapter: Chapter): Promise<string | undefined> {
    const urlOf = (c: Chapter): string =>
      (c as Chapter & { additionalInfo?: { originalChapterUrl?: string } }).additionalInfo
        ?.originalChapterUrl ?? chapterUrlFromId(c.chapterId);

    const mangaUrl = mangaUrlFromId(chapter.sourceManga.mangaId);
    const MAX_RETRIES = 4;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const bust =
          attempt === 0 ? "" : `${mangaUrl.includes("?") ? "&" : "?"}_=${Date.now()}${attempt}`;
        const html = await fetchText(`${mangaUrl}${bust}`);
        const fresh = parseChapters(html, chapter.sourceManga).filter((c) =>
          isReadMangaReaderUrl(urlOf(c)),
        );

        // No read-manga URLs this round (a stale/numeric catalog); retry.
        if (fresh.length === 0) continue;

        // Match version (uploader/scanlation group) first so a stale entry for a
        // non-first upload doesn't get rewritten to another group's chapter.
        const match =
          fresh.find(
            (c) =>
              c.chapNum === chapter.chapNum &&
              c.title === chapter.title &&
              c.version === chapter.version,
          ) ??
          fresh.find((c) => c.chapNum === chapter.chapNum && c.title === chapter.title) ??
          // Bare chapter-number match, but only when the number is meaningful.
          // chapNum === 0 is the "unnumbered" sentinel (Extra/Oneshot/…) and every
          // unnumbered chapter collides at 0, so matching on the number alone would
          // open the wrong one. Those require a title match (the tiers above).
          (chapter.chapNum !== 0 ? fresh.find((c) => c.chapNum === chapter.chapNum) : undefined);

        return match ? urlOf(match) : undefined;
      } catch (error) {
        // Let a Cloudflare challenge propagate so the app opens the bypass flow.
        if (error instanceof CloudflareError) throw error;
        // A transient failure on one attempt shouldn't abort the upgrade; retry.
        continue;
      }
    }

    return undefined;
  }

  async cloudflareBypassCompleted(
    _request: Request,
    cookies: Cookie[],
    _localStorage: Record<string, string>,
  ): Promise<void> {
    for (const cookie of this.cookieStorageInterceptor.cookies) {
      this.cookieStorageInterceptor.deleteCookie(cookie);
    }

    for (const cookie of cookies) {
      if (cookie.expires && cookie.expires.getTime() <= Date.now()) {
        continue;
      }

      this.cookieStorageInterceptor.setCookie(cookie);
    }
  }
}

export const Mangago = new MangagoExtension();
