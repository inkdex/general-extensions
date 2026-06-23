/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export const DOMAIN = "https://lnori.com";

export const VOID_TAGS = "area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr";

export interface Series {
  title: string;
  author: string;
  description: string;
  cover: string;
  link: string;
  dot5?: boolean;
}
