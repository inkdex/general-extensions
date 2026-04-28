import {
  AdvancedSearchForm,
  Section,
  SelectRow,
  type FormItemElement,
  type FormSectionElement,
  type SearchQuery,
  type TagSection,
} from "@paperback/types";

import { getGenresFromTags, getStatusesFromTags, getTypesFromTags } from "./helpers";
import type { SearchMetadata } from "./models";

export class MangapillAdvancedSearchForm extends AdvancedSearchForm {
  private searchMetadata: SearchMetadata;
  private tags: TagSection[];
  constructor(searchQuery: SearchQuery<SearchMetadata>, tags: TagSection[]) {
    super();
    if (searchQuery.metadata !== undefined) {
      this.searchMetadata = searchQuery.metadata;
    } else {
      this.searchMetadata = {
        genres: [],
      };
    }
    this.tags = tags;
  }

  override getSearchQueryMetadata(): SearchMetadata {
    return this.searchMetadata;
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("genres", this.getGenresFilter(this.tags)),
      Section("types", this.getTypesFilter(this.tags)),
      Section("statuses", this.getStatusesFilter(this.tags)),
    ];
  }

  getGenresFilter(tags: TagSection[]): FormItemElement<unknown>[] {
    const tag = getGenresFromTags(tags);
    return [
      SelectRow("genres", {
        title: tag.title,
        subtitle: "Select the genre(s) to include in search results",
        value: this.searchMetadata.genres ?? [],
        minItemCount: 0,
        maxItemCount: tag.tags.length,
        options: tag.tags.map((x) => ({ id: x.id, title: x.title })),
        onValueChange: Application.Selector(
          this as MangapillAdvancedSearchForm,
          "handleGenresChange",
        ),
      }),
    ];
  }

  async handleGenresChange(value: string[]): Promise<void> {
    this.searchMetadata.genres = value;
  }

  getTypesFilter(tags: TagSection[]): FormItemElement<unknown>[] {
    const tag = getTypesFromTags(tags);
    return [
      SelectRow("types", {
        title: tag.title,
        subtitle: "Select the type(s) to include in search results",
        value: this.searchMetadata.types ?? [],
        minItemCount: 0,
        maxItemCount: 1,
        options: tag.tags.map((x) => ({ id: x.id, title: x.title })),
        onValueChange: Application.Selector(
          this as MangapillAdvancedSearchForm,
          "handleTypesChange",
        ),
      }),
    ];
  }

  async handleTypesChange(value: string[]): Promise<void> {
    this.searchMetadata.types = value;
  }

  getStatusesFilter(tags: TagSection[]): FormItemElement<unknown>[] {
    const tag = getStatusesFromTags(tags);
    return [
      SelectRow("statuses", {
        title: tag.title,
        subtitle: "Select the status(s) to include in search results",
        value: this.searchMetadata.statuses ?? [],
        minItemCount: 0,
        maxItemCount: 1,
        options: tag.tags.map((x) => ({ id: x.id, title: x.title })),
        onValueChange: Application.Selector(
          this as MangapillAdvancedSearchForm,
          "handleStatusesChange",
        ),
      }),
    ];
  }

  async handleStatusesChange(value: string[]): Promise<void> {
    this.searchMetadata.statuses = value;
  }

  override async formDidSubmit(): Promise<void> {
    if (this.searchMetadata.statuses && this.searchMetadata.statuses.length > 1) {
      throw new Error("Only one status can be selected");
    }
    if (this.searchMetadata.types && this.searchMetadata.types.length > 1) {
      throw new Error("Only one type can be selected");
    }
  }
}
