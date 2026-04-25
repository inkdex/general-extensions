/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form, type SettingsFormProviding } from "@paperback/types";

import { QToonSettingsForm } from "./forms";

export function getLanguage(): string {
  return (Application.getState("qtoon-language") as string | undefined) ?? "en-US";
}

export function setLanguage(value: string): void {
  Application.setState(value, "qtoon-language");
}

export class SettingsFormProvider implements SettingsFormProviding {
  async getSettingsForm(): Promise<Form> {
    return new QToonSettingsForm();
  }
}
