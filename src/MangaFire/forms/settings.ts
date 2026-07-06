/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, LabelRow, Section, SelectRow } from "@paperback/types";

import { BROKEN_CDN_PREFIXES_KEY, CDN_PREFIXES, LANGUAGES } from "../models";

export function getLanguages(): string[] {
  return (
    (Application.getState("languages") as string[] | undefined) ?? [
      LANGUAGES[0].id, // Default to only English selected
    ]
  );
}

export function getBrokenCdnPrefixes(): string[] {
  return (Application.getState(BROKEN_CDN_PREFIXES_KEY) as string[] | undefined) ?? [];
}

export class MangaFireSettingsForm extends Form {
  private languages = getLanguages();
  private brokenCdnPrefixes = getBrokenCdnPrefixes();
  private isTestingCdns = false;

  override getSections() {
    return [
      Section(
        {
          id: "languageContent",
          footer: "Filter chapters by language. At least one language must be selected.",
        },
        [
          SelectRow("languages", {
            title: "Languages",
            subtitle: this.languages
              .map((code) => LANGUAGES.find((lang) => lang.id === code)?.title ?? "Unknown")
              .sort()
              .join(", "),
            value: this.languages,
            options: LANGUAGES,
            minItemCount: 1,
            maxItemCount: LANGUAGES.length,
            onValueChange: Application.Selector(this as MangaFireSettingsForm, "updateLanguages"),
          }),
        ],
      ),
      Section(
        {
          id: "cdn",
          footer:
            "If chapter images fail to load, test the CDNs. Broken CDNs will be swapped to a working one when fetching images.",
        },
        [
          LabelRow("cdnStatus", {
            title: "Status",
            value: this.isTestingCdns
              ? "Loading..."
              : this.brokenCdnPrefixes.length === 0
                ? "All known CDNs healthy"
                : `Broken: ${this.brokenCdnPrefixes.join(", ")}`,
          }),
          ButtonRow("testCdns", {
            title: "Test CDNs",
            onSelect: Application.Selector(this as MangaFireSettingsForm, "testCdns"),
          }),
        ],
      ),
    ];
  }

  async updateLanguages(value: string[]): Promise<void> {
    this.languages = value;
    Application.setState(value, "languages");
  }

  async testCdns(): Promise<void> {
    // Clear first so the interceptor doesn't rewrite a probe of a previously-flagged prefix to a
    // working one — that would prevent a recovered CDN from ever being re-evaluated.
    Application.setState([], BROKEN_CDN_PREFIXES_KEY);
    this.isTestingCdns = true;
    this.reloadForm();
    const broken: string[] = [];

    await Promise.all(
      CDN_PREFIXES.map(async (prefix) => {
        const [response] = await Application.scheduleRequest({
          url: `https://${prefix}.mfcdn3.xyz`,
          method: "GET",
        });
        if (response.status >= 500) broken.push(prefix);
      }),
    );

    Application.setState(broken, BROKEN_CDN_PREFIXES_KEY);
    this.brokenCdnPrefixes = broken;
    this.isTestingCdns = false;
    this.reloadForm();
  }
}
