/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  AdvancedSearchForm,
  ButtonRow,
  Form,
  LabelRow,
  Section,
  SelectRow,
  ToggleRow,
  TriStateSelectRow,
  type SearchQuery,
  type Tag,
} from "@paperback/types";

import {
  BROKEN_CDN_PREFIXES_KEY,
  CDN_PREFIXES,
  LANGUAGES,
  SEARCH_DETAILS_CACHE_KEY,
  VRF_CHAPTER_CACHE_KEY,
  VRF_SEARCH_CACHE_KEY,
  type SearchDetails,
  type SearchMetadata,
  type SearchOption,
} from "./models";
import { cacheClear } from "./utils/cache";

export function getLanguages(): string[] {
  return (
    (Application.getState("languages") as string[] | undefined) ?? [
      LANGUAGES[0].id, // Default to only English selected
    ]
  );
}

export function setLanguages(languages: string[]): void {
  Application.setState(languages, "languages");
}

export function getBrokenCdnPrefixes(): string[] {
  return (Application.getState(BROKEN_CDN_PREFIXES_KEY) as string[] | undefined) ?? [];
}

export function setBrokenCdnPrefixes(prefixes: string[]): void {
  Application.setState(prefixes, BROKEN_CDN_PREFIXES_KEY);
}

// Advanced Search Form
export class MangaFireAdvancedSearchForm extends AdvancedSearchForm {
  private genres: Record<string, "included" | "excluded">;
  private genreMode: boolean;
  private type: string;
  private status: string;
  private language: string;
  private year: string;
  private length: string;

  private readonly genreOptions: Tag[];
  private readonly typeOptions: Tag[];
  private readonly statusOptions: Tag[];
  private readonly languageOptions: Tag[];
  private readonly yearOptions: Tag[];
  private readonly lengthOptions: Tag[];

  constructor(searchQuery: SearchQuery<SearchMetadata>, searchDetails: SearchDetails | undefined) {
    super();

    const toTags = (options: SearchOption[] | undefined): Tag[] =>
      (options ?? []).map((option) => ({ id: option.id, title: option.label }));

    this.genreOptions = toTags(searchDetails?.genres);
    this.typeOptions = toTags(searchDetails?.types);
    this.statusOptions = toTags(searchDetails?.status);
    this.languageOptions = toTags(searchDetails?.languages);
    this.yearOptions = toTags(searchDetails?.years);
    this.lengthOptions = toTags(searchDetails?.lengths);

    const meta = searchQuery.metadata ?? {};
    this.genres = { ...meta.genres };
    this.genreMode = meta.genreMode ?? true;
    this.type = meta.type ?? "";
    this.status = meta.status ?? "";
    this.language = meta.language ?? "";
    this.year = meta.year ?? "";
    this.length = meta.length ?? "";
  }

  override getSections() {
    return [
      Section("genres", [
        TriStateSelectRow("genres", {
          title: "Genres",
          layout: "flow",
          value: this.genres,
          items: this.genreOptions,
          allowExclusion: true,
          allowEmptySelection: true,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleGenresChange",
          ),
        }),
        ToggleRow("genre_mode", {
          title: "Genre Mode",
          subtitle: "Title must have all genres selected.",
          value: this.genreMode,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleGenreModeChange",
          ),
        }),
      ]),
      Section("type", [
        SelectRow("type", {
          title: "Type",
          value: this.type ? [this.type] : [],
          options: this.typeOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleTypeChange",
          ),
        }),
      ]),
      Section("status", [
        SelectRow("status", {
          title: "Status",
          value: this.status ? [this.status] : [],
          options: this.statusOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleStatusChange",
          ),
        }),
      ]),
      Section("language", [
        SelectRow("language", {
          title: "Language",
          value: this.language ? [this.language] : [],
          options: this.languageOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleLanguageChange",
          ),
        }),
      ]),
      Section("year", [
        SelectRow("year", {
          title: "Year",
          value: this.year ? [this.year] : [],
          options: this.yearOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleYearChange",
          ),
        }),
      ]),
      Section("length", [
        SelectRow("length", {
          title: "Length",
          value: this.length ? [this.length] : [],
          options: this.lengthOptions,
          minItemCount: 0,
          maxItemCount: 1,
          onValueChange: Application.Selector(
            this as MangaFireAdvancedSearchForm,
            "handleLengthChange",
          ),
        }),
      ]),
    ];
  }

  async handleGenresChange(value: Record<string, "included" | "excluded">): Promise<void> {
    this.genres = value;
  }

  async handleGenreModeChange(value: boolean): Promise<void> {
    this.genreMode = value;
  }

  async handleTypeChange(value: string[]): Promise<void> {
    this.type = value[0] ?? "";
  }

  async handleStatusChange(value: string[]): Promise<void> {
    this.status = value[0] ?? "";
  }

  async handleLanguageChange(value: string[]): Promise<void> {
    this.language = value[0] ?? "";
  }

  async handleYearChange(value: string[]): Promise<void> {
    this.year = value[0] ?? "";
  }

  async handleLengthChange(value: string[]): Promise<void> {
    this.length = value[0] ?? "";
  }

  override getSearchQueryMetadata(): SearchMetadata {
    const result: SearchMetadata = {};
    if (Object.keys(this.genres).length > 0) result.genres = this.genres;
    if (this.genreMode) result.genreMode = this.genreMode;
    if (this.type) result.type = this.type;
    if (this.status) result.status = this.status;
    if (this.language) result.language = this.language;
    if (this.year) result.year = this.year;
    if (this.length) result.length = this.length;
    return result;
  }
}

// Main Settings Form
export class MangaFireSettingsForm extends Form {
  private languages: string[];
  private brokenCdnPrefixes: string[];
  private isTestingCdns = false;

  constructor() {
    super();
    this.languages = getLanguages();
    this.brokenCdnPrefixes = getBrokenCdnPrefixes();
  }

  async updateValue(value: string[]): Promise<void> {
    this.languages = value;
    setLanguages(value);
  }

  override getSections() {
    return [
      Section(
        {
          id: "languageContent",
          footer: "Filter chapters by language. At least one language must be selected.",
        },
        [
          SelectRow("languages", {
            title: "Languages",
            subtitle: (() => {
              const selectedLangCodes = this.languages;
              const selectedLangNames = selectedLangCodes
                .map((langCode) => LANGUAGES.find((l) => l.id === langCode)?.title ?? "Unknown")
                .sort();
              return selectedLangNames.join(", ");
            })(),
            value: this.languages,
            options: LANGUAGES,
            minItemCount: 1,
            maxItemCount: LANGUAGES.length,
            onValueChange: Application.Selector(this as MangaFireSettingsForm, "updateValue"),
          }),
        ],
      ),
      Section(
        {
          id: "cdn",
          footer:
            "If chapter images fail to load, test the CDNs. Broken CDNs will be swapped to a working one when fetching images.",
        },
        [
          LabelRow("cdnStatus", {
            title: "Status",
            value: this.isTestingCdns
              ? "Loading..."
              : this.brokenCdnPrefixes.length === 0
                ? "All known CDNs healthy"
                : `Broken: ${this.brokenCdnPrefixes.join(", ")}`,
          }),
          ButtonRow("testCdns", {
            title: "Test CDNs",
            onSelect: Application.Selector(this as MangaFireSettingsForm, "testCdns"),
          }),
        ],
      ),
      Section(
        {
          id: "cache",
          footer: "Clear cached data if search filters appear stale or the source returns errors.",
        },
        [
          ButtonRow("clearSearchFilterCache", {
            title: "Clear Search Filter Cache",
            onSelect: Application.Selector(this as MangaFireSettingsForm, "clearSearchFilterCache"),
          }),
          ButtonRow("clearVrfCache", {
            title: "Clear VRF Cache",
            onSelect: Application.Selector(this as MangaFireSettingsForm, "clearVrfCache"),
          }),
        ],
      ),
    ];
  }

  async testCdns(): Promise<void> {
    // Clear first so the interceptor doesn't rewrite a probe of a previously-flagged prefix to a
    // working one — that would prevent a recovered CDN from ever being re-evaluated.
    setBrokenCdnPrefixes([]);
    this.isTestingCdns = true;
    this.reloadForm();
    const broken: string[] = [];
    try {
      await Promise.all(
        CDN_PREFIXES.map(async (prefix) => {
          try {
            const [response] = await Application.scheduleRequest({
              url: `https://${prefix}.mfcdn3.xyz`,
              method: "GET",
            });
            if (response.status >= 500) broken.push(prefix);
          } catch {
            broken.push(prefix);
          }
        }),
      );
    } finally {
      setBrokenCdnPrefixes(broken);
      this.brokenCdnPrefixes = broken;
      this.isTestingCdns = false;
      this.reloadForm();
    }
  }

  async clearSearchFilterCache(): Promise<void> {
    cacheClear(SEARCH_DETAILS_CACHE_KEY);
  }

  async clearVrfCache(): Promise<void> {
    cacheClear(VRF_CHAPTER_CACHE_KEY);
    cacheClear(VRF_SEARCH_CACHE_KEY);
  }
}
