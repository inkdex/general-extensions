import {
  ContentRating,
  type SearchQuery,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import { MDImageQuality } from "./MangaDexHelper";
import {
  getCustomCoversEnabled,
  getLanguagePriority,
  getMangaThumbnail,
  getNativeTitleDisplay,
  getRelevanceScoringEnabled,
  getRomanizedPriorityEnabled,
  getSelectedCover,
  getShowChapter,
  getShowRatingIcons,
  getShowSearchRatingInSubtitle,
  getShowStatusIcons,
  getShowVolume,
  getTitleLanguages,
} from "./MangaDexSettings";
import { COVER_BASE_URL, MANGADEX_DOMAIN } from "./utils/CommonUtil";
import { relevanceScore } from "./utils/titleRelevanceScore";

// Type for manga item with additional processing
type MangaItemWithAdditionalInfo = MangaDex.MangaItem & {
  mangaId: string;
  title: string;
  imageUrl: string;
  subtitle?: string;
  contentRating?: ContentRating;
};

type MangaItemDetails = {
  primaryTitle: string;
  preferredLanguageTitle?: string;
  secondaryTitles: string[];
  synopsis: string;
  status: MangaDex.Status;
  contentRating: ContentRating;
  tagGroups: TagSection[];
  shareUrl: string;
};

// Maps MangaDex content ratings to Paperback content ratings
export const contentRatingMap: Record<string, ContentRating> = {
  safe: ContentRating.EVERYONE,
  suggestive: ContentRating.MATURE,
  erotica: ContentRating.ADULT,
  pornographic: ContentRating.ADULT,
};

// Icons for manga status display
const statusIconMap: Record<string, string> = {
  completed: "✅",
  ongoing: "▶️",
  hiatus: "⏸️",
  cancelled: "❌",
};

// Icons for content rating display
const ratingIconMap: Record<string, string> = {
  safe: "🟢",
  suggestive: "🟡",
  erotica: "🟠",
  pornographic: "🔞",
};

const getFirstLanguageMatch = (
  values: Record<string, string | undefined> | undefined,
  languages: string[],
): string | undefined => {
  if (!values) return undefined;
  for (const lang of languages) {
    const match = values[lang];
    if (match) return match;
  }
  return undefined;
};

const getFirstLanguageMatchFromAlt = (
  altTitles: MangaDex.AltTitle[] | undefined,
  languages: string[],
): string | undefined => {
  if (!altTitles) return undefined;
  for (const lang of languages) {
    for (const alt of altTitles) {
      const match = (alt as Record<string, string | undefined>)[lang];
      if (match) return match;
    }
  }
  return undefined;
};

const getFirstValue = (
  values: Record<string, string | undefined> | undefined,
): string | undefined => Object.values(values ?? {}).find((v) => v);

/**
 * Parses manga list from API response and formats for display
 * Handles relevance sorting and thumbnail formatting
 */
export const parseMangaList = async (
  object: MangaDex.MangaItem[],
  thumbnailSelector: () => string,
  query?: SearchQuery,
  ratingJson?: MangaDex.StatisticsResponse,
  chapterDetailsMap?: Record<string, MangaDex.ChapterAttributes>,
): Promise<MangaItemWithAdditionalInfo[]> => {
  const results: { manga: MangaItemWithAdditionalInfo; relevance: number }[] = [];

  const thumbnailQuality = thumbnailSelector();
  const useCustomCovers = getCustomCoversEnabled();
  const languages = getTitleLanguages();

  for (const manga of object) {
    const mangaId = manga.id;
    const mangaDetails = manga.attributes;
    const titleMatch =
      getFirstLanguageMatch(mangaDetails.title as Record<string, string | undefined>, languages) ??
      getFirstLanguageMatchFromAlt(mangaDetails.altTitles, languages) ??
      getFirstValue(mangaDetails.title as Record<string, string | undefined>) ??
      "";

    const title = Application.decodeHTMLEntities(titleMatch);

    let coverFileName = manga.relationships
      .filter((x): x is MangaDex.Relationship => x.type.valueOf() === "cover_art")
      .map((x) => x.attributes?.fileName)[0];

    if (useCustomCovers) {
      const customCover = getSelectedCover(mangaId);
      if (customCover?.fileName) {
        coverFileName = customCover.fileName;
      }
    }

    const image = coverFileName
      ? `${COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(thumbnailQuality)}`
      : `${MANGADEX_DOMAIN}/_nuxt/img/cover-placeholder.d12c3c5.jpg`;

    const showStatusIcons = getShowStatusIcons();
    const showRatingIcons = getShowRatingIcons();

    const statusIcon = showStatusIcons
      ? statusIconMap[mangaDetails.status.toLowerCase()] || ""
      : "";
    const ratingIcon = showRatingIcons
      ? ratingIconMap[mangaDetails.contentRating.toLowerCase()] || ""
      : "";

    let chapterVolume: string | undefined = mangaDetails.lastVolume;
    let chapterNumber: string | undefined = mangaDetails.lastChapter;

    if (chapterDetailsMap && manga.attributes.latestUploadedChapter) {
      const latestChapterDetails = chapterDetailsMap[manga.attributes.latestUploadedChapter];
      if (latestChapterDetails) {
        chapterVolume = latestChapterDetails.volume ?? undefined;
        chapterNumber = latestChapterDetails.chapter ?? undefined;
      }
    }

    const chapterInfo = parseChapterTitle({
      title: undefined,
      volume: chapterVolume,
      chapter: chapterNumber,
    });

    const rating = ratingJson?.statistics?.[mangaId]?.rating?.average
      ? (ratingJson.statistics[mangaId].rating.average * 10).toFixed(0) + "%"
      : "";

    const subtitle =
      `${ratingIcon}${statusIcon}${rating}${statusIcon || ratingIcon || rating ? " " : ""}${chapterInfo}`.trim();

    let displayTitle = title;
    if (
      getShowChapter() ||
      getShowVolume() ||
      getShowRatingIcons() ||
      getShowSearchRatingInSubtitle() ||
      getShowStatusIcons() ||
      (title.length > 0 && title.length < 35)
    ) {
      displayTitle += " ".repeat(30) + " ‍"; // Force 2 lines for consistency
    }

    let relevance = 0;
    if (query?.title && getRelevanceScoringEnabled()) {
      // Score primary title
      relevance = relevanceScore(title, query.title);

      // Score all alternative titles and take the max
      const altTitles: string[] =
        mangaDetails.altTitles
          ?.flatMap((x: MangaDex.AltTitle) => Object.values(x) as string[])
          .map((x: string) => Application.decodeHTMLEntities(x)) || [];
      for (const alt of altTitles) {
        const altScore = relevanceScore(alt, query.title);
        if (altScore > relevance) {
          relevance = altScore;
        }
      }
    }

    results.push({
      manga: {
        ...manga,
        mangaId: mangaId,
        title: displayTitle,
        imageUrl: image,
        subtitle: subtitle,
        contentRating:
          contentRatingMap[(mangaDetails.contentRating as string)?.toLowerCase() ?? ""] ??
          ContentRating.EVERYONE,
      },
      relevance: relevance,
    });
  }

  if (query?.title && getRelevanceScoringEnabled()) {
    results.sort((a, b) => b.relevance - a.relevance);
  }
  return results.map((r) => r.manga);
};

/**
 * Parses detailed manga information from API response
 */
export const parseMangaDetails = (
  mangaId: string,
  json: MangaDex.MangaDetailsResponse,
  ratingJson?: MangaDex.StatisticsResponse,
  coversJson?: MangaDex.CoverArtResponse,
): SourceManga => {
  const mangaDetails: MangaDex.DatumAttributes = json.data.attributes;

  const mangaItemDetails = parseMangaItemDetails(mangaId, mangaDetails);

  let author: string | undefined =
    json.data.relationships
      .filter((x): x is MangaDex.Relationship => x.type.valueOf() === "author")
      .map((x) => x.attributes?.name)
      .filter(Boolean)
      .join(", ") || undefined;

  let artist: string | undefined =
    json.data.relationships
      .filter((x): x is MangaDex.Relationship => x.type.valueOf() === "artist")
      .map((x) => x.attributes?.name)
      .filter(Boolean)
      .join(", ") || undefined;

  let synopsis = mangaItemDetails.synopsis ?? "No Description";

  const nativeTitleDisplay = getNativeTitleDisplay();
  const preferredTitle = mangaItemDetails.preferredLanguageTitle;
  if (preferredTitle && preferredTitle !== mangaItemDetails.primaryTitle) {
    if (nativeTitleDisplay === "author") {
      author = preferredTitle;
      artist = undefined;
    } else if (nativeTitleDisplay === "author_desc") {
      const credits: string[] = [];
      if (author) credits.push(author);
      if (artist && artist !== author) credits.push(artist);
      const suffix = credits.length > 0 ? ` (${credits.join(", ")})` : "";
      author = `${preferredTitle}${suffix}`;
      artist = undefined;
    }
  }

  let image = "";

  let coverFileName = json.data.relationships
    .filter((x): x is MangaDex.Relationship => x.type.valueOf() === "cover_art")
    .map((x) => x.attributes?.fileName)[0];

  if (getCustomCoversEnabled()) {
    const customCover = getSelectedCover(mangaId);
    if (customCover?.fileName) {
      coverFileName = customCover.fileName;
    }
  }

  if (coverFileName) {
    image = `${COVER_BASE_URL}/${mangaId}/${coverFileName}${MDImageQuality.getEnding(getMangaThumbnail())}`;
  }

  const rating = ratingJson?.statistics?.[mangaId]?.rating?.average
    ? ratingJson.statistics[mangaId].rating.average / 10
    : undefined;

  const artworkUrls: string[] = [];
  if (coversJson?.result === "ok" && coversJson.data) {
    for (const cover of coversJson.data) {
      if (cover.attributes.fileName) {
        artworkUrls.push(`${COVER_BASE_URL}/${mangaId}/${cover.attributes.fileName}`);
      }
    }
  }

  return {
    mangaId: mangaId,
    mangaInfo: {
      primaryTitle: mangaItemDetails.primaryTitle,
      secondaryTitles: mangaItemDetails.secondaryTitles,
      thumbnailUrl: image,
      author,
      artist,
      synopsis,
      status: mangaItemDetails.status,
      tagGroups: mangaItemDetails.tagGroups,
      contentRating: mangaItemDetails.contentRating,
      shareUrl: mangaItemDetails.shareUrl,
      rating,
      artworkUrls: artworkUrls.length > 0 ? artworkUrls : undefined,
    },
  };
};

export function parseMangaItemDetails(
  mangaId: string,
  mangaDetails: MangaDex.DatumAttributes,
): MangaItemDetails {
  const languages = getTitleLanguages();

  const primaryTitleMatch =
    getFirstLanguageMatch(mangaDetails.title as Record<string, string | undefined>, languages) ??
    getFirstLanguageMatchFromAlt(mangaDetails.altTitles, languages) ??
    getFirstValue(mangaDetails.title as Record<string, string | undefined>) ??
    "";

  const primaryTitle: string = Application.decodeHTMLEntities(primaryTitleMatch);

  let preferredLanguageTitle: string | undefined;
  if (getRomanizedPriorityEnabled()) {
    const priority = getLanguagePriority();
    const preferredMatch =
      getFirstLanguageMatch(mangaDetails.title as Record<string, string | undefined>, priority) ??
      getFirstLanguageMatchFromAlt(mangaDetails.altTitles, priority);
    if (preferredMatch) {
      preferredLanguageTitle = Application.decodeHTMLEntities(preferredMatch);
    }
  }

  const secondaryTitles: string[] = mangaDetails.altTitles.flatMap(
    (x: MangaDex.AltTitle) => Object.values(x) as string[],
  );

  const descriptionMatch =
    getFirstLanguageMatch(
      mangaDetails.description as Record<string, string | undefined>,
      languages,
    ) ??
    (mangaDetails.description as Record<string, string | undefined>).en ??
    "";

  const desc = Application.decodeHTMLEntities(descriptionMatch)?.replace(/\[\/?[bus]]/g, "") ?? "";

  const hasAniList = Boolean((mangaDetails.links as MangaDex.Links | undefined)?.al);
  const hasMangaUpdates = Boolean((mangaDetails.links as MangaDex.Links | undefined)?.mu);
  const hasMyAnimeList = Boolean((mangaDetails.links as MangaDex.Links | undefined)?.mal);

  let synopsis = desc;
  if (hasAniList || hasMangaUpdates || hasMyAnimeList) {
    const trackers: string[] = [];
    if (hasAniList) trackers.push("AniList");
    if (hasMangaUpdates) trackers.push("MangaUpdates");
    if (hasMyAnimeList) trackers.push("MyAnimeList");
    const trackingLine = `Tracking available for:\n${trackers.join("\n")}`;
    synopsis = synopsis ? `${synopsis}\n\n${trackingLine}` : trackingLine;
  }

  if (
    getNativeTitleDisplay() === "description" &&
    preferredLanguageTitle &&
    preferredLanguageTitle !== primaryTitle
  ) {
    synopsis = synopsis ? `${preferredLanguageTitle}\n\n${synopsis}` : preferredLanguageTitle;
  }

  const status = mangaDetails.status;

  const tags: Tag[] = mangaDetails.tags
    .map((tag) => ({
      id: tag.id,
      title: tag.attributes.name.en ?? "Unknown",
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    primaryTitle,
    preferredLanguageTitle,
    secondaryTitles,
    synopsis,
    status,
    tagGroups: [{ id: "tags", title: "Tags", tags }],
    contentRating:
      contentRatingMap[(mangaDetails.contentRating as string)?.toLowerCase() ?? ""] ??
      ContentRating.EVERYONE,
    shareUrl: `${MANGADEX_DOMAIN}/title/${mangaId}`,
  };
}

/**
 * Formats chapter title with volume and chapter numbers based on settings
 */
export function parseChapterTitle(attributes: Partial<MangaDex.ChapterAttributes>): string {
  const title = attributes.title?.trim() || "";
  const showVolume = getShowVolume();
  const showChapter = getShowChapter();

  let volumePrefix = "Vol.";
  let chapterPrefix = "Ch.";
  if (getShowSearchRatingInSubtitle()) {
    volumePrefix = "V.";
    chapterPrefix = "C.";
  }
  const volume = showVolume && attributes.volume ? `${volumePrefix} ${attributes.volume} ` : "";
  const chapter = showChapter && attributes.chapter ? `${chapterPrefix} ${attributes.chapter}` : "";

  return `${volume}${chapter}${title ? ` - ${title}` : ""}`.trim();
}
