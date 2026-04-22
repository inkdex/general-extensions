import { Form, type SettingsFormProviding } from "@paperback/types";
import { DEFAULT_DISCOVER_SECTION_IDS, DEFAULT_SEARCH_GENRE_IDS } from "../../shared/models";
import {
  DEFAULT_SEARCH_PAGE_KEY,
  DEFAULT_SEARCH_SORT_KEY,
  DISCOVER_SECTION_ORDER_KEY,
  HIDDEN_DISCOVER_SECTIONS_KEY,
  HIDDEN_SEARCH_GENRES_KEY,
  SEARCH_GENRE_ORDER_KEY,
  USE_HIGH_QUALITY_IMAGES_KEY,
} from "../models";
import { normalizeSettingIds } from "../utils";
import { ReadComicOnlineSettingsForm } from "./landing";

export function getHiddenDiscoverSections(): string[] {
  return normalizeSettingIds(
    Application.getState(HIDDEN_DISCOVER_SECTIONS_KEY),
    DEFAULT_DISCOVER_SECTION_IDS,
    false,
  );
}

export function setHiddenDiscoverSections(value: string[]): void {
  Application.setState(
    normalizeSettingIds(value, DEFAULT_DISCOVER_SECTION_IDS, false),
    HIDDEN_DISCOVER_SECTIONS_KEY,
  );
}

export function getDiscoverSectionOrder(): string[] {
  return normalizeSettingIds(
    Application.getState(DISCOVER_SECTION_ORDER_KEY),
    DEFAULT_DISCOVER_SECTION_IDS,
    true,
  );
}

export function setDiscoverSectionOrder(value: string[]): void {
  Application.setState(
    normalizeSettingIds(value, DEFAULT_DISCOVER_SECTION_IDS, true),
    DISCOVER_SECTION_ORDER_KEY,
  );
}

export function getHiddenSearchGenres(): string[] {
  return normalizeSettingIds(
    Application.getState(HIDDEN_SEARCH_GENRES_KEY),
    DEFAULT_SEARCH_GENRE_IDS,
    false,
  );
}

export function setHiddenSearchGenres(value: string[]): void {
  Application.setState(
    normalizeSettingIds(value, DEFAULT_SEARCH_GENRE_IDS, false),
    HIDDEN_SEARCH_GENRES_KEY,
  );
}

export function getSearchGenreOrder(): string[] {
  return normalizeSettingIds(
    Application.getState(SEARCH_GENRE_ORDER_KEY),
    DEFAULT_SEARCH_GENRE_IDS,
    true,
  );
}

export function setSearchGenreOrder(value: string[]): void {
  Application.setState(
    normalizeSettingIds(value, DEFAULT_SEARCH_GENRE_IDS, true),
    SEARCH_GENRE_ORDER_KEY,
  );
}

export function getDefaultSearchSort(): string {
  return (Application.getState(DEFAULT_SEARCH_SORT_KEY) as string | undefined) ?? "";
}

export function setDefaultSearchSort(value: string): void {
  Application.setState(value, DEFAULT_SEARCH_SORT_KEY);
}

export function getDefaultSearchPage(): string {
  return (Application.getState(DEFAULT_SEARCH_PAGE_KEY) as string | undefined) ?? "most-popular";
}

export function setDefaultSearchPage(value: string): void {
  Application.setState(value, DEFAULT_SEARCH_PAGE_KEY);
}

export function getUseHighQualityImages(): boolean {
  return (Application.getState(USE_HIGH_QUALITY_IMAGES_KEY) as boolean | undefined) ?? true;
}

export function setUseHighQualityImages(value: boolean): void {
  Application.setState(value, USE_HIGH_QUALITY_IMAGES_KEY);
}

export class SettingsFormProvider implements SettingsFormProviding {
  async getSettingsForm(): Promise<Form> {
    return new ReadComicOnlineSettingsForm();
  }
}
