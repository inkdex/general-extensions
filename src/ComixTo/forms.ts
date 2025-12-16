import {
  ButtonRow,
  Form,
  NavigationRow,
  Section,
  SelectRow,
  type FormSectionElement,
} from "@paperback/types";
import { filter } from "./main";

export class Forms extends Form {
  override getSections(): FormSectionElement[] {
    return [
      Section("settings", [
        NavigationRow("Contents", {
          title: "Contents",
          subtitle: "Contents Settings",
          form: new FilterSettings(),
        }),
        ButtonRow("reload_genres", {
          title: "Reload all Filters",
          onSelect: Application.Selector(this as Forms, "refreshFilters"),
        }),
      ]),
      Section("limit", [
        NavigationRow("Limit", {
          title: "Limit",
          subtitle: "Limit Settings",
          form: new LimitSettings(),
        }),
      ]),
    ];
  }
  async refreshFilters() {
    Application.invalidateSearchFilters();
    await filter.updateFilters(true);
  }
}

class LimitSettings extends Form {
  limitMap = filter.sectionLimit.map(({ value, id }) => ({
    title: value,
    id: id,
  }));

  public async updateValue(value: string[], filter: string): Promise<void> {
    Application.setState(value, filter);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }
  override getSections(): FormSectionElement[] {
    return [
      Section({ id: "limit_settings", footer: "Limit Settings" }, [
        SelectRow("limit", {
          title: "Content Time Limit",
          subtitle: "Show this time limit of content in sections",
          value: filter.getLimitSettings(),
          options: this.limitMap,
          minItemCount: 1,
          maxItemCount: 1,
          onValueChange: Application.Selector(this as LimitSettings, "handleLimitStatusChange"),
        }),
      ]),
    ];
  }

  async handleLimitStatusChange(id: string[]): Promise<void> {
    await this.updateValue(id, "limit");
  }
}

class FilterSettings extends Form {
  genresMap = filter.genres.map(({ value, id }) => ({
    title: value,
    id: id,
  }));
  themesMap = filter.themes.map(({ value, id }) => ({
    title: value,
    id: id,
  }));
  typeMap = filter.contentType.map(({ value, id }) => ({
    title: value,
    id: id,
  }));

  public async updateValue(value: string[], filter: string): Promise<void> {
    Application.setState(value, filter);
    Application.invalidateSearchFilters();
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }
  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "update_settings",
          footer: "Content Settings",
        },
        [
          SelectRow("hide_genres", {
            title: "Hide Genres",
            subtitle: "Hide Some Genre",
            value: filter.getHiddenGenresSettings(),
            options: this.genresMap,
            minItemCount: 0,
            maxItemCount: this.genresMap.length,
            onValueChange: Application.Selector(
              this as FilterSettings,
              "handleHideGenresStatusChange",
            ),
          }),
          SelectRow("hide_theme", {
            title: "Hide Themes",
            subtitle: "Hide Some Theme",
            value: filter.getHiddenThemesSettings(),
            options: this.themesMap,
            minItemCount: 0,
            maxItemCount: this.themesMap.length,
            onValueChange: Application.Selector(
              this as FilterSettings,
              "handleHideThemesStatusChange",
            ),
          }),
          SelectRow("type", {
            title: "Content Type",
            subtitle: "Show Only this type of content",
            value: filter.getShowOnlySettings(),
            options: this.typeMap,
            minItemCount: 0,
            maxItemCount: this.typeMap.length,
            onValueChange: Application.Selector(
              this as FilterSettings,
              "handleShowOnlyStatusChange",
            ),
          }),
        ],
      ),
    ];
  }

  async handleHideGenresStatusChange(id: string[]): Promise<void> {
    await this.updateValue(id, "hide_genres");
  }

  async handleHideThemesStatusChange(id: string[]): Promise<void> {
    await this.updateValue(id, "hide_themes");
  }

  async handleShowOnlyStatusChange(id: string[]): Promise<void> {
    await this.updateValue(id, "show_only");
  }
}
