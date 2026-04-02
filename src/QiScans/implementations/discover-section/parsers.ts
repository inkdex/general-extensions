import type {
  ChapterUpdatesCarouselItem,
  DiscoverSectionItem,
  ProminentCarouselItem,
  SimpleCarouselItem,
} from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type {
  QIScansHomeChapter,
  QIScansHomeResponse,
  QIScansHomeSeriesItem,
} from "../shared/models";
import { encodeMangaId } from "../shared/utils";

function formatSeriesSubtitle(type?: string, status?: string): string {
  const parts = [type, status]
    .filter((value): value is string => Boolean(value))
    .map((value) =>
      value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    );

  return parts.join(" • ");
}

function isReadableSeries(series: QIScansHomeSeriesItem): boolean {
  if (!series.title || series.title.trim().length === 0) {
    return false;
  }

  if (series.title.startsWith("http://") || series.title.startsWith("https://")) {
    return false;
  }

  if (!series.slug || series.type === "NOVEL") {
    return false;
  }

  if (series.redirectUrl?.trim()) {
    return false;
  }

  return true;
}

function pickReadableChapter(
  chapters: QIScansHomeChapter[] | undefined,
): QIScansHomeChapter | undefined {
  return chapters?.find((chapter) => chapter.price === 0) ?? chapters?.[0];
}

function parseProminentItems(items: QIScansHomeSeriesItem[]): ProminentCarouselItem[] {
  return items.filter(isReadableSeries).map((series) => ({
    type: "prominentCarouselItem" as const,
    mangaId: encodeMangaId(series.slug),
    title: Application.decodeHTMLEntities(series.title),
    imageUrl: series.cover || "",
    subtitle: formatSeriesSubtitle(series.type, series.status),
    contentRating: ContentRating.EVERYONE,
  }));
}

function parseSimpleItems(items: QIScansHomeSeriesItem[]): SimpleCarouselItem[] {
  return items.filter(isReadableSeries).map((series) => ({
    type: "simpleCarouselItem" as const,
    mangaId: encodeMangaId(series.slug),
    title: Application.decodeHTMLEntities(series.title),
    imageUrl: series.cover || "",
    subtitle: formatSeriesSubtitle(series.type, series.status),
    contentRating: ContentRating.EVERYONE,
  }));
}

function parseChapterUpdateItems(items: QIScansHomeSeriesItem[]): ChapterUpdatesCarouselItem[] {
  return items.filter(isReadableSeries).flatMap((series) => {
    const chapter = pickReadableChapter(series.chapters);
    if (!chapter) {
      return [];
    }

    return [
      {
        type: "chapterUpdatesCarouselItem" as const,
        mangaId: encodeMangaId(series.slug),
        chapterId: chapter.slug,
        title: Application.decodeHTMLEntities(series.title),
        imageUrl: series.cover || "",
        subtitle: `Ch. ${chapter.number}`,
        publishDate: new Date(chapter.createdAt),
        contentRating: ContentRating.EVERYONE,
      },
    ];
  });
}

export function parseDiscoverItems(
  data: QIScansHomeResponse,
  sectionId: string,
): DiscoverSectionItem[] {
  switch (sectionId) {
    case "featured":
      return parseProminentItems(data.banners ?? []);
    case "popular":
      return parseChapterUpdateItems(data.popular ?? []);
    case "pinned":
      return parseChapterUpdateItems(data.pinned ?? []);
    case "new":
      return parseChapterUpdateItems(data.newSeries ?? []);
    case "editors-pick":
      return parseSimpleItems(data.editorsPick ?? []);
    default:
      return [];
  }
}
