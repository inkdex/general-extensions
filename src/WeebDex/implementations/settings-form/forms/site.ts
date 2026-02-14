import {
  Form,
  Section,
  SelectRow,
  ToggleRow,
  type FormItemElement,
  type FormSectionElement,
  type SelectRowProps,
  type ToggleRowProps,
} from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../../main";
import { fetchJSON } from "../../../services/network";
import type { WeebDexTagListResponse } from "../../shared/models";
import { AVAILABLE_LANGUAGES, ITEMS_PER_PAGE_OPTIONS } from "../models";
import {
  getChapterLanguages,
  getDataSaver,
  getExcludedTags,
  getItemsPerPage,
  getOriginalLanguages,
  setChapterLanguages,
  setDataSaver,
  setExcludedTags,
  setItemsPerPage,
  setOriginalLanguages,
} from "./main";

export class SiteSettingsForm extends Form {
  private tags?: WeebDexTagListResponse;
  private tagsLoadError?: Error;

  override formWillAppear(): void {
    fetchJSON<WeebDexTagListResponse>({
      url: `${WEEBDEX_API_DOMAIN}/manga/tag?limit=100`,
      method: "GET",
    })
      .then((tags) => {
        this.tags = tags;
        this.reloadForm();
      })
      .catch((error) => {
        this.tagsLoadError = error as Error;
        console.error("Failed to load tags:", error);
        this.reloadForm();
      });
  }

  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "original-language",
          footer: "Only show titles originally published in these languages.",
        },
        [this.originalLanguageRow()],
      ),
      Section(
        {
          id: "chapter-language",
          footer: "The default language(s) you want to see in the chapter list.",
        },
        [this.chapterLanguageRow()],
      ),
      Section(
        {
          id: "tag-exclusion",
          footer: "Prevent showing titles that contain any of the selected tags.",
        },
        [this.tagExclusionRow()],
      ),
      Section(
        {
          id: "items-per-page",
          footer: "How many items to load per page.",
        },
        [this.itemsPerPageRow()],
      ),
      Section(
        {
          id: "data-saver",
          footer: "Reduce data usage by viewing lower quality chapter images.",
        },
        [this.dataSaverRow()],
      ),
      Section(
        {
          id: "affects-info",
          footer:
            "Where Each Setting Applies:\nOriginal Language Filter: Latest Updates, Search\nChapter Language Filter: Chapter List, Chapter Version Priority\nTag Exclusion Filter: Latest Updates, Search, Search Filters\nItems Per Page: Discover Sections, Search\nData Saver: Chapter Images",
        },
        [],
      ),
    ];
  }

  chapterLanguageRow(): FormItemElement<unknown> {
    const languageFilterProps: SelectRowProps = {
      title: "Chapter Language Filter",
      options: AVAILABLE_LANGUAGES,
      value: getChapterLanguages(),
      minItemCount: 0,
      maxItemCount: AVAILABLE_LANGUAGES.length,
      onValueChange: Application.Selector(this as SiteSettingsForm, "handleChapterLanguageChange"),
    };

    return SelectRow("chapter-language-filter", languageFilterProps);
  }

  originalLanguageRow(): FormItemElement<unknown> {
    const languageFilterProps: SelectRowProps = {
      title: "Original Language Filter",
      options: AVAILABLE_LANGUAGES,
      value: getOriginalLanguages(),
      minItemCount: 0,
      maxItemCount: AVAILABLE_LANGUAGES.length,
      onValueChange: Application.Selector(this as SiteSettingsForm, "handleOriginalLanguageChange"),
    };

    return SelectRow("original-language-filter", languageFilterProps);
  }

  tagExclusionRow(): FormItemElement<unknown> {
    if (!this.tags && !this.tagsLoadError) {
      const loadingProps: SelectRowProps = {
        title: "Tag Exclusion Filter (Loading...)",
        options: [],
        value: [],
        minItemCount: 0,
        maxItemCount: 1,
        onValueChange: Application.Selector(this as SiteSettingsForm, "handleTagExclusionChange"),
      };
      return SelectRow("tag-exclusion-filter", loadingProps);
    }

    if (this.tagsLoadError) {
      const errorProps: SelectRowProps = {
        title: "Tag Exclusion Filter (Error Loading)",
        options: [],
        value: [],
        minItemCount: 0,
        maxItemCount: 1,
        onValueChange: Application.Selector(this as SiteSettingsForm, "handleTagExclusionChange"),
      };
      return SelectRow("tag-exclusion-filter", errorProps);
    }

    const tagOptions = this.tags!.data.map((tag) => ({
      id: tag.id,
      title: tag.name,
    }));

    const tagFilterProps: SelectRowProps = {
      title: "Tag Exclusion Filter",
      options: tagOptions,
      value: getExcludedTags(),
      minItemCount: 0,
      maxItemCount: tagOptions.length,
      onValueChange: Application.Selector(this as SiteSettingsForm, "handleTagExclusionChange"),
    };

    return SelectRow("tag-exclusion-filter", tagFilterProps);
  }

  itemsPerPageRow(): FormItemElement<unknown> {
    const itemsPerPageProps: SelectRowProps = {
      title: "Items Per Page",
      options: ITEMS_PER_PAGE_OPTIONS,
      value: [getItemsPerPage()],
      minItemCount: 0,
      maxItemCount: 1,
      onValueChange: Application.Selector(this as SiteSettingsForm, "handleItemsPerPageChange"),
    };

    return SelectRow("items-per-page", itemsPerPageProps);
  }

  dataSaverRow(): FormItemElement<unknown> {
    const dataSaverProps: ToggleRowProps = {
      title: "Data Saver",
      value: getDataSaver(),
      onValueChange: Application.Selector(this as SiteSettingsForm, "handleDataSaverChange"),
    };

    return ToggleRow("data-saver", dataSaverProps);
  }

  async handleChapterLanguageChange(value: string[]): Promise<void> {
    setChapterLanguages(value);
    this.reloadForm();
  }

  async handleOriginalLanguageChange(value: string[]): Promise<void> {
    setOriginalLanguages(value);
    this.reloadForm();
  }

  async handleTagExclusionChange(value: string[]): Promise<void> {
    setExcludedTags(value);
    this.reloadForm();
  }

  async handleItemsPerPageChange(value: string[]): Promise<void> {
    const selectedValue = value[0] ?? "42";
    setItemsPerPage(selectedValue);
    this.reloadForm();
  }

  async handleDataSaverChange(value: boolean): Promise<void> {
    setDataSaver(value);
    this.reloadForm();
  }
}
