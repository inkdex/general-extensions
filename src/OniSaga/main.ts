/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  BasicRateLimiter,
  ContentRating,
  CookieStorageInterceptor,
  DiscoverSectionType,
  type AdvancedSearchForm,
  type Chapter,
  type ChapterDetails,
  type Cookie,
  type DiscoverSection,
  type DiscoverSectionItem,
  type ExtensionImpl,
  type FeaturedCarouselItem,
  type Form,
  type PagedResults,
  type Request,
  type SearchQuery,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";
import * as cheerio from "cheerio";

import {
  getDiscoverStatus,
  getDiscoverType,
  getExcludedGenres,
  getLanguages,
  getSectionsOrder,
  getShowNsfw,
  OniSagaAdvancedSearchForm,
  OniSagaSettingsForm,
} from "./forms";
import {
  DEFAULT_SORT,
  DOMAIN,
  SECTION_TOGGLES,
  SORT_OPTIONS,
  TYPE_OPTIONS,
  type LivewireResponse,
  type LivewireState,
  type OniSagaSearchMetadata,
  type PostFilterUpdates,
} from "./models";
import { OniSagaInterceptor } from "./network";
import {
  buildStatSubtitle,
  componentHtmlByName,
  countPages,
  extractReaderToken,
  hasNextPage,
  parseChapters,
  parseGenres,
  parseMangaCards,
  parseMangaDetails,
  parseTopManga,
  topMangaSubtitle,
  type MangaCard,
  type TopMangaItem,
} from "./parsers";
import type OniSagaConfig from "./pbconfig";
import {
  cacheGenres,
  genresAreStale,
  getGenres,
  mangaIdFromHref,
  parseJson,
  straightenQuotes,
} from "./utils/helpers";
import {
  buildBrowseRequest,
  buildLoadMoreChaptersRequest,
  buildSectionToggleRequest,
  defaultUpdates,
  extractLivewireState,
  isDefaultUpdates,
  livewireHeaders,
} from "./utils/livewire";

const FEATURED_LIMIT = 10;

// Carousel style per rail; toggle rails render as chip rows.
function discoverSectionType(id: string): DiscoverSectionType {
  if (SECTION_TOGGLES[id]) return DiscoverSectionType.genres;
  switch (id) {
    case "top_manga":
      return DiscoverSectionType.featured;
    case "highest_rated":
      return DiscoverSectionType.prominentCarousel;
    case "genres":
    case "types":
      return DiscoverSectionType.genres;
    default:
      return DiscoverSectionType.simpleCarousel;
  }
}

// Featured hero stat pills: ★ rating and read count, when present.
function topMangaInfoItems(item: TopMangaItem): FeaturedCarouselItem["infoItems"] {
  const pills: { symbol: string; text: string }[] = [];
  if (item.rating) pills.push({ symbol: "star.fill", text: item.rating });
  if (item.reads) pills.push({ symbol: "flame.fill", text: item.reads });
  if (pills.length === 0) return undefined;
  return (
    pills.length === 1 ? [pills[0]] : [pills[0], pills[1]]
  ) as FeaturedCarouselItem["infoItems"];
}

export class OniSagaExtension implements ExtensionImpl<typeof OniSagaConfig> {
  requestManager = new OniSagaInterceptor("onisaga-request");
  cookieStorageInterceptor = new CookieStorageInterceptor({ storage: "stateManager" });
  // Stay under the site's per-IP throttle (a burst 429s the reader's page API);
  // images are ignored and load freely.
  globalRateLimiter = new BasicRateLimiter("onisaga-rate-limiter", {
    numberOfRequests: 3,
    bufferInterval: 1,
    ignoreImages: true,
  });

  // Cached `post-filter` state (token + snapshot) for the active browse URL.
  private browseStateCache?: { url: string; state: LivewireState; at: number };
  private static readonly BROWSE_STATE_TTL = 60_000;

  // Cached server-rendered home document, shared by the home-sourced rails.
  private homeHtmlCache?: { html: string; at: number };
  private static readonly HOME_TTL = 60_000;

  async initialise(): Promise<void> {
    this.cookieStorageInterceptor.registerInterceptor();
    this.requestManager.registerInterceptor();
    this.globalRateLimiter.registerInterceptor();
  }

  async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
    for (const cookie of cookies) {
      if (
        cookie.name.startsWith("cf") ||
        cookie.name.startsWith("_cf") ||
        cookie.name.startsWith("__cf")
      ) {
        this.cookieStorageInterceptor.setCookie(cookie);
      }
    }
  }

  async getSettingsForm(): Promise<Form> {
    return new OniSagaSettingsForm();
  }

  async getAdvancedSearchForm(
    query: SearchQuery<OniSagaSearchMetadata>,
  ): Promise<AdvancedSearchForm> {
    return new OniSagaAdvancedSearchForm(query);
  }

  async getSortingOptions(): Promise<SortingOption[]> {
    return SORT_OPTIONS.map((option) => ({ id: option.id, label: option.title }));
  }

  // =============================== Discover ====================================

  async getDiscoverSections(): Promise<DiscoverSection[]> {
    void this.refreshGenres();
    return getSectionsOrder().map((section) => ({
      id: section.id,
      title: section.title,
      type: discoverSectionType(section.id),
    }));
  }

  // Refetch the genre list from the browse filter once per TTL and cache it.
  private async refreshGenres(): Promise<void> {
    const now = Date.now();
    if (!genresAreStale(now)) return;
    try {
      const $ = await this.fetchCheerio({ url: `${DOMAIN}/browse`, method: "GET" });
      const genres = parseGenres($);
      if (genres.length > 0) cacheGenres(genres, now);
    } catch {
      // Keep the current cache / fallback.
    }
  }

  async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: { page?: number; collectedIds?: string[] } | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    // Toggle rails render as chip rows; a chip tap routes through getSearchResults.
    const toggle = SECTION_TOGGLES[section.id];
    if (toggle) {
      return {
        items: toggle.options.map((option) => ({
          type: "genresCarouselItem",
          searchQuery: {
            title: "",
            metadata: {
              toggleSection: section.id,
              toggleValue: option.id,
            } satisfies OniSagaSearchMetadata,
          },
          name: option.title,
        })),
      };
    }

    switch (section.id) {
      case "top_manga":
        return this.getTopMangaFeatured();
      case "latest":
        return this.browseDiscover(DEFAULT_SORT, metadata, (card) => ({
          type: "simpleCarouselItem",
          mangaId: card.mangaId,
          imageUrl: card.imageUrl,
          title: card.title,
          subtitle: buildStatSubtitle(card),
          contentRating: card.contentRating,
        }));
      case "highest_rated": {
        const items = await this.fetchTopManga("rated");
        return {
          items: items.map((item) => ({
            type: "prominentCarouselItem",
            mangaId: item.mangaId,
            imageUrl: item.imageUrl,
            title: item.title,
            subtitle: topMangaSubtitle(item),
            contentRating: item.contentRating,
          })),
        };
      }
      case "fan_favorites":
        return this.fetchFanFavorites();
      case "genres":
        return {
          items: getGenres().map((genre) => ({
            type: "genresCarouselItem",
            searchQuery: {
              title: "",
              metadata: { genres: { [genre.id]: "included" } } satisfies OniSagaSearchMetadata,
            },
            name: genre.title,
          })),
        };
      case "types":
        return {
          items: TYPE_OPTIONS.filter((t) => t.id).map((type) => ({
            type: "genresCarouselItem",
            searchQuery: {
              title: "",
              metadata: { type: type.id } satisfies OniSagaSearchMetadata,
            },
            name: type.title,
          })),
        };
      default:
        return { items: [] };
    }
  }

  private async browseDiscover(
    sort: string,
    metadata: { page?: number; collectedIds?: string[] } | undefined,
    map: (card: MangaCard) => DiscoverSectionItem,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    const page = metadata?.page ?? 1;
    const collectedIds = metadata?.collectedIds ?? [];

    const updates = defaultUpdates();
    updates.sort = sort;
    updates.platform = getDiscoverType();
    updates.status = getDiscoverStatus();
    updates.excludeGenre = getExcludedGenres();

    const { cards, hasNext } = await this.fetchBrowse(`${DOMAIN}/browse`, updates, page);
    const fresh = cards.filter((card) => !collectedIds.includes(card.mangaId));
    collectedIds.push(...fresh.map((card) => card.mangaId));

    return {
      items: fresh.map(map),
      metadata: hasNext ? { page: page + 1, collectedIds } : undefined,
    };
  }

  // Featured hero from the /top-manga ranking (one request, no per-item lookups).
  private async getTopMangaFeatured(): Promise<PagedResults<DiscoverSectionItem>> {
    const items = (await this.fetchTopManga("reads")).slice(0, FEATURED_LIMIT);

    return {
      items: items.map((item) => ({
        type: "featuredCarouselItem",
        mangaId: item.mangaId,
        imageUrl: item.imageUrl,
        title: item.title,
        supertitle: item.genres,
        infoItems: topMangaInfoItems(item),
        contentRating: item.contentRating,
      })),
    };
  }

  // The /top-manga ranking (by reads or rating); its rows carry the read count
  // and ★ rating that /browse cards lack.
  private async fetchTopManga(sort: "reads" | "rated"): Promise<TopMangaItem[]> {
    const showNsfw = getShowNsfw();
    try {
      const $ = await this.fetchCheerio({ url: `${DOMAIN}/top-manga?sort=${sort}`, method: "GET" });
      return parseTopManga($, showNsfw);
    } catch {
      return [];
    }
  }

  // /trending carries the Livewire toggle rails; pull it once and cache it.
  private async fetchHomeHtml(): Promise<string> {
    const now = Date.now();
    const cached = this.homeHtmlCache;
    if (cached && now - cached.at < OniSagaExtension.HOME_TTL) return cached.html;

    const [, buffer] = await Application.scheduleRequest({
      url: `${DOMAIN}/trending`,
      method: "GET",
    });
    const html = Application.arrayBufferToUTF8String(buffer);
    this.homeHtmlCache = { html, at: now };
    return html;
  }

  // Fan Favorites is a Livewire component on /home. Parse its server-rendered
  // cards; if the page ships an un-hydrated placeholder, drive its render.
  private async fetchFanFavorites(): Promise<PagedResults<DiscoverSectionItem>> {
    const showNsfw = getShowNsfw();
    try {
      const homeUrl = `${DOMAIN}/home`;
      const [, buffer] = await Application.scheduleRequest({ url: homeUrl, method: "GET" });
      const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

      const component = componentHtmlByName($, "fan-favorites");
      let cards = component ? parseMangaCards(cheerio.load(component), showNsfw) : [];

      if (cards.length === 0) {
        const state = extractLivewireState($, "fan-favorites");
        if (state) {
          const [, buf] = await Application.scheduleRequest({
            url: `${DOMAIN}/livewire/update`,
            method: "POST",
            headers: livewireHeaders(homeUrl),
            body: JSON.stringify(buildSectionToggleRequest(state, "setSort", "all-time")),
          });
          const json = parseJson<LivewireResponse>(
            Application.arrayBufferToUTF8String(buf),
            "livewire fan-favorites",
          );
          const rendered = json.components?.[0]?.effects?.html;
          cards = rendered ? parseMangaCards(cheerio.load(rendered), showNsfw) : [];
        }
      }

      return {
        items: cards.map((card) => ({
          type: "simpleCarouselItem",
          mangaId: card.mangaId,
          imageUrl: card.imageUrl,
          title: card.title,
          subtitle: buildStatSubtitle(card),
          contentRating: card.contentRating,
        })),
      };
    } catch {
      return { items: [] };
    }
  }

  // A toggle chip was tapped: drive the rail's Livewire method on /trending and
  // parse the re-rendered cards.
  private async getToggledSection(
    sectionId: string,
    value: string,
  ): Promise<PagedResults<SearchResultItem>> {
    const toggle = SECTION_TOGGLES[sectionId];
    if (!toggle) return { items: [] };

    try {
      const trendingUrl = `${DOMAIN}/trending`;
      const $ = cheerio.load(await this.fetchHomeHtml());
      const state = extractLivewireState($, toggle.component);
      if (!state) return { items: [] };

      const [, buffer] = await Application.scheduleRequest({
        url: `${DOMAIN}/livewire/update`,
        method: "POST",
        headers: livewireHeaders(trendingUrl),
        body: JSON.stringify(buildSectionToggleRequest(state, toggle.method, value)),
      });
      const json = parseJson<LivewireResponse>(
        Application.arrayBufferToUTF8String(buffer),
        "livewire toggle",
      );
      const html = json.components?.[0]?.effects?.html;
      const cards = html ? parseMangaCards(cheerio.load(html), getShowNsfw()) : [];

      return {
        items: cards.map((card) => ({
          mangaId: card.mangaId,
          title: card.title,
          imageUrl: card.imageUrl,
          contentRating: card.contentRating,
        })),
      };
    } catch {
      return { items: [] };
    }
  }

  // ================================ Search =====================================

  async getSearchResults(
    query: SearchQuery<OniSagaSearchMetadata>,
    metadata: { page?: number } | undefined,
    sortingOption?: SortingOption,
  ): Promise<PagedResults<SearchResultItem>> {
    // A discover toggle chip routes here with no title — fetch its ranged cards.
    if (query.metadata?.toggleSection) {
      return this.getToggledSection(query.metadata.toggleSection, query.metadata.toggleValue ?? "");
    }

    const title = straightenQuotes(query.title ?? "").trim();

    if (title.startsWith("http")) {
      const direct = await this.resolveDirectUrl(title);
      if (direct) return { items: [direct] };
    }

    const page = metadata?.page ?? 1;
    const baseUrl = title ? `${DOMAIN}/search/${encodeURIComponent(title)}` : `${DOMAIN}/browse`;
    const updates = this.searchUpdates(query.metadata ?? {}, sortingOption?.id);

    const { cards, hasNext } = await this.fetchBrowse(baseUrl, updates, page);

    return {
      items: cards.map((card) => ({
        mangaId: card.mangaId,
        title: card.title,
        imageUrl: card.imageUrl,
        contentRating: card.contentRating,
      })),
      metadata: hasNext ? { page: page + 1 } : undefined,
    };
  }

  private searchUpdates(meta: OniSagaSearchMetadata, sortId?: string): PostFilterUpdates {
    const updates = defaultUpdates();
    updates.sort = sortId || meta.sort || DEFAULT_SORT;
    updates.platform = meta.type ?? "";
    updates.status = meta.status ?? "";
    updates.min_chapters = meta.minChapters ?? "";

    const included: string[] = [];
    const excluded: string[] = [];
    for (const [id, value] of Object.entries(meta.genres ?? {})) {
      if (value === "included") included.push(id);
      else if (value === "excluded") excluded.push(id);
    }
    updates.genre = included;
    updates.excludeGenre = [...new Set([...excluded, ...getExcludedGenres()])];

    return updates;
  }

  private async resolveDirectUrl(rawUrl: string): Promise<SearchResultItem | undefined> {
    let mangaUrl = rawUrl;
    if (/\/read\//.test(rawUrl)) {
      const $ = await this.fetchCheerio({ url: rawUrl, method: "GET" });
      const href = $("a[href*='/manga/']").first().attr("href");
      if (href) mangaUrl = href;
    }

    const mangaId = mangaIdFromHref(mangaUrl);
    if (!mangaId) return undefined;

    const $ = await this.fetchCheerio({ url: `${DOMAIN}/manga/${mangaId}`, method: "GET" });
    const details = parseMangaDetails($, mangaId);
    return {
      mangaId,
      title: details.mangaInfo.primaryTitle,
      imageUrl: details.mangaInfo.thumbnailUrl ?? "",
      contentRating: details.mangaInfo.contentRating ?? ContentRating.EVERYONE,
    };
  }

  // ============================ Manga & Chapters ===============================

  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    const $ = await this.fetchCheerio({ url: `${DOMAIN}/manga/${mangaId}`, method: "GET" });
    return parseMangaDetails($, mangaId);
  }

  async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
    const mangaUrl = `${DOMAIN}/manga/${sourceManga.mangaId}`;
    const $ = await this.fetchCheerio({ url: mangaUrl, method: "GET" });

    let chapters = parseChapters($, sourceManga);

    // The chapter list is paginated client-side; one Livewire call that bumps the
    // loaded-counts past any real series returns the whole list at once.
    const state = extractLivewireState($, "manga.chapter-list");
    if (state) {
      try {
        const [, buffer] = await Application.scheduleRequest({
          url: `${DOMAIN}/livewire/update`,
          method: "POST",
          headers: livewireHeaders(mangaUrl),
          body: JSON.stringify(buildLoadMoreChaptersRequest(state)),
        });
        const json = parseJson<LivewireResponse>(
          Application.arrayBufferToUTF8String(buffer),
          "livewire chapters",
        );
        const html = json.components?.[0]?.effects?.html;
        if (html) {
          const full = parseChapters(cheerio.load(html), sourceManga);
          if (full.length > chapters.length) chapters = full;
        }
      } catch {
        // Keep the first server-rendered page if the bulk load fails.
      }
    }

    // Keep only the user's chosen languages (default English); fall back to all
    // when a title has none in those languages so the list is never empty.
    const languages = getLanguages();
    const inLanguage = chapters.filter((chapter) => languages.includes(chapter.langCode));
    if (inLanguage.length > 0) chapters = inLanguage;

    // Newest first: the highest chapter number gets the highest sortingIndex.
    chapters.sort((a, b) => b.chapNum - a.chapNum);
    chapters.forEach((chapter, index) => {
      chapter.sortingIndex = chapters.length - index;
    });
    return chapters;
  }

  // Open in one request: return a page-API url per page without resolving any.
  // The interceptor fetches each page's signed image lazily as it's shown, so a
  // long chapter opens instantly instead of resolving every page up front.
  async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
    const chapterUrl = `${DOMAIN}${chapter.chapterId}`;
    const segments = chapter.chapterId.split("/").filter(Boolean);
    const cid = segments[segments.length - 1] ?? "";

    const [, buffer] = await Application.scheduleRequest({ url: chapterUrl, method: "GET" });
    const body = Application.arrayBufferToUTF8String(buffer);

    const token = extractReaderToken(body);
    if (!token) throw new Error("Could not find reader token on chapter page");

    const pageCount = countPages(body);
    if (pageCount === 0) throw new Error("No pages found in chapter");

    this.requestManager.setReaderToken(cid, token);

    return {
      id: chapter.chapterId,
      mangaId: chapter.sourceManga.mangaId,
      pages: Array.from(
        { length: pageCount },
        (_, order) => `${DOMAIN}/api/chapter/${cid}/page/${order}`,
      ),
    };
  }

  // ============================== Livewire browse ==============================

  private async fetchBrowse(
    baseUrl: string,
    updates: PostFilterUpdates,
    page: number,
  ): Promise<{ cards: MangaCard[]; hasNext: boolean }> {
    const showNsfw = getShowNsfw();

    // Page 1 with default filters: the server-rendered HTML already holds the
    // first batch, so skip the Livewire round-trip.
    if (page === 1 && isDefaultUpdates(updates)) {
      const $ = await this.fetchCheerio({ url: baseUrl, method: "GET" });
      const state = extractLivewireState($, "post-filter");
      if (state) this.browseStateCache = { url: baseUrl, state, at: Date.now() };
      return { cards: parseMangaCards($, showNsfw), hasNext: hasNextPage($) };
    }

    const state = await this.resolveBrowseState(baseUrl);
    if (!state) return { cards: [], hasNext: false };

    const [, buffer] = await Application.scheduleRequest({
      url: `${DOMAIN}/livewire/update`,
      method: "POST",
      headers: livewireHeaders(baseUrl),
      body: JSON.stringify(buildBrowseRequest(state, updates, page)),
    });

    const json = parseJson<LivewireResponse>(
      Application.arrayBufferToUTF8String(buffer),
      "livewire browse",
    );
    const html = json.components?.[0]?.effects?.html;
    if (!html) {
      this.browseStateCache = undefined;
      return { cards: [], hasNext: false };
    }

    const newSnapshot = json.components?.[0]?.snapshot;
    if (newSnapshot) {
      this.browseStateCache = {
        url: baseUrl,
        state: { token: state.token, snapshot: newSnapshot },
        at: Date.now(),
      };
    }

    const $ = cheerio.load(html);
    return { cards: parseMangaCards($, showNsfw), hasNext: hasNextPage($) };
  }

  private async resolveBrowseState(baseUrl: string): Promise<LivewireState | undefined> {
    const now = Date.now();
    const cached = this.browseStateCache;
    if (cached && cached.url === baseUrl && now - cached.at < OniSagaExtension.BROWSE_STATE_TTL) {
      return cached.state;
    }

    const $ = await this.fetchCheerio({ url: baseUrl, method: "GET" });
    const state = extractLivewireState($, "post-filter");
    if (state) this.browseStateCache = { url: baseUrl, state, at: now };
    return state;
  }

  async fetchCheerio(request: Request): Promise<cheerio.CheerioAPI> {
    const [, data] = await Application.scheduleRequest(request);
    return cheerio.load(Application.arrayBufferToUTF8String(data));
  }
}

export const OniSaga = new OniSagaExtension();
