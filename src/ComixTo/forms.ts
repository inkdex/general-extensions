import {
  ButtonRow,
  Form,
  NavigationRow,
  Section,
  SelectRow,
  type FormSectionElement,
} from "@paperback/types";
import { filter } from "./main";

abstract class BaseSettings extends Form {
  protected async updateValue<T>(value: T, id: string): Promise<void> {
    Application.setState(value, id);
    Application.invalidateSearchFilters();
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }
}

export class MainSettings extends BaseSettings {
  override getSections(): FormSectionElement[] {
    return [
      Section("settings", [
        NavigationRow("Contents", {
          title: "Contents",
          subtitle: "Contents Tags Settings",
          form: new FilterSettings(),
        }),
        ButtonRow("reload_genres", {
          title: "Reload all Filters",
          onSelect: Application.Selector(this as MainSettings, "refreshFilters"),
        }),
      ]),
      Section("home_sections", [
        NavigationRow("HomeSections", {
          title: "Home Sections",
          subtitle: "Home Sections Settings",
          form: new SectionSettings(),
        }),
      ]),
    ];
  }
  async refreshFilters() {
    Application.invalidateSearchFilters();
    await filter.updateFilters(true);
    this.reloadForm();
  }
}

class SectionSettings extends BaseSettings {
  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "limit_settings",
          footer: "Time Range Settings",
        },
        [
          SelectRow("limit", {
            title: "Time Range",
            subtitle: "Defines the time range for retrieving top-ranked content on Sections",
            value: filter.getLimitSettings(),
            options: this.limitMap,
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(this as SectionSettings, "handleLimitStatusChange"),
          }),
          ButtonRow("reset_time", {
            title: "Reset to Default Value",
            onSelect: Application.Selector(this as SectionSettings, "handleLimitStatusChangeReset"),
          }),
        ],
      ),
    ];
  }
  limitMap = filter.sectionLimit.map(({ value, id }) => ({
    title: value,
    id: id,
  }));
  async handleLimitStatusChange(id: string[]): Promise<void> {
    await this.updateValue(id, "limit");
  }
  async handleLimitStatusChangeReset(): Promise<void> {
    await this.updateValue(["1"], "limit");
  }
}

class FilterSettings extends BaseSettings {
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

  override getSections(): FormSectionElement[] {
    return [
      Section(
        {
          id: "update_settings",
          footer: "Tags Settings",
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
        ],
      ),
      Section(
        {
          id: "type_settings",
          footer: "Type Settings",
        },
        [
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
      Section(
        {
          id: "reset_settings",
          footer: "Reset Settings",
        },
        [
          ButtonRow("reset_genres", {
            title: "Reset all Filters",
            onSelect: Application.Selector(this as FilterSettings, "resetFilters"),
          }),
        ],
      ),
    ];
  }

  async handleHideGenresStatusChange(id: string[]) {
    await this.updateValue(id, "hide_genres");
  }

  async handleHideThemesStatusChange(id: string[]) {
    await this.updateValue(id, "hide_themes");
  }

  async handleShowOnlyStatusChange(id: string[]) {
    await this.updateValue(id, "show_only");
  }

  async resetFilters() {
    await this.updateValue([], "hide_genres");
    await this.updateValue([], "hide_themes");
    await this.updateValue([], "show_only");
  }
}
