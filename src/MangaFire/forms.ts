import {
  AdvancedSearchForm,
  Form,
  Section,
  SelectRow,
  TriStateSelectRow,
  type SearchQuery,
  type Tag,
} from "@paperback/types";

import type { SearchDetails, SearchMetadata } from "./models";

// Language Helper Class
class MFLanguagesClass {
  Languages = [
    { name: "English", MDCode: "en", flagCode: "🇬🇧", default: true },
    { name: "Français", MDCode: "fr", flagCode: "🇫🇷" },
    { name: "Español", MDCode: "es", flagCode: "🇪🇸" },
    { name: "Español (Latinoamérica)", MDCode: "es-la", flagCode: "🇲🇽" },
    { name: "Português", MDCode: "pt", flagCode: "🇵🇹" },
    { name: "Português (Brasil)", MDCode: "pt-br", flagCode: "🇧🇷" },
    { name: "日本語", MDCode: "ja", flagCode: "🇯🇵" },
  ];

  constructor() {
    // Sort languages by name
    this.Languages = this.Languages.sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  getCodeList(): string[] {
    return this.Languages.map((language) => language.MDCode);
  }

  getName(code: string): string {
    return this.Languages.find((language) => language.MDCode === code)?.name ?? "Unknown";
  }

  getFlagCode(code: string): string {
    return this.Languages.find((language) => language.MDCode === code)?.flagCode ?? "🏳️";
  }

  getDefault(): string[] {
    return this.Languages.filter((language) => language.default).map((language) => language.MDCode);
  }
}

export const MFLanguages = new MFLanguagesClass();

export function getLanguages(): string[] {
  return (Application.getState("languages") as string[] | undefined) ?? MFLanguages.getDefault();
}

export function setLanguages(languages: string[]): void {
  Application.setState(languages, "languages");
}

// Advanced Search Form
export class MangaFireAdvancedSearchForm extends AdvancedSearchForm {
  private genres: Record<string, "included" | "excluded">;
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

    const toTags = (options: { id: string; label: string }[] | undefined): Tag[] =>
      (options ?? []).map((option) => ({ id: option.id, title: option.label }));

    this.genreOptions = toTags(searchDetails?.genres);
    this.typeOptions = toTags(searchDetails?.types);
    this.statusOptions = toTags(searchDetails?.status);
    this.languageOptions = toTags(searchDetails?.languages);
    this.yearOptions = toTags(searchDetails?.years);
    this.lengthOptions = toTags(searchDetails?.lengths);

    const meta = searchQuery.metadata ?? {};
    this.genres = { ...meta.genres };
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
  private languagesState: {
    value: string[];
    updateValue: (newValue: string[]) => Promise<void>;
  };

  constructor() {
    super();
    const languages = getLanguages();
    this.languagesState = {
      value: languages,
      updateValue: async (newValue: string[]) => {
        this.languagesState.value = newValue;
        setLanguages(newValue);
      },
    };
  }

  async updateValue(value: string[]): Promise<void> {
    this.languagesState.value = value;
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
              const selectedLangCodes = this.languagesState.value;
              const selectedLangNames = selectedLangCodes
                .map(
                  (langCode) =>
                    `${MFLanguages.getFlagCode(langCode)} ${MFLanguages.getName(langCode)}`,
                )
                .sort();
              return selectedLangNames.join(", ");
            })(),
            value: this.languagesState.value,
            options: MFLanguages.getCodeList().map((code) => ({
              id: code,
              title: `${MFLanguages.getFlagCode(code)} ${MFLanguages.getName(code)}`,
            })),
            minItemCount: 1,
            maxItemCount: MFLanguages.getCodeList().length,
            onValueChange: Application.Selector(this as MangaFireSettingsForm, "updateValue"),
          }),
        ],
      ),
    ];
  }
}
