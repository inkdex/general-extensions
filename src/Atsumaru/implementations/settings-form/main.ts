/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { SettingsFormProviding } from "@paperback/types";
import { Form } from "@paperback/types";

import { AtsumaruSettingsForm } from "./forms";

export function getShowAdult(): boolean {
  return (Application.getState("atsumaru-show-adult") as boolean | undefined) ?? false;
}

export function setShowAdult(value: boolean): void {
  Application.setState(value, "atsumaru-show-adult");
}

export class SettingsFormProvider implements SettingsFormProviding {
  async getSettingsForm(): Promise<Form> {
    return new AtsumaruSettingsForm();
  }
}
