/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type JSONObject,
  type Chapter as SourceChapter,
  type SourceManga,
} from "@paperback/types";
import protobuf from "protobufjs/dist/protobuf.min.js";

const MangaPlusProtoRoot = protobuf.Root.fromJSON({
  nested: {
    Proto: {
      nested: {
        Language: {
          values: {
            ENGLISH: 0,
            SPANISH: 1,
            FRENCH: 2,
            INDONESIAN: 3,
            PORTUGUESE_BR: 4,
            RUSSIAN: 5,
            THAI: 6,
            GERMAN: 7,
            ITALIAN: 8,
            VIETNAMESE: 9,
          },
        },
        Response: {
          fields: {
            success: { type: "SuccessResult", id: 1 },
            error: { type: "ErrorResult", id: 2 },
          },
        },
        SuccessResult: {
          fields: {
            titleRankingViewV2: { type: "TitleRankingViewV2", id: 37 },
            featuredTitlesViewV2: { type: "FeaturedTitlesViewV2", id: 39 },
            allTitlesViewV2: { type: "AllTitlesViewV2", id: 25 },
            webHomeViewV4: { type: "WebHomeViewV4", id: 38 },
            titleDetailView: { type: "TitleDetailView", id: 8 },
            mangaViewer: { type: "MangaViewer", id: 10 },
          },
        },
        ErrorResult: {
          fields: {
            action: { type: "int32", id: 1 },
            englishPopup: { type: "Popup.OSDefault", id: 18 },
            spanishPopup: { type: "Popup.OSDefault", id: 26 },
            popups: { rule: "repeated", type: "Popup.OSDefault", id: 42 },
            debugInfo: { type: "string", id: 34 },
          },
        },
        Popup: {
          oneofs: {
            popup: {
              oneof: ["osDefault", "appDefault", "movieReward", "oneImage"],
            },
          },
          fields: {
            osDefault: { type: "Popup.OSDefault", id: 1 },
            appDefault: { type: "Popup.AppDefault", id: 2 },
            movieReward: { type: "Popup.MovieReward", id: 3 },
            oneImage: { type: "Popup.OneImage", id: 4 },
            popupId: { type: "uint32", id: 5 },
          },
          nested: {
            OSDefault: {
              fields: {
                subject: { type: "string", id: 1 },
                body: { type: "string", id: 2 },
                language: { type: "Language", id: 6 },
              },
            },
            AppDefault: {
              fields: {
                subject: { type: "string", id: 1 },
                body: { type: "string", id: 2 },
                imageUrl: { type: "string", id: 4 },
              },
            },
            MovieReward: {
              fields: {},
            },
            OneImage: {
              fields: {
                imageUrl: { type: "string", id: 2 },
              },
            },
          },
        },
        Title: {
          fields: {
            titleId: { type: "uint32", id: 1 },
            name: { type: "string", id: 2 },
            author: { type: "string", id: 3 },
            portraitImageUrl: { type: "string", id: 4 },
            landscapeImageUrl: { type: "string", id: 5 },
            viewCount: { type: "uint32", id: 6 },
            language: { type: "Language", id: 7 },
          },
        },
        Chapter: {
          fields: {
            titleId: { type: "uint32", id: 1 },
            chapterId: { type: "uint32", id: 2 },
            name: { type: "string", id: 3 },
            subTitle: { type: "string", id: 4 },
            thumbnailUrl: { type: "string", id: 5 },
            startTimeStamp: { type: "uint32", id: 6 },
            endTimeStamp: { type: "uint32", id: 7 },
            alreadyViewed: { type: "bool", id: 8 },
            isVerticalOnly: { type: "bool", id: 9 },
            chapterTicketEndtime: { type: "uint32", id: 10 },
            viewedForFree: { type: "bool", id: 11 },
            isHorizontalOnly: { type: "bool", id: 12 },
            viewCount: { type: "uint32", id: 13 },
            commentCount: { type: "uint32", id: 14 },
            isUpdated: { type: "bool", id: 15 },
            chapterType: { type: "int32", id: 16 },
          },
        },
        TitleDetailView: {
          fields: {
            title: { type: "Title", id: 1 },
            titleImageUrl: { type: "string", id: 2 },
            overview: { type: "string", id: 3 },
            backgroundImageUrl: { type: "string", id: 4 },
            nextTimeStamp: { type: "uint32", id: 5 },
            viewingPeriodDescription: { type: "string", id: 7 },
            nonAppearanceInfo: { type: "string", id: 8 },
            firstChapterList: { rule: "repeated", type: "Chapter", id: 9 },
            lastChapterList: { rule: "repeated", type: "Chapter", id: 10 },
            chapterListGroup: { rule: "repeated", type: "TitleDetailView.ChapterGroup", id: 28 },
          },
          nested: {
            ChapterGroup: {
              fields: {
                chapterNumbers: { type: "string", id: 1 },
                firstChapterList: { rule: "repeated", type: "Chapter", id: 2 },
                midChapterList: { rule: "repeated", type: "Chapter", id: 3 },
                lastChapterList: { rule: "repeated", type: "Chapter", id: 4 },
              },
            },
          },
        },
        MangaViewer: {
          fields: {
            pages: { rule: "repeated", type: "Page", id: 1 },
            vwToken: { type: "string", id: 19 },
          },
        },
        Page: {
          oneofs: {
            data: {
              oneof: ["mangaPage", "bannerList", "insertBannerList", "lastPage", "advertisement"],
            },
          },
          fields: {
            mangaPage: { type: "Page.MangaPage", id: 1 },
            bannerList: { type: "Page.BannerList", id: 2 },
            insertBannerList: { type: "Page.BannerList", id: 5 },
            lastPage: { type: "Page.LastPage", id: 3 },
            advertisement: { type: "AdNetworkList", id: 4 },
          },
          nested: {
            MangaPage: {
              fields: {
                imageUrl: { type: "string", id: 1 },
                width: { type: "uint32", id: 2 },
                height: { type: "uint32", id: 3 },
                type: { type: "int32", id: 4 },
                encryptionKey: { type: "string", id: 5 },
              },
            },
            BannerList: {
              fields: {},
            },
            LastPage: {
              fields: {},
            },
          },
        },
        AdNetworkList: {
          fields: {},
        },
        TitleRankingViewV2: {
          fields: {
            rankingBanners: { rule: "repeated", type: "Banner", id: 1 },
            updatedTimeStamp: { type: "uint32", id: 2 },
            rankedTitles: { rule: "repeated", type: "TitleRankingGroup", id: 3 },
          },
        },
        TitleRankingGroup: {
          fields: {
            originalTitleId: { type: "uint32", id: 1 },
            titles: { rule: "repeated", type: "Title", id: 2 },
            score: { type: "uint32", id: 3 },
          },
        },
        Banner: {
          fields: {
            bannerId: { type: "uint32", id: 1 },
            imageUrl: { type: "string", id: 2 },
          },
        },
        AllTitlesViewV2: {
          fields: {
            AllTitlesGroup: { rule: "repeated", type: "AllTitlesGroup", id: 1 },
          },
        },
        AllTitlesGroup: {
          fields: {
            theTitle: { type: "string", id: 1 },
            titles: { rule: "repeated", type: "Title", id: 2 },
          },
        },
        WebHomeViewV4: {
          fields: {
            groups: { rule: "repeated", type: "UpdatedTitleV2Group", id: 2 },
          },
          nested: {
            UpdatedTitleV2Group: {
              fields: {
                groupName: { type: "string", id: 1 },
                titleGroups: { rule: "repeated", type: "OriginalTitleGroup", id: 2 },
                groupNameDays: { type: "uint32", id: 3 },
              },
            },
            OriginalTitleGroup: {
              fields: {
                theTitle: { type: "string", id: 1 },
                chapterNumber: { type: "string", id: 2 },
                titles: { rule: "repeated", type: "UpdatedTitle", id: 3 },
              },
            },
            UpdatedTitle: {
              fields: {
                title: { type: "Title", id: 1 },
              },
            },
          },
        },
        FeaturedTitlesViewV2: {
          fields: {
            contents: { rule: "repeated", type: "FeaturedTitlesViewV2.Contents", id: 2 },
          },
          nested: {
            Contents: {
              fields: {
                titleList: { type: "TitleList", id: 1 },
              },
            },
          },
        },
        TitleList: {
          fields: {
            listName: { type: "string", id: 1 },
            featuredTitles: { rule: "repeated", type: "Title", id: 2 },
          },
        },
      },
    },
  },
});

const MangaPlusResponseType = MangaPlusProtoRoot.lookupType("Proto.Response");

export interface MangaPlusResponse {
  success?: SuccessResult;
  error?: ErrorResult;
}

export function decodeMangaPlusResponse(buffer: ArrayBuffer): MangaPlusResponse {
  const message = MangaPlusResponseType.decode(new Uint8Array(buffer));
  return MangaPlusResponseType.toObject(message, {
    longs: Number,
    enums: String,
    defaults: false,
    arrays: true,
    objects: true,
  }) as MangaPlusResponse;
}

export interface MangaPlusMetadata extends JSONObject {
  page?: number;
}

interface FeaturedTitlePayload {
  titleId?: number;
  name?: string;
  author?: string;
  portraitImageUrl?: string;
  language?: Language;
}

function isFeaturedTitleLike(title: unknown): title is FeaturedTitlePayload {
  const payload = title as FeaturedTitlePayload | undefined;
  if (!payload || !payload.name) return false;
  if (payload.name.startsWith("mangaplus://open/webview")) return false;
  if (payload.name.startsWith("http://") || payload.name.startsWith("https://")) return false;
  if (!payload.portraitImageUrl?.startsWith("http")) return false;
  return (payload.titleId ?? 0) > 0;
}

export function extractFeaturedTitles(response: MangaPlusResponse, languages: string[]): Title[] {
  const featured = (
    (response.success?.featuredTitlesViewV2?.contents?.flatMap(
      (entry) => entry.titleList?.featuredTitles ?? [],
    ) ?? []) as Array<FeaturedTitlePayload | undefined>
  ).filter((title): title is FeaturedTitlePayload => isFeaturedTitleLike(title));
  const featuredTitles = featured.filter((title) =>
    languages.includes(title.language ?? Language.ENGLISH),
  );

  if (featuredTitles.length > 0) {
    return featuredTitles
      .map((title) => {
        if ((title.titleId ?? 0) <= 0 || !title.name) return undefined;
        return new Title(
          title.titleId ?? 0,
          title.name,
          title.portraitImageUrl ?? "",
          "",
          title.author,
          title.language,
        );
      })
      .filter((title): title is Title => !!title);
  }

  return [];
}

export function extractPopularTitles(response: MangaPlusResponse, languages: string[]): Title[] {
  const rankedV2 = response.success?.titleRankingViewV2?.rankedTitles ?? [];
  if (rankedV2.length > 0) {
    const selectedTitles = rankedV2
      .map((group) => {
        const candidates = group.titles ?? [];
        return (
          candidates.find((title) => languages.includes(title.language ?? Language.ENGLISH)) ??
          candidates.find((title) => (title.language ?? Language.ENGLISH) === Language.ENGLISH) ??
          candidates[0]
        );
      })
      .filter((title): title is Title => Boolean(title));

    const uniqueById = new Map<number, Title>();
    for (const title of selectedTitles) {
      if (!uniqueById.has(title.titleId)) {
        uniqueById.set(title.titleId, title);
      }
    }

    return [...uniqueById.values()];
  }

  return [];
}

interface SuccessResult {
  isFeaturedUpdated?: boolean;
  titleRankingViewV2?: TitleRankingViewV2;
  titleDetailView?: TitleDetailView;
  mangaViewer?: MangaViewer;
  allTitlesViewV2?: AllTitlesViewV2;
  webHomeViewV4?: WebHomeViewV4;
  featuredTitlesViewV2?: {
    contents: [
      {
        titleList: {
          listName:
            | "WEEKLY SHONEN JUMP"
            | "JUMP PLUS"
            | "OTHERS"
            | "Re edition"
            | '"First Read Free" Eligible Titles!';
          featuredTitles: Title[];
        };
      },
    ];
  };
}

interface TitleRankingViewV2 {
  rankingBanners?: Banner[];
  updatedTimeStamp?: number;
  rankedTitles?: TitleRankingGroup[];
}

interface TitleRankingGroup {
  originalTitleId?: number;
  titles?: Title[];
  score?: number;
}

interface Banner {
  bannerId?: number;
  imageUrl?: string;
}

interface AllTitlesViewV2 {
  AllTitlesGroup: AllTitlesGroup[];
}

interface AllTitlesGroup {
  theTitle: string;
  titles: Title[];
}

interface WebHomeViewV4 {
  groups: UpdatedTitleV2Group[];
}

interface UpdatedTitleV2Group {
  groupName: string;
  titleGroups: OriginalTitleGroup[];
}

interface OriginalTitleGroup {
  theTitle: string;
  titles: UpdatedTitle[];
}

interface UpdatedTitle {
  title: Title;
}

class ErrorResult {
  popups: Popup[] = [];
}

export function langPopup(errorResult: ErrorResult | undefined, lang: Language): Popup | null {
  return (
    errorResult?.popups?.find((popup) => (popup.language ?? Language.ENGLISH) === lang) || null
  );
}

class Popup {
  subject: string;
  body: string;
  language?: Language;

  constructor(subject: string, body: string, language?: Language) {
    this.subject = subject;
    this.body = body;
    if (language) this.language = language;
    else this.language = Language.ENGLISH;
  }
}

export enum Language {
  ENGLISH = "ENGLISH",
  SPANISH = "SPANISH",
  FRENCH = "FRENCH",
  INDONESIAN = "INDONESIAN",
  PORTUGUESE_BR = "PORTUGUESE_BR",
  RUSSIAN = "RUSSIAN",
  THAI = "THAI",
  VIETNAMESE = "VIETNAMESE",
}

export class Title {
  titleId: number;
  name: string;
  author?: string;
  portraitImageUrl: string;
  landscapeImageUrl: string;
  viewCount = 0;
  language: Language = Language.ENGLISH;

  constructor(
    titleId: number,
    name: string,
    portraitImageUrl: string,
    landscapeImageUrl: string,
    author?: string,
    language?: Language,
  ) {
    this.titleId = titleId;
    this.name = name;
    this.portraitImageUrl = portraitImageUrl;
    this.landscapeImageUrl = landscapeImageUrl;

    if (author) this.author = author;
    if (language) this.language = language;
  }
}

export class TitleDetailView {
  title?: Title;
  titleImageUrl?: string;
  overview?: string;
  backgroundImageUrl?: string;
  nextTimeStamp = 0;
  viewingPeriodDescription = "";
  nonAppearanceInfo = "";
  chapterListGroup: {
    firstChapterList: Chapter[] | undefined;
    midChapterList?: Chapter[] | undefined;
    lastChapterList: Chapter[] | undefined;
  }[] = [];
  firstChapterList: Chapter[] = [];
  lastChapterList: Chapter[] = [];
  isSimulReleased = false;
  chaptersDescending = true;

  private get isWebtoon(): boolean {
    return (
      this.firstChapterList.every((chapter) => chapter.isVerticalOnly) &&
      this.lastChapterList.every((chapter) => chapter.isVerticalOnly)
    );
  }

  private get isOneShot(): boolean {
    return (
      this.chapterCount == 1 &&
      this.firstChapterList.at(0)?.name?.localeCompare("one-shot", undefined, {
        sensitivity: "base",
      }) == 0
    );
  }

  private get chapterCount(): number {
    return this.firstChapterList?.length + this.lastChapterList?.length;
  }

  private get isReEdition(): boolean {
    return this.viewingPeriodDescription?.search(TitleDetailView.REEDITION_REGEX) != 0;
  }

  private get isCompleted(): boolean {
    return this.nonAppearanceInfo?.search(TitleDetailView.COMPLETED_REGEX) != 0 || this.isOneShot;
  }

  private get isOnHiatus(): boolean {
    return this.nonAppearanceInfo?.search(TitleDetailView.HIATUS_REGEX) != 0;
  }

  private get genres(): string[] {
    const genres = [];
    if (this.isSimulReleased && !this.isReEdition && !this.isOneShot) genres.push("Simulrelease");

    if (this.isOneShot) genres.push("One-shot");

    if (this.isReEdition) genres.push("Re-edition");

    if (this.isWebtoon) genres.push("Webtoon");

    return genres;
  }

  static fromJson(str: string): TitleDetailView {
    const bopp = JSON.parse(str) as MangaPlusResponse;
    return TitleDetailView.fromResponse(bopp);
  }

  static fromResponse(response: MangaPlusResponse): TitleDetailView {
    if (response.success?.titleDetailView === undefined) throw Error("Cannot find manga");

    const json = response.success.titleDetailView;
    const obj = new TitleDetailView();

    if (json.title === undefined) {
      throw Error("Cannot find title");
    }

    const title = json.title;

    obj.title = new Title(
      title.titleId,
      title.name,
      title.portraitImageUrl,
      title.landscapeImageUrl,
      title.author,
      title.language,
    );
    obj.titleImageUrl = json.titleImageUrl;
    obj.overview = json.overview;
    obj.backgroundImageUrl = json.backgroundImageUrl;
    obj.nextTimeStamp = json.nextTimeStamp;
    obj.viewingPeriodDescription = json.viewingPeriodDescription;
    obj.nonAppearanceInfo = json.nonAppearanceInfo;
    obj.firstChapterList = json.chapterListGroup
      ?.flatMap((a) => a.firstChapterList ?? [])
      .map((chapter) => Object.assign(new Chapter(1, 1, "", 1, 1), chapter));
    obj.lastChapterList = json.chapterListGroup
      ?.flatMap((a) => [...(a.midChapterList ?? []), ...(a.lastChapterList ?? [])])
      .map((chapter) => Object.assign(new Chapter(1, 1, "", 1, 1), chapter));

    return obj;
  }

  toSourceManga(): SourceManga {
    const authors = this.title?.author?.split("/");

    return {
      mangaId: this.title?.titleId.toString() ?? "",
      mangaInfo: {
        thumbnailUrl: "imageMangaId=" + this.title?.titleId,
        synopsis: (this.overview ?? "") + "\n\n" + (this.viewingPeriodDescription ?? ""),
        primaryTitle: this.title?.name ?? "",
        secondaryTitles: [],
        contentRating: ContentRating.EVERYONE,

        status: this.isCompleted ? "Completed" : this.isOnHiatus ? "On hiatus" : "Ongoing",
        artist: authors ? authors[1]?.trimStart() : (this.title?.author ?? ""),
        author: authors ? authors[0]?.trimEnd() : (this.title?.author ?? ""),
        tagGroups: [
          {
            id: "0",
            title: "genres",
            tags: this.genres.map((genre) => ({
              id: genre,
              title: genre,
            })),
          },
        ],
      },
    };
  }

  private static COMPLETED_REGEX = /completado|complete|completo/;
  private static HIATUS_REGEX = /on a hiatus/i;
  private static REEDITION_REGEX = /revival|remasterizada/;
}

interface MangaViewer {
  pages: MangaPageEntry[];
  vwToken?: string;
  titleId?: number;
  titleName?: string;
}

interface MangaPageEntry {
  mangaPage?: MangaPage;
}

interface MangaPage {
  imageUrl: string;
  width?: number;
  height?: number;
  type?: number;
  encryptionKey?: string;
}

class Chapter {
  titleId: number;
  chapterId: number;
  name: string;
  subTitle?: string;
  startTimeStamp: number;
  endTimeStamp: number;
  isVerticalOnly = false;

  constructor(
    titleId: number,
    chapterId: number,
    name: string,
    startTimeStamp: number,
    endTimeStamp: number,
  ) {
    this.titleId = titleId;
    this.chapterId = chapterId;
    this.name = name;
    this.startTimeStamp = startTimeStamp;
    this.endTimeStamp = endTimeStamp;
  }

  public get isExpired(): boolean {
    return this.subTitle == null;
  }

  toSChapter(sourceManga: SourceManga, langCode = "en"): SourceChapter {
    const chapNum = parseFloat(this.name.slice(this.name.lastIndexOf("#") + 1));

    return {
      chapterId: this.chapterId.toString(),
      sourceManga: sourceManga,
      langCode,
      title: this.subTitle ? this.subTitle : "",
      chapNum: isNaN(chapNum) ? 0 : chapNum,
      sortingIndex: isNaN(chapNum) ? -1 : chapNum,
      publishDate: new Date(this.startTimeStamp * 1000),
    };
  }
}

const LANGUAGE_SUFFIXES: Partial<Record<Language, string>> = {
  [Language.SPANISH]: "ES",
  [Language.FRENCH]: "FR",
  [Language.INDONESIAN]: "ID",
  [Language.PORTUGUESE_BR]: "BR",
  [Language.RUSSIAN]: "RU",
  [Language.THAI]: "TH",
  [Language.VIETNAMESE]: "VI",
};

const CHAPTER_LANGUAGE_CODES: Partial<Record<Language, string>> = {
  [Language.ENGLISH]: "en",
  [Language.SPANISH]: "es",
  [Language.FRENCH]: "fr",
  [Language.INDONESIAN]: "id",
  [Language.PORTUGUESE_BR]: "pt",
  [Language.RUSSIAN]: "ru",
  [Language.THAI]: "th",
  [Language.VIETNAMESE]: "vi",
};

export function getChapterLanguageCode(language?: Language): string {
  return CHAPTER_LANGUAGE_CODES[language ?? Language.ENGLISH] ?? "en";
}

export function getLanguageSuffix(language?: Language): string | undefined {
  const resolvedLanguage = language ?? Language.ENGLISH;
  if (resolvedLanguage === Language.ENGLISH) return undefined;

  const suffix = LANGUAGE_SUFFIXES[resolvedLanguage];
  return suffix ? `(${suffix})` : undefined;
}
