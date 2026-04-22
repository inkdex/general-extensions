import {
  EditSection,
  Form,
  LabelRow,
  Section,
  SelectRow,
  type FormItemElement,
  type FormSectionElement,
  type SelectRowProps,
  type SelectorID,
} from "@paperback/types";
import {
  getDefaultSearchPage,
  getDefaultSearchSort,
  getHiddenSearchGenres,
  getSearchGenreOrder,
  setDefaultSearchPage,
  setDefaultSearchSort,
  setHiddenSearchGenres,
  setSearchGenreOrder,
} from "./main";
import { getSearchGenreOption } from "../../shared/utils";
import { DEFAULT_PAGE_OPTIONS, SEARCH_STATUS_OPTIONS } from "../models";
import {
  getCallbackIndexes,
  getCallbackRowId,
  moveSettingId,
  normalizePrefixedSettingId,
  removeSettingId,
} from "../utils";

export class SearchSettingsForm extends Form {
  private hiddenGenreRowSelectHandlers: Record<string, { handleSelect: () => Promise<void> }> = {};

  override getSections(): FormSectionElement<unknown>[] {
    const visibleGenreIds = this.getVisibleGenreIds();
    const hiddenGenreIds = this.getHiddenGenreIds();
    const sections: FormSectionElement<unknown>[] = [
      Section(
        {
          id: "default-sort",
          footer: "Status option applied by default in search.",
        },
        [this.defaultSortRow()],
      ),
    ];

    if (getDefaultSearchSort() === "") {
      sections.push(
        Section(
          {
            id: "default-search-page",
            footer: "Page used when search is opened without a query or filters.",
          },
          [this.defaultSearchPageRow()],
        ),
      );
    }

    this.hiddenGenreRowSelectHandlers = {};

    if (visibleGenreIds.length > 0) {
      sections.push(
        EditSection("visible-search-genres", {
          id: "visible-search-genres",
          header: "Prioritized Genres",
          footer: "Long press to reorder. Swipe to remove",
          items: visibleGenreIds.map((genreId) => this.genreRow(genreId)),
          onDeletion: Application.Selector(this as SearchSettingsForm, "handleVisibleGenreDelete"),
          onReorder: Application.Selector(this as SearchSettingsForm, "handleVisibleGenreReorder"),
        }),
      );
    }

    if (hiddenGenreIds.length > 0) {
      sections.push(
        Section(
          {
            id: "hidden-search-genres",
            header: "Available Genres",
            footer: "Tap to restore",
          },
          hiddenGenreIds.map((genreId) => this.hiddenGenreRow(genreId)),
        ),
      );
    }

    return sections;
  }

  defaultSortRow(): FormItemElement<unknown> {
    const props: SelectRowProps = {
      title: "Default Sort",
      options: SEARCH_STATUS_OPTIONS,
      value: [getDefaultSearchSort()],
      minItemCount: 1,
      maxItemCount: 1,
      onValueChange: Application.Selector(this as SearchSettingsForm, "handleDefaultSortChange"),
    };

    return SelectRow("default-search-sort", props);
  }

  defaultSearchPageRow(): FormItemElement<unknown> {
    const props: SelectRowProps = {
      title: "Default Page",
      options: DEFAULT_PAGE_OPTIONS,
      value: [getDefaultSearchPage()],
      minItemCount: 1,
      maxItemCount: 1,
      onValueChange: Application.Selector(
        this as SearchSettingsForm,
        "handleDefaultSearchPageChange",
      ),
    };

    return SelectRow("default-search-page", props);
  }

  async handleDefaultSortChange(value: string[]): Promise<void> {
    setDefaultSearchSort(value[0] ?? "");
    this.reloadForm();
  }

  async handleDefaultSearchPageChange(value: string[]): Promise<void> {
    setDefaultSearchPage(value[0] ?? "most-popular");
    this.reloadForm();
  }

  private getVisibleGenreIds(): string[] {
    const hiddenGenres = getHiddenSearchGenres();

    return getSearchGenreOrder().filter((genreId) => !hiddenGenres.includes(genreId));
  }

  private getHiddenGenreIds(): string[] {
    const hiddenGenres = getHiddenSearchGenres();

    return getSearchGenreOrder().filter((genreId) => hiddenGenres.includes(genreId));
  }

  private genreRow(
    genreId: string,
    onSelect?: SelectorID<() => Promise<void>>,
  ): FormItemElement<unknown> {
    const genre = getSearchGenreOption(genreId);

    return LabelRow(`search-genre-${genreId}`, {
      title: genre?.value ?? genreId,
      onSelect,
    });
  }

  private hiddenGenreRow(genreId: string): FormItemElement<unknown> {
    const handler = {
      handleSelect: async (): Promise<void> => {
        this.restoreHiddenGenre(genreId);
      },
    };

    this.hiddenGenreRowSelectHandlers[genreId] = handler;

    return this.genreRow(genreId, Application.Selector(handler, "handleSelect"));
  }

  private saveGenreLists(visibleGenres: string[], hiddenGenres: string[]): void {
    setHiddenSearchGenres(hiddenGenres);
    setSearchGenreOrder([...visibleGenres, ...hiddenGenres]);
    Application.invalidateSearchFilters();
    this.reloadForm();
  }

  private getGenreIdFromCallbackArgs(args: unknown[]): string | undefined {
    const rowId = getCallbackRowId(args);
    return rowId ? this.normalizeCallbackGenreId(rowId) : undefined;
  }

  private normalizeCallbackGenreId(value: string): string | undefined {
    return normalizePrefixedSettingId(
      value,
      "search-genre-",
      (genreId) => getSearchGenreOption(genreId) !== undefined,
    );
  }

  async handleVisibleGenreReorder(...args: unknown[]): Promise<void> {
    const [sourceIndex, destinationIndex] = getCallbackIndexes(args);
    if (sourceIndex === undefined || destinationIndex === undefined) {
      return;
    }

    const genreId = this.getGenreIdFromCallbackArgs(args);

    this.saveGenreLists(
      moveSettingId(this.getVisibleGenreIds(), sourceIndex, destinationIndex, genreId),
      this.getHiddenGenreIds(),
    );
  }

  async handleVisibleGenreDelete(...args: unknown[]): Promise<void> {
    const visibleGenres = this.getVisibleGenreIds();
    const [index = -1] = getCallbackIndexes(args);
    const genreId = this.getGenreIdFromCallbackArgs(args);
    const deletedGenreId = genreId ?? visibleGenres[index];
    if (!deletedGenreId) {
      return;
    }

    removeSettingId(visibleGenres, index, deletedGenreId);
    this.saveGenreLists(visibleGenres, [...this.getHiddenGenreIds(), deletedGenreId]);
  }

  private restoreHiddenGenre(genreId: string): void {
    const hiddenGenres = this.getHiddenGenreIds();
    if (!hiddenGenres.includes(genreId)) {
      return;
    }

    removeSettingId(hiddenGenres, hiddenGenres.indexOf(genreId), genreId);
    this.saveGenreLists([...this.getVisibleGenreIds(), genreId], hiddenGenres);
  }
}
