/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { Form } from "@paperback/types";
import { MangaDexSettingsForm } from "../MangaDexSettings";

/**
 * Provides access to extension settings forms
 */
export class SettingsProvider {
  /**
   * Returns the main settings form for the extension
   */
  async getSettingsForm(): Promise<Form> {
    return new MangaDexSettingsForm();
  }
}
