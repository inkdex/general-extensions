export const DOMAIN = "https://qtoon.com";
export const DOMAIN_API = "https://api.qtoon.com";

export interface QToonEncryptedResponse {
  code: number;
  ts: number;
  data: string;
}

export interface QToonImage {
  thumb: { url: string };
}

export interface QToonTag {
  name: string;
}

export interface QToonCorner {
  cornerTags: QToonTag[];
}

export interface QToonComic {
  csid: string;
  webLinkId?: string;
  title: string;
  image: QToonImage;
  tags: QToonTag[];
  author?: string;
  serialStatus2: number; // 101=ongoing, 103=completed
  updateMemo?: string;
  introduction: string;
  corners: QToonCorner;
}

export interface QToonComicsList {
  comics: QToonComic[];
  more: number; // 1 = has more, 0 = no more
}

export interface QToonBlockRanking {
  rsid: string;
  language: string;
  title: string;
}

export interface QToonBlockAlbum {
  asid: string;
  language: string;
  title: string;
}

export interface QToonCompositionBlock {
  msid: string;
  title: string;
  style: string;
  action: unknown;
  comics: QToonComic[];
  ranking?: QToonBlockRanking;
  album?: QToonBlockAlbum;
  more?: number;
}

export interface QToonCompositionPage {
  blocks: QToonCompositionBlock[];
  banners?: unknown;
  more?: number;
}

export interface QToonComicDetailsResponse {
  comic: QToonComic;
  episodes: QToonEpisode[];
}

export interface QToonEpisode {
  esid: string;
  title: string;
  serialNo: number;
}

export interface QToonEpisodeDefinition {
  token: string;
}

export interface QToonEpisodeResponse {
  definitions: QToonEpisodeDefinition[];
}

export interface QToonResource {
  url: string;
  rgIdx: number;
}

export interface QToonEpisodeResources {
  resources: QToonResource[];
  more: number;
}

export interface SearchMetadata {
  page: number;
}

export interface FilterEntry {
  id: string;
  value: string | Record<string, "included" | "excluded">;
}

export interface DiscoverMetadata {
  page: number;
  endpointType: "ranking" | "album";
  endpointId: string;
}

export interface SectionEndpoint {
  type: "ranking" | "album";
  id: string; // rsid or asid
}
