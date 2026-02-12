import type { SearchFilter } from "@paperback/types";
import { parse } from "./main";
import type { OptionItem } from "./models";

export class globalFilters {
  genres: OptionItem[] = [];
  themes: OptionItem[] = [];
  demographic: OptionItem[] = [];
  formats: OptionItem[] = [];

  async checkFilters(): Promise<void> {
    if (
      this.demographic.length === 0 ||
      this.formats.length === 0 ||
      this.themes.length === 0 ||
      this.genres.length === 0
    ) {
      await this.updateFilters(true);
    }
  }
  contentType = [
    { id: "manga", value: "Manga" },
    { id: "manhwa", value: "Manhwa" },
    { id: "manhua", value: "Manhua" },
    { id: "other", value: "Other" },
  ];

  order = [
    { id: "relevance$desc", label: "Best Match" },
    { id: "chapter_updated_at$asc", label: "Update Date ↑" },
    { id: "chapter_updated_at$desc", label: "Update Date ↓" },
    { id: "created_at$asc", label: "Created Date ↑" },
    { id: "created_at$desc", label: "Created Date ↓" },
    { id: "title$asc", label: "Title ↑" },
    { id: "title$desc", label: "Title ↓" },
    { id: "year$asc", label: "Year ↑" },
    { id: "year$desc", label: "Year ↓" },
    { id: "score$asc", label: "Average Score ↑" },
    { id: "score$desc", label: "Average Score ↓" },
    { id: "total_views$asc", label: "Total Views ↑" },
    { id: "total_views$desc", label: "Total Views ↓" },
    { id: "followed_count$asc", label: "Most Follows ↑" },
    { id: "followed_count$desc", label: "Most Follows ↓" },
    { id: "views_7d$asc", label: "Most Views 7 Days ↑" },
    { id: "views_7d$desc", label: "Most Views 7 Days ↓" },
    { id: "views_30d$asc", label: "Most Views 1 Month ↑" },
    { id: "views_30d$desc", label: "Most Views 1 Month ↓" },
    { id: "views_90d$asc", label: "Most Views 3 Month ↑" },
    { id: "views_90d$desc", label: "Most Views 3 Month ↓" },
  ];

  publication_status = [
    { id: "finished", value: "Finished" },
    { id: "releasing", value: "Releasing" },
    { id: "on_hiatus", value: "On Hiatus" },
    { id: "discontinued", value: "Discontinued" },
    { id: "not_yet_released", value: "Not Yet Released" },
  ];

  sectionLimit = [
    { id: "1", value: "Day" },
    { id: "7", value: "Week" },
    { id: "30", value: "1 Month" },
    { id: "90", value: "3 Month" },
    { id: "180", value: "6 Month" },
    { id: "365", value: "1 Year" },
  ];

  async getFilters() {
    const filters: SearchFilter[] = [];
    await this.updateFilters(false);
    const genresHidden = this.getHiddenGenresSettings();
    const getExcludedGenreObject = Object.fromEntries(
      this.genres
        .filter((option) => genresHidden.includes(option.id))
        .map((item) => [item.id, "excluded" as const]),
    ) as Record<string, "included" | "excluded">;
    const themesHidden = this.getHiddenThemesSettings();
    const getExcludedThemesObject = Object.fromEntries(
      this.genres
        .filter((option) => themesHidden.includes(option.id))
        .map((item) => [item.id, "excluded" as const]),
    ) as Record<string, "included" | "excluded">;
    const showOnly = this.getShowOnlySettings();
    const getShowOnlyObject = Object.fromEntries(
      this.contentType
        .filter((option) => showOnly.includes(option.id))
        .map((item) => [item.id, "included" as const]),
    ) as Record<string, "included" | "excluded">;

    filters.push({
      type: "multiselect",
      id: "genres",
      title: "Genres",
      options: this.genres,
      value: getExcludedGenreObject,
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: this.genres.length,
    });
    filters.push({
      type: "multiselect",
      id: "themes",
      title: "Themes",
      options: this.themes,
      value: getExcludedThemesObject,
      allowExclusion: true,
      allowEmptySelection: true,
      maximum: this.themes.length,
    });
    filters.push({
      type: "multiselect",
      id: "formats",
      title: "Formats",
      options: this.formats,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: this.formats.length,
    });
    filters.push({
      type: "dropdown",
      id: "filter_mode",
      title: "Filter Mode",
      value: "and",
      options: [
        { id: "and", value: "AND" },
        { id: "or", value: "OR" },
      ],
    });
    filters.push({
      type: "multiselect",
      id: "types",
      title: "Types",
      options: this.contentType,
      value: getShowOnlyObject,
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: this.contentType.length,
    });
    filters.push({
      type: "multiselect",
      id: "demographic",
      title: "Demographic",
      options: this.demographic,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: this.demographic.length,
    });
    filters.push({
      type: "multiselect",
      id: "status",
      title: "Status",
      options: this.publication_status,
      value: {},
      allowExclusion: false,
      allowEmptySelection: true,
      maximum: this.publication_status.length,
    });
    return filters;
  }

  getHiddenGenresSettings() {
    return (Application.getState("hide_genres") as string[] | undefined) ?? [];
  }

  getHiddenThemesSettings() {
    return (Application.getState("hide_themes") as string[] | undefined) ?? [];
  }

  getShowOnlySettings() {
    return (Application.getState("show_only") as string[] | undefined) ?? [];
  }

  getLimitSettings() {
    return (Application.getState("limit") as string[] | undefined) ?? ["7"];
  }

  async updateFilters(force: boolean) {
    const lastFilterFetch = Number(Application.getState("last-filter-fetch") ?? 0);
    const cached = lastFilterFetch + 172800 > new Date().valueOf() / 1000;
    if (cached && !force) {
      const keys = ["genre", "demographic", "theme", "format"] as const;
      const values = keys.map((k) => Application.getState(`${k}`) as string | undefined);
      const [genres, demographic, themes, formats] = values;
      if (
        genres === undefined ||
        demographic === undefined ||
        themes === undefined ||
        formats === undefined
      ) {
        await this.updateFilters(true);
        return;
      }

      this.setGenreFilter(JSON.parse(genres) as OptionItem[]);
      this.setDemographicFilter(JSON.parse(demographic) as OptionItem[]);
      this.setThemesFilter(JSON.parse(themes) as OptionItem[]);
      this.setFormatsFilter(JSON.parse(formats) as OptionItem[]);
      await this.checkFilters();
    } else {
      this.genres = await parse.parseFilterUpdate("genre");
      this.demographic = await parse.parseFilterUpdate("demographic");
      this.themes = await parse.parseFilterUpdate("theme");
      this.formats = await parse.parseFilterUpdate("format");
      Application.setState(String(new Date().valueOf() / 1000), "last-filter-fetch");
    }
  }
  private setGenreFilter(newValue: OptionItem[]) {
    this.genres = newValue;
    Application.setState(JSON.stringify(newValue), "genre");
  }
  private setDemographicFilter(newValue: OptionItem[]) {
    this.demographic = newValue;
    Application.setState(JSON.stringify(newValue), "demographic");
  }
  private setThemesFilter(newValue: OptionItem[]) {
    this.themes = newValue;
    Application.setState(JSON.stringify(newValue), "theme");
  }
  private setFormatsFilter(newValue: OptionItem[]) {
    this.formats = newValue;
    Application.setState(JSON.stringify(newValue), "format");
  }
}
