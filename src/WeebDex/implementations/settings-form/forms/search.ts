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
import { SORT_OPTIONS, SUBTITLE_OPTIONS } from "../models";
import {
  getDefaultSearchSort,
  getHideAdultResults,
  getSearchSubtitle,
  setDefaultSearchSort,
  setHideAdultResults,
  setSearchSubtitle,
} from "./main";

export class SearchSettingsForm extends Form {
  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "default-sort",
          footer: "Sort order applied to all results by default.",
        },
        [this.defaultSortRow()],
      ),
      Section(
        {
          id: "hide-adult",
          footer: "Filter out erotica and pornographic content.",
        },
        [this.hideAdultRow()],
      ),
      Section(
        {
          id: "search-subtitle",
          footer: "Information displayed below each title.",
        },
        [this.searchSubtitleRow()],
      ),
    ];
  }

  defaultSortRow(): FormItemElement<unknown> {
    const sortProps: SelectRowProps = {
      title: "Default Sort",
      options: SORT_OPTIONS,
      value: [getDefaultSearchSort()],
      minItemCount: 1,
      maxItemCount: 1,
      onValueChange: Application.Selector(this as SearchSettingsForm, "handleDefaultSortChange"),
    };

    return SelectRow("default-search-sort", sortProps);
  }

  hideAdultRow(): FormItemElement<unknown> {
    const hideAdultProps: ToggleRowProps = {
      title: "Hide Adult Titles",
      value: getHideAdultResults(),
      onValueChange: Application.Selector(this as SearchSettingsForm, "handleHideAdultChange"),
    };

    return ToggleRow("hide-adult-results", hideAdultProps);
  }

  searchSubtitleRow(): FormItemElement<unknown> {
    const subtitleProps: SelectRowProps = {
      title: "Result Subtitle",
      options: SUBTITLE_OPTIONS,
      value: [getSearchSubtitle()],
      minItemCount: 1,
      maxItemCount: 1,
      onValueChange: Application.Selector(this as SearchSettingsForm, "handleSearchSubtitleChange"),
    };

    return SelectRow("search-subtitle", subtitleProps);
  }

  async handleDefaultSortChange(value: string[]): Promise<void> {
    const selectedValue = value[0] ?? "none";
    setDefaultSearchSort(selectedValue);
    this.reloadForm();
  }

  async handleHideAdultChange(value: boolean): Promise<void> {
    setHideAdultResults(value);
    this.reloadForm();
  }

  async handleSearchSubtitleChange(value: string[]): Promise<void> {
    const selectedValue = value[0] ?? "status";
    setSearchSubtitle(selectedValue);
    this.reloadForm();
  }
}
