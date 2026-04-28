/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import type { JSONObject } from "@paperback/types";

export const DOMAIN = "https://mangapill.com";

export interface SearchMetadata extends JSONObject {
  genres?: string[];
  types?: string[];
  statuses?: string[];
}
