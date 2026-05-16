/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { JSONObject } from "@paperback/types";

// API endpoints and common constants
export const MANGADEX_DOMAIN = "https://mangadex.org";
export const MANGADEX_API = "https://api.mangadex.org";
export const COVER_BASE_URL = "https://uploads.mangadex.org/covers";

// MangaDex's Keycloak realm. Used by both the OAuth login button and the
// refresh token endpoint. Migrating the realm requires editing only this pair.
const MANGADEX_AUTH_BASE = "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect";
export const MANGADEX_AUTH_AUTHORIZE_URL = `${MANGADEX_AUTH_BASE}/auth`;
export const MANGADEX_AUTH_TOKEN_URL = `${MANGADEX_AUTH_BASE}/token`;

export interface MangaDexError {
  id: string;
  status: number;
  title: string;
  detail: string;
  context: string;
}

export interface SearchResponse {
  result: string;
  response: string;
  data: MangaItem[];
  limit: number;
  offset: number;
  total: number;
  errors?: MangaDexError[];
}

export interface MangaItem {
  id: string;
  type: RelationshipType;
  attributes: DatumAttributes;
  relationships: Relationship[];
}

export interface DatumAttributes {
  title: Title;
  altTitles: AltTitle[];
  description: PurpleDescription;
  isLocked: boolean;
  links: Links;
  originalLanguage: OriginalLanguage;
  lastVolume: string | null;
  lastChapter: string | null;
  publicationDemographic: null | string;
  status: Status;
  year: number | null;
  contentRating: MDContentRating;
  tags: Tag[];
  state: State;
  chapterNumbersResetOnNewVolume: boolean;
  // ISO-8601 strings. Typed as string so consumers do not call .getTime() on raw JSON.
  createdAt: string;
  updatedAt: string;
  version: number;
  availableTranslatedLanguages: string[];
  latestUploadedChapter: string | null;
}

export interface AltTitle {
  ko?: string;
  ja?: string;
  en?: string;
  vi?: string;
  ru?: string;
  th?: string;
  "ko-ro"?: string;
  "ja-ro"?: string;
  uk?: string;
  zh?: string;
  es?: string;
  "zh-ro"?: string;
  ar?: string;
  id?: string;
  "es-la"?: string;
  "pt-br"?: string;
  tr?: string;
  "zh-hk"?: string;
  fr?: string;
  de?: string;
}

// Local to MangaDex's API. Distinct from the Paperback SDK's ContentRating.
export enum MDContentRating {
  Safe = "safe",
  Suggestive = "suggestive",
  Erotica = "erotica",
  Pornographic = "pornographic",
}

export interface PurpleDescription {
  en?: string;
  "pt-br"?: string;
  id?: string;
  ar?: string;
  fr?: string;
  ru?: string;
  zh?: string;
  "es-la"?: string;
  it?: string;
  ja?: string;
  ko?: string;
  de?: string;
}

export interface Links {
  mu?: string;
  raw?: string;
  al?: string;
  ap?: string;
  kt?: string;
  nu?: string;
  mal?: string;
  bw?: string;
  amz?: string;
  cdj?: string;
  ebj?: string;
  engtl?: string;
}

export enum OriginalLanguage {
  En = "en",
  Ja = "ja",
  Ko = "ko",
  Zh = "zh",
}

export enum State {
  Published = "published",
}

export enum Status {
  Completed = "completed",
  Ongoing = "ongoing",
  Hiatus = "hiatus",
  Cancelled = "cancelled",
  // Synthetic. Set by parseMangaItemDetails. The API never returns it.
  PublishingFinished = "publishing_finished",
}

export interface Tag {
  id: string;
  type: TagType;
  attributes: TagAttributes;
  relationships: Relationship[];
}

export interface TagAttributes {
  name: Title;
  description: string;
  group: Group;
  version: number;
}

export enum Group {
  Content = "content",
  Format = "format",
  Genre = "genre",
  Theme = "theme",
}

export interface Title {
  en: string;
  [language: string]: string | undefined;
}

export enum TagType {
  Tag = "tag",
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  attributes?: RelationshipAttributes;
  related?: string;
}

export interface RelationshipAttributes {
  description: string;
  volume: null | string;
  fileName: string;
  locale: OriginalLanguage;
  createdAt: string;
  updatedAt: string;
  version: number;
  name?: string;
}

export enum RelationshipType {
  Artist = "artist",
  Author = "author",
  CoverArt = "cover_art",
  Manga = "manga",
  ScanlationGroup = "scanlation_group",
  User = "user",
}

export interface Metadata extends JSONObject {
  offset?: number;
  // Carried by list: search across pages so /list is fetched only once.
  listMangaIds?: string[];
}

export interface StatisticsResponse {
  result: string;
  statistics: Record<string, StatisticsData>;
}

export interface StatisticsData {
  comments: {
    threadId: number;
    repliesCount: number;
  };
  rating: {
    average: number | null;
    bayesian: number | null;
    distribution: Record<string, number>;
  };
  follows: number;
}

// /list/{id} returns a custom list entity (name, visibility, relationships),
// not a manga.
export interface CustomListEntity {
  id: string;
  type: string;
  attributes: {
    name: string;
    visibility: string;
    version: number;
  };
  relationships: Relationship[];
}

export interface CustomListResponse {
  result: string;
  response: string;
  data: CustomListEntity;
  errors?: MangaDexError[];
}

export interface MangaDetailsResponse {
  result: string;
  response: string;
  data: MangaItem;
  errors?: MangaDexError[];
}

export interface ChapterDetailsResponse {
  result: "ok";
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
  errors?: MangaDexError[];
}

export interface ChapterRelationship {
  id: string;
  type: string;
  related?: string;
  attributes?: Record<string, unknown>;
}

export interface ChapterAttributes {
  title: string | null;
  volume: string | null;
  chapter: string | null;
  pages: number;
  translatedLanguage: string;
  uploader?: string;
  externalUrl?: string;
  // Set on DMCA removed or withheld chapters. Needs includeUnavailable=1.
  isUnavailable?: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishAt: string;
  readableAt: string;
}

export interface ChapterData {
  id: string;
  type: string;
  attributes: ChapterAttributes;
  relationships: ChapterRelationship[];
}

export interface ChapterResponse {
  result: string;
  response: string;
  data: ChapterData[];
  limit: number;
  offset: number;
  total: number;
  errors?: MangaDexError[];
}

export interface MangaStatusResponse {
  result: string;
  statuses: Record<string, string>;
  errors?: MangaDexError[];
}

export interface AggregateChapter {
  chapter: string;
  id: string;
  others: string[];
  count: number;
}

export interface AggregateVolume {
  volume: string;
  count: number;
  chapters: Record<string, AggregateChapter>;
}

export interface AggregateResponse {
  result: string;
  volumes: Record<string, AggregateVolume>;
  errors?: MangaDexError[];
}

export interface CoverItem {
  id: string;
  type: string;
  attributes: {
    fileName: string;
    volume: string | null;
    locale?: string;
    description?: string;
    updatedAt?: string;
    version?: number;
  };
  relationships?: Array<{ id: string; type: string }>;
}

export interface CoverSearchResponse {
  result: string;
  data: CoverItem[];
  limit?: number;
  offset?: number;
  total?: number;
  errors?: MangaDexError[];
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  session_state: string;
}

export interface TokenBody {
  exp: number;
  iat: number;
  jti: string;
  iss: string;
  sub: string;
  typ: string;
  azp: string;
  session_state: string;
  allowed_origins: string[];
}

export interface AccessToken {
  accessToken: string;
  refreshToken?: string;
  tokenBody: TokenBody;
}

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  "not-before-policy": number;
  refresh_expires_in: number;
  refresh_token: string;
  scope: string;
  session_state: string;
  token_type: string;
}

export interface AuthError {
  error: string;
  error_description: string;
}

export interface ScanlationGroupResponse {
  result: string;
  response: string;
  data: ScanlationGroupItem[];
  limit: number;
  offset: number;
  total: number;
  errors?: MangaDexError[];
}

export interface ScanlationGroupItem {
  id: string;
  type: string;
  attributes: ScanlationGroupAttributes;
  relationships: ScanlationGroupRelationship[];
}

export interface ScanlationGroupAttributes {
  name: string;
  altNames: Array<Record<string, string>>;
  locked: boolean;
  website: string | null;
  ircServer: string | null;
  ircChannel: string | null;
  discord: string | null;
  contactEmail: string | null;
  description: string | null;
  twitter: string | null;
  mangaUpdates: string | null;
  focusedLanguages: string[];
  official: boolean;
  verified: boolean;
  inactive: boolean;
  publishDelay: number | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ScanlationGroupRelationship {
  id: string;
  type: string;
}
