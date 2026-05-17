/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export type PageMetadata = {
  page?: number;
  completed?: boolean;
};

export type SearchMetadata = {
  genres?: { [id: string]: "included" | "excluded" };
  status?: string;
  type?: string;
  setChapterCount?: boolean;
  minChapters?: number;
  maxChapters?: number;
};

export type BrowseResult = {
  results_html: string;
  page: number;
  num_pages: number;
};

export const DOMAIN = "https://www.mgeko.cc";
