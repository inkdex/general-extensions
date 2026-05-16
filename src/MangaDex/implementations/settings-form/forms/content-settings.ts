/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  Form,
  NavigationRow,
  Section,
  SelectRow,
  ToggleRow,
  type FormSectionElement,
} from "@paperback/types";

import { MDLanguages } from "../../shared/languages";
import {
  getImageQualityEnumList,
  getImageQualityName,
  getRatingEnumList,
  getRatingName,
} from "../../shared/lookups";
import {
  getCropImagesEnabled,
  getDataSaver,
  getDiscoverThumbnail,
  getForcePort443,
  getLanguagePriority,
  getLanguages,
  getMangaThumbnail,
  getNativeTitleDisplay,
  getRatings,
  getRomanizedPriorityEnabled,
  getSearchThumbnail,
  getSkipSameChapter,
  setCropImagesEnabled,
  setDataSaver,
  setDiscoverThumbnail,
  setForcePort443,
  setLanguagePriority,
  setLanguages,
  setMangaThumbnail,
  setNativeTitleDisplay,
  setRatings,
  setRomanizedPriorityEnabled,
  setSearchThumbnail,
  setSkipSameChapter,
} from "../../shared/state";
import { LanguagePriorityForm } from "./language-priority";

const NATIVE_TITLE_DISPLAY_LABELS: Record<string, string> = {
  none: "None",
  author: "Author Field",
  author_desc: "Author Field (+ Author)",
  description: "Description",
};
const RATING_DISPLAY_ORDER = ["safe", "suggestive", "erotica", "pornographic"];

export class ContentSettingsForm extends Form {
  override getSections(): FormSectionElement<unknown>[] {
    const selectedLanguages = getLanguages();
    const selectedRatings = getRatings();
    const priorityOrder = getLanguagePriority();
    const prioritySubtitle = priorityOrder.map((code) => MDLanguages.getName(code)).join(" → ");
    const romanizedPriorityEnabled = getRomanizedPriorityEnabled();
    const nativeTitleDisplay = getNativeTitleDisplay();
    const discoverThumb = getDiscoverThumbnail();
    const searchThumb = getSearchThumbnail();
    const mangaThumb = getMangaThumbnail();

    return [
      Section("generalContent", [
        SelectRow("languages", {
          title: "Languages",
          subtitle: selectedLanguages
            .map((code) => MDLanguages.getName(code))
            .sort((a, b) => a.localeCompare(b))
            .join(", "),
          value: selectedLanguages,
          minItemCount: 1,
          maxItemCount: 100,
          options: MDLanguages.getMDCodeList().map((x) => ({
            id: x,
            title: MDLanguages.getName(x),
          })),
          onValueChange: Application.Selector(this as ContentSettingsForm, "handleLanguageChange"),
        }),
        ToggleRow("romanized_priority", {
          title: "Prefer Romanized Titles",
          subtitle: "Use ja/kr/zh romanized titles for tracker matching",
          value: romanizedPriorityEnabled,
          onValueChange: Application.Selector(
            this as ContentSettingsForm,
            "handleRomanizedPriorityChange",
          ),
        }),
        ...(romanizedPriorityEnabled
          ? [
              SelectRow("native_title_display", {
                title: "Romanized Title Shown In",
                subtitle: NATIVE_TITLE_DISPLAY_LABELS[nativeTitleDisplay] ?? "None",
                value: [nativeTitleDisplay],
                minItemCount: 1,
                maxItemCount: 1,
                options: Object.entries(NATIVE_TITLE_DISPLAY_LABELS).map(([id, title]) => ({
                  id,
                  title,
                })),
                onValueChange: Application.Selector(
                  this as ContentSettingsForm,
                  "handleNativeTitleDisplayChange",
                ),
              }),
            ]
          : []),
        ...(priorityOrder.length > 1
          ? [
              NavigationRow("language_priority", {
                title: "Language Priority",
                subtitle: prioritySubtitle,
                form: new LanguagePriorityForm(),
              }),
            ]
          : []),
        SelectRow("ratings", {
          title: "Content Rating",
          subtitle: RATING_DISPLAY_ORDER.filter((id) => selectedRatings.includes(id))
            .map((id) => getRatingName(id))
            .join(", "),
          value: selectedRatings,
          minItemCount: 1,
          maxItemCount: 4,
          options: getRatingEnumList().map((x) => ({
            id: x,
            title: getRatingName(x),
          })),
          onValueChange: Application.Selector(this as ContentSettingsForm, "handleRatingsChange"),
        }),
        ToggleRow("data_saver", {
          title: "Data Saver",
          value: getDataSaver(),
          onValueChange: Application.Selector(this as ContentSettingsForm, "handleDataSaverChange"),
        }),
        ToggleRow("skip_same_chapter", {
          title: "Skip Same Chapter",
          subtitle: "Drop duplicates, keep newest",
          value: getSkipSameChapter(),
          onValueChange: Application.Selector(
            this as ContentSettingsForm,
            "handleSkipSameChapterChange",
          ),
        }),
        ToggleRow("force_port", {
          title: "Force Port 443",
          value: getForcePort443(),
          onValueChange: Application.Selector(this as ContentSettingsForm, "handleForcePortChange"),
        }),
        ToggleRow("crop_images", {
          title: "Crop Images",
          subtitle: "Crops borders but slower loading",
          value: getCropImagesEnabled(),
          onValueChange: Application.Selector(
            this as ContentSettingsForm,
            "handleCropImagesChange",
          ),
        }),
      ]),
      Section(
        {
          id: "thumbnail_settings",
          footer: "Use 512 or 256 for Home/Search to avoid crashes on large covers",
        },
        [
          SelectRow("discover_thumbnail", {
            title: "Home Covers",
            subtitle: getImageQualityName(discoverThumb),
            value: [discoverThumb],
            minItemCount: 1,
            maxItemCount: 1,
            options: getImageQualityEnumList().map((x) => ({
              id: x,
              title: getImageQualityName(x),
            })),
            onValueChange: Application.Selector(
              this as ContentSettingsForm,
              "handleDiscoverThumbChange",
            ),
          }),
          SelectRow("search_thumbnail", {
            title: "Search Covers",
            subtitle: getImageQualityName(searchThumb),
            value: [searchThumb],
            minItemCount: 1,
            maxItemCount: 1,
            options: getImageQualityEnumList().map((x) => ({
              id: x,
              title: getImageQualityName(x),
            })),
            onValueChange: Application.Selector(
              this as ContentSettingsForm,
              "handleSearchThumbChange",
            ),
          }),
          SelectRow("manga_thumbnail", {
            title: "Detail Cover",
            subtitle: getImageQualityName(mangaThumb),
            value: [mangaThumb],
            minItemCount: 1,
            maxItemCount: 1,
            options: getImageQualityEnumList().map((x) => ({
              id: x,
              title: getImageQualityName(x),
            })),
            onValueChange: Application.Selector(
              this as ContentSettingsForm,
              "handleMangaThumbChange",
            ),
          }),
        ],
      ),
    ];
  }

  async handleLanguageChange(value: string[]): Promise<void> {
    const currentPriority = getLanguagePriority();
    const selectedSet = new Set(value);
    const currentSet = new Set(currentPriority);
    // Keep existing priority for languages still selected, then append newly selected ones.
    const reconciled = [
      ...currentPriority.filter((code) => selectedSet.has(code)),
      ...value.filter((code) => !currentSet.has(code)),
    ];
    setLanguagePriority(reconciled);
    setLanguages(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleRomanizedPriorityChange(value: boolean): Promise<void> {
    setRomanizedPriorityEnabled(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleNativeTitleDisplayChange(value: string[]): Promise<void> {
    setNativeTitleDisplay(value[0] ?? "none");
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleRatingsChange(value: string[]): Promise<void> {
    setRatings(value);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleDataSaverChange(value: boolean): Promise<void> {
    setDataSaver(value);
  }

  async handleSkipSameChapterChange(value: boolean): Promise<void> {
    setSkipSameChapter(value);
  }

  async handleForcePortChange(value: boolean): Promise<void> {
    setForcePort443(value);
  }

  async handleCropImagesChange(value: boolean): Promise<void> {
    setCropImagesEnabled(value);
  }

  async handleDiscoverThumbChange(value: string[]): Promise<void> {
    setDiscoverThumbnail(value[0]);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  async handleSearchThumbChange(value: string[]): Promise<void> {
    setSearchThumbnail(value[0]);
    this.reloadForm();
  }

  async handleMangaThumbChange(value: string[]): Promise<void> {
    setMangaThumbnail(value[0]);
    this.reloadForm();
  }
}
