/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SettingsFormProviding } from "@paperback/types";
import type { Form } from "@paperback/types";

import type { AtsuContentRating, AtsuMangaType } from "../shared/models";
import { AtsumaruSettingsForm } from "./forms";
import { DEFAULT_CONTENT_RATINGS, DEFAULT_CONTENT_TYPES } from "./models";

const ADULT_MODE_STATE_KEY = "atsumaru-show-adult";
const CONTENT_RATINGS_STATE_KEY = "atsumaru-content-ratings";
const CONTENT_TYPES_STATE_KEY = "atsumaru-content-types";

export function getAdultMode(): boolean {
  return (Application.getState(ADULT_MODE_STATE_KEY) as boolean | undefined) ?? false;
}

export function setAdultMode(value: boolean): void {
  Application.setState(value, ADULT_MODE_STATE_KEY);
}

export function getContentRatings(): AtsuContentRating[] {
  return (
    (Application.getState(CONTENT_RATINGS_STATE_KEY) as AtsuContentRating[] | undefined) ??
    DEFAULT_CONTENT_RATINGS
  );
}

export function setContentRatings(value: AtsuContentRating[]): void {
  Application.setState(value, CONTENT_RATINGS_STATE_KEY);
}

export function getContentTypes(): AtsuMangaType[] {
  return (
    (Application.getState(CONTENT_TYPES_STATE_KEY) as AtsuMangaType[] | undefined) ??
    DEFAULT_CONTENT_TYPES
  );
}

export function setContentTypes(value: AtsuMangaType[]): void {
  Application.setState(value, CONTENT_TYPES_STATE_KEY);
}

export class SettingsFormProvider implements SettingsFormProviding {
  async getSettingsForm(): Promise<Form> {
    return new AtsumaruSettingsForm();
  }
}
