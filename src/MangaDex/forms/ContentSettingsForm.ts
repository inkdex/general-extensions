import { Form, Section, SelectRow, ToggleRow, type FormSectionElement } from "@paperback/types";
import { MDImageQuality, MDLanguages, MDRatings } from "../MangaDexHelper";
import {
  getCoverArtworkEnabled,
  getCropImagesEnabled,
  getCustomCoversEnabled,
  getDataSaver,
  getDiscoverThumbnail,
  getForcePort443,
  getLanguages,
  getMangaThumbnail,
  getRatings,
  getSearchThumbnail,
  getSkipSameChapter,
} from "../MangaDexSettings";
import { State } from "../utils/StateUtil";

/**
 * Form for configuring content settings including:
 * - Languages for content display
 * - Content ratings filter
 * - Data saver mode
 * - Thumbnail quality settings
 */
export class ContentSettingsForm extends Form {
  // State objects for all configurable settings
  private languagesState: State<string[]>;
  private ratingsState: State<string[]>;
  private dataSaverState: State<boolean>;
  private skipSameChapterState: State<boolean>;
  private forcePortState: State<boolean>;
  private coverArtworkState: State<boolean>;
  private customCoversState: State<boolean>;
  private discoverThumbState: State<string>;
  private searchThumbState: State<string>;
  private mangaThumbState: State<string>;
  private cropImagesState: State<boolean>;

  constructor() {
    super();
    this.languagesState = new State<string[]>(this, "languages", getLanguages());
    this.ratingsState = new State<string[]>(this, "ratings", getRatings());
    this.dataSaverState = new State<boolean>(this, "data_saver", getDataSaver());
    this.skipSameChapterState = new State<boolean>(this, "skip_same_chapter", getSkipSameChapter());
    this.forcePortState = new State<boolean>(this, "force_port_443", getForcePort443());
    this.coverArtworkState = new State<boolean>(
      this,
      "cover_artwork_enabled",
      getCoverArtworkEnabled(),
    );
    this.customCoversState = new State<boolean>(
      this,
      "custom_covers_enabled",
      getCustomCoversEnabled(),
    );
    this.discoverThumbState = new State<string>(this, "discover_thumbnail", getDiscoverThumbnail());
    this.searchThumbState = new State<string>(this, "search_thumbnail", getSearchThumbnail());
    this.mangaThumbState = new State<string>(this, "manga_thumbnail", getMangaThumbnail());
    this.cropImagesState = new State<boolean>(this, "crop_images_enabled", getCropImagesEnabled());
  }

  override getSections(): FormSectionElement[] {
    return [
      Section("generalContent", [
        SelectRow("languages", {
          title: "Languages",
          subtitle: (() => {
            const selectedLangCodes = this.languagesState.value;
            const selectedLangNames = selectedLangCodes
              .map((langCode) => MDLanguages.getName(langCode))
              .sort((a, b) => a.localeCompare(b));
            return selectedLangNames.join(", ");
          })(),
          value: this.languagesState.value,
          minItemCount: 1,
          maxItemCount: 100,
          options: MDLanguages.getMDCodeList().map((x) => ({
            id: x,
            title: MDLanguages.getName(x),
          })),
          onValueChange: this.languagesState.selector,
        }),
        SelectRow("ratings", {
          title: "Content Rating",
          subtitle: (() => {
            const selectedRatings = this.ratingsState.value;
            const desiredOrder = ["safe", "suggestive", "erotica", "pornographic"];
            const orderedSelected = desiredOrder
              .filter((ratingId) => selectedRatings.includes(ratingId))
              .map((ratingId) => MDRatings.getName(ratingId));
            return orderedSelected.join(", ");
          })(),
          value: this.ratingsState.value,
          minItemCount: 1,
          maxItemCount: 4,
          options: MDRatings.getEnumList().map((x) => ({
            id: x,
            title: MDRatings.getName(x),
          })),
          onValueChange: this.ratingsState.selector,
        }),
        ToggleRow("data_saver", {
          title: "Data Saver",
          value: this.dataSaverState.value,
          onValueChange: this.dataSaverState.selector,
        }),
        ToggleRow("skip_same_chapter", {
          title: "Skip Same Chapter",
          value: this.skipSameChapterState.value,
          onValueChange: this.skipSameChapterState.selector,
        }),
        ToggleRow("force_port", {
          title: "Force Port 443",
          value: this.forcePortState.value,
          onValueChange: this.forcePortState.selector,
        }),
        ToggleRow("cover_artwork", {
          title: "Enable Cover Artwork in Manga Description",
          subtitle: "Show all available volume covers in manga details page",
          value: this.coverArtworkState.value,
          onValueChange: this.coverArtworkState.selector,
        }),
        ToggleRow("custom_covers", {
          title: "Use User Selected Cover Artwork",
          subtitle: "Load and choose covers from the tracker (envelope icon)",
          value: this.customCoversState.value,
          onValueChange: this.customCoversState.selector,
        }),
        ToggleRow("crop_images", {
          title: "Enable Image Cropping",
          subtitle:
            "Automatically removes whitespace borders from images. Will noticeably increase loading time. Works best with Data Saver enabled",
          value: this.cropImagesState.value,
          onValueChange: this.cropImagesState.selector,
        }),
      ]),
      Section("thumbnail_settings", [
        SelectRow("discover_thumbnail", {
          title: "Home Thumbnail Quality",
          subtitle: MDImageQuality.getName(this.discoverThumbState.value),
          value: [this.discoverThumbState.value],
          minItemCount: 1,
          maxItemCount: 1,
          options: MDImageQuality.getEnumList().map((x) => ({
            id: x,
            title: MDImageQuality.getName(x),
          })),
          onValueChange: Application.Selector(
            this as ContentSettingsForm,
            "handleDiscoverThumbChange",
          ),
        }),
        SelectRow("search_thumbnail", {
          title: "Search Thumbnail Quality",
          subtitle: MDImageQuality.getName(this.searchThumbState.value),
          value: [this.searchThumbState.value],
          minItemCount: 1,
          maxItemCount: 1,
          options: MDImageQuality.getEnumList().map((x) => ({
            id: x,
            title: MDImageQuality.getName(x),
          })),
          onValueChange: Application.Selector(
            this as ContentSettingsForm,
            "handleSearchThumbChange",
          ),
        }),
        SelectRow("manga_thumbnail", {
          title: "Manga Thumbnail Quality",
          subtitle: MDImageQuality.getName(this.mangaThumbState.value),
          value: [this.mangaThumbState.value],
          minItemCount: 1,
          maxItemCount: 1,
          options: MDImageQuality.getEnumList().map((x) => ({
            id: x,
            title: MDImageQuality.getName(x),
          })),
          onValueChange: Application.Selector(
            this as ContentSettingsForm,
            "handleMangaThumbChange",
          ),
        }),
      ]),
    ];
  }

  // Handlers for thumbnail quality changes
  async handleDiscoverThumbChange(value: string[]): Promise<void> {
    await this.discoverThumbState.updateValue(value[0]);
  }

  async handleSearchThumbChange(value: string[]): Promise<void> {
    await this.searchThumbState.updateValue(value[0]);
  }

  async handleMangaThumbChange(value: string[]): Promise<void> {
    await this.mangaThumbState.updateValue(value[0]);
  }
}
