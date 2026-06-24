/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type ChapterDetails,
  type DiscoverSectionItem,
  type SearchResultItem,
  type SortingOption,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";

import { DOMAIN, HEART_UNICODE } from "./models";
import type {
  ChapterDetail,
  ChapterReaderResponse,
  HomepageResponse,
  SeriesDetail,
  SeriesDetailResponse,
  SeriesListItem,
  SimpleSeriesListItem,
  SortableListItem,
} from "./models";
import type { FlameApi } from "./network";

export class FlameParser {
  constructor(private api: FlameApi) {}

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  /**
   * FlameComics doesn't expose a per-series content rating, so we treat
   * everything as EVERYONE by default.
   * TODO: revisit if a flag for "Mature" or "Adult" appears in future API.
   */
  private contentRatingFor(_item: { country?: string; tags?: string[] }): ContentRating {
    return ContentRating.EVERYONE;
  }

  /** Format a chapter number string, stripping unnecessary trailing zeroes (e.g. "75.00" → "75"). */
  private formatChapNum(raw: string): string {
    const n = Number.parseFloat(raw);
    return Number.isNaN(n) ? raw : String(n);
  }

  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "") // Remove all HTML tags
      .replace(/&amp;/g, "&") // Decode common HTML entities
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .trim(); // Remove leading/trailing whitespace
  }

  /** Check if a series item is a novel (which we can't render properly). */
  isNovel(item: SeriesListItem): boolean {
    // A novel has novel_id set, or type contains "Novel"
    return item.novel_id != null || (item.type?.toLowerCase().includes("novel") ?? false);
  }

  /** Convert unix epoch (seconds) to a relative time string (e.g. "2 days ago"). */
  private getRelativeTime(unixEpochSeconds: number): string {
    const now = Math.floor(Date.now() / 1000);
    const secondsAgo = now - unixEpochSeconds;

    if (secondsAgo < 60) return "just now";
    if (secondsAgo < 3600) return `${Math.round(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.round(secondsAgo / 3600)}h ago`;
    if (secondsAgo < 2592000) return `${Math.round(secondsAgo / 86400)}d ago`;
    if (secondsAgo < 31536000) return `${Math.round(secondsAgo / 2592000)}mo ago`;
    return `${Math.round(secondsAgo / 31536000)}y ago`;
  }

  mergeToAddYearToLatest(
    latestItem: SeriesListItem,
    browseItem: SeriesListItem | undefined,
  ): SeriesListItem {
    if (!latestItem.year) latestItem.year = browseItem?.year;
    if (!latestItem.description) latestItem.description = browseItem?.description;
    if (!latestItem.categories) latestItem.categories = browseItem?.categories;
    if (!latestItem.author) latestItem.author = browseItem?.author;
    if (!latestItem.artist) latestItem.artist = browseItem?.artist;
    if (!latestItem.publisher) latestItem.publisher = browseItem?.publisher;
    if (!latestItem.time) latestItem.time = browseItem?.time;
    return latestItem;
  }

  addYearToLatestList(latest: SeriesListItem[], browse: SeriesListItem[]): SeriesListItem[] {
    const browseMap = new Map(browse.map((item) => [item.series_id, item]));
    return latest.map((latestItem) =>
      this.mergeToAddYearToLatest(latestItem, browseMap.get(latestItem.series_id)),
    );
  }

  mergeToMakeSortableType(
    browseItem: SeriesListItem,
    simpleItem: SimpleSeriesListItem | undefined,
  ): SortableListItem {
    return {
      /** Numeric primary key — used to build CDN image URLs. */
      series_id: browseItem.series_id,
      title: browseItem.title,
      description: browseItem.description ?? "",
      language: browseItem.language ?? "English",
      /** e.g. "Manhwa", "Manga", "Manhua", "Comic", "Web Novel". */
      type: browseItem.type ?? "",
      /** Genre list, either as `categories` (genre listing) or `tags` (homepage). */
      categories: browseItem.categories ?? browseItem.tags ?? [],
      /** ISO country code, e.g. "KR", "JP", "CN". */
      country: browseItem.country ?? "",
      author: browseItem.author ?? [],
      artist: browseItem.artist ?? [],
      publisher: browseItem.publisher ?? [],
      year: browseItem.year ?? 0,
      /** "Ongoing", "Completed", "Hiatus", "Cancelled", "Dropped", … */
      status: browseItem.status ?? "",
      likes: browseItem.likes ?? 0,
      /** Thumbnail filename — typically "thumbnail.png" / ".jpeg" / ".webp". */
      cover: browseItem.cover,
      /** Unix epoch (seconds) — used as cache-busting query string and as a "version" tag. */
      last_edit: browseItem.last_edit,

      updated: browseItem.updated ?? browseItem.last_edit,
      /** Unix epoch (seconds) of creation. */
      time: browseItem.time ?? browseItem.last_edit,
      /** Present on the "Latest" homepage block. */
      chapter_count: Number(simpleItem?.chapter_count ?? 0),
      chapters: browseItem.chapters ?? [],
    };
  }

  // merge lists into a sortable list
  addChapterCountToBrowseList(
    browse: SeriesListItem[],
    simple: SimpleSeriesListItem[],
  ): SortableListItem[] {
    const simpleMap = new Map(simple.map((item) => [item.id, item]));
    return browse.map((browseItem) =>
      this.mergeToMakeSortableType(browseItem, simpleMap.get(browseItem.series_id)),
    );
  }

  /** Convert any list-style series item to a SearchResultItem (used by genre + search). */
  toSearchResultItem(item: SortableListItem, sortingOption: SortingOption): SearchResultItem {
    let subtitle: string;

    if (item.chapters && item.chapters.length > 0)
      subtitle = "Ch. " + this.formatChapNum(item.chapters[0].chapter);
    else subtitle = item.chapter_count.toString() + " Chaps";

    switch (sortingOption.id) {
      case "year":
        subtitle += " | " + item.year;
        break;
      case "likes":
        subtitle += " | " + item.likes.toString() + " " + HEART_UNICODE;
        break;
      case "latest":
        subtitle += " | " + this.getRelativeTime(item.updated);
        break;
      default:
        break;
    }

    return {
      mangaId: String(item.series_id),
      title: item.title,
      imageUrl: this.api.buildSeriesCoverUrl(item.series_id, item.cover, item.last_edit),
      contentRating: this.contentRatingFor(item),
      subtitle: subtitle,
    };
  }

  // -------------------------------------------------------------------------
  // Homepage
  // -------------------------------------------------------------------------

  /**
   * The homepage payload is a bag of named blocks. Each block has a `series`
   * array and (optionally) an embedded chapter list.
   *
   * We expose distinct discover sections per block type so Paperback can
   * render them as different carousels.
   */
  parseHomepageSection(
    sectionId: string,
    response: HomepageResponse,
  ): { items: DiscoverSectionItem[]; metadata: undefined } {
    const props = response.pageProps;

    switch (sectionId) {
      case "popular": {
        const series = (props.popularEntries?.blocks?.[0]?.series ?? []).filter(
          (s) => !this.isNovel(s),
        );
        return {
          items: series.map((s) => ({
            type: "featuredCarouselItem" as const,
            mangaId: String(s.series_id),
            title: s.title,
            imageUrl: this.api.buildSeriesCoverUrl(s.series_id, s.cover, s.last_edit),
            contentRating: this.contentRatingFor(s),
            subtitle: s.type ?? "",
          })),
          metadata: undefined,
        };
      }

      case "latest": {
        // Latest block includes a chapter list per series — emit
        // `chapterUpdatesCarouselItem`s so Paperback shows the chapter info.
        const series = (props.latestEntries?.blocks?.[0]?.series ?? []).filter(
          (s) => !this.isNovel(s),
        );
        const items: DiscoverSectionItem[] = [];
        for (const s of series) {
          const topChapter = s.chapters?.[0];
          items.push({
            type: "chapterUpdatesCarouselItem",
            mangaId: String(s.series_id),
            chapterId: topChapter ? `${s.series_id}:${topChapter.token}` : String(s.series_id),
            title: s.title,
            imageUrl: this.api.buildSeriesCoverUrl(s.series_id, s.cover, s.last_edit),
            contentRating: this.contentRatingFor(s),
            subtitle: topChapter ? `Ch. ${this.formatChapNum(topChapter.chapter)}` : (s.type ?? ""),
            publishDate: topChapter ? new Date(topChapter.release_date * 1000) : undefined,
          });
        }
        return { items, metadata: undefined };
      }

      case "staff": {
        const series = (props.staffPicks?.blocks?.[0]?.series ?? []).filter(
          (s) => !this.isNovel(s),
        );
        return {
          items: series.map((s) => ({
            type: "prominentCarouselItem" as const,
            mangaId: String(s.series_id),
            title: s.title,
            imageUrl: this.api.buildSeriesCoverUrl(s.series_id, s.cover, s.last_edit),
            contentRating: this.contentRatingFor(s),
            subtitle: s.type ?? "",
          })),
          metadata: undefined,
        };
      }

      default:
        return { items: [], metadata: undefined };
    }
  }

  // -------------------------------------------------------------------------
  // Series detail
  // -------------------------------------------------------------------------

  parseSeriesDetail(seriesId: string, response: SeriesDetailResponse): SourceManga {
    const series: SeriesDetail = response.pageProps.series;
    if (!series) {
      throw new Error(`FlameComics: empty series payload for id=${seriesId}`);
    }

    // Build genre tags from the `tags` array (detail endpoint flavor).
    // Use the genre name as both id and title — the genre listing endpoint
    // works off the lowercased slug.
    const genreTags: Tag[] = (series.tags ?? []).map((t) => ({
      id: t.toLowerCase().replace(/\s+/g, "-"),
      title: t,
    }));

    const tagSections: TagSection[] = [{ id: "genres", title: "Genres", tags: genreTags }];

    return {
      mangaId: seriesId,
      mangaInfo: {
        thumbnailUrl: this.api.buildSeriesCoverUrl(
          series.series_id,
          series.cover,
          series.last_edit,
        ),
        synopsis: this.extractTextFromHtml(series.description ?? ""),
        primaryTitle: series.title,
        secondaryTitles: series.altTitles ?? [],
        contentRating: this.contentRatingFor(series),
        status: series.status ?? "Unknown",
        // FlameComics doesn't expose a separate banner — reuse the cover.
        bannerUrl: this.api.buildSeriesCoverUrl(series.series_id, series.cover, series.last_edit),
        artist: (series.artist ?? []).join(", "),
        author: (series.author ?? []).join(", "),
        // No rating exposed — leave at 0.
        rating: 0,
        tagGroups: tagSections,
        shareUrl: `${DOMAIN}/series/${series.series_id}`,
      },
    };
  }
  // -------------------------------------------------------------------------
  // Chapter list
  // -------------------------------------------------------------------------

  parseChapters(sourceManga: SourceManga, response: SeriesDetailResponse): Chapter[] {
    const chapters: ChapterDetail[] = response.pageProps.chapters ?? [];

    return chapters.map((c) => {
      const chapNum = Number.parseFloat(c.chapter) || 0;
      return {
        // We need both series_id AND token to fetch pages, so encode both
        // into a single chapterId: "<series_id>:<token>".
        chapterId: `${c.series_id}:${c.token}`,
        sourceManga,
        // Use the chapter's language if present, otherwise fall back to "en"
        // (FlameComics is an English-only scanlation site).
        langCode: "en",
        chapNum,
        title: c.title && c.title.length > 0 ? c.title : `Chapter ${this.formatChapNum(c.chapter)}`,
        volume: 0,
        // No group/uploader info exposed here.
        sortingIndex: chapNum,
        publishDate: new Date(c.release_date * 1000),
        additionalInfo: { token: c.token },
      } satisfies Chapter;
    });
  }

  // -------------------------------------------------------------------------
  // Chapter pages
  // -------------------------------------------------------------------------

  parseChapterDetails(chapterId: string, response: ChapterReaderResponse): ChapterDetails {
    const chapter = response.pageProps.chapter;
    const seriesId = chapter.series_id;
    const token = chapter.token;

    // `images` is keyed by stringified page indices ("0", "1", ...). Sort
    // numerically — JS objects don't guarantee order for non-integer keys,
    // but Next.js serializes them as numbers so iteration order is usually
    // correct. Still: sort defensively.
    const pageEntries = Object.entries(chapter.images).sort(([a], [b]) => Number(a) - Number(b));

    const pages = pageEntries.map(([, img]) =>
      this.api.buildChapterImageUrl(seriesId, token, img.name),
    );

    return {
      id: chapterId,
      mangaId: String(seriesId),
      pages,
    };
  }
}
