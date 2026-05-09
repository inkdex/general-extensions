/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

class MFLanguagesClass {
  Languages = [
    { name: "English", MDCode: "en", flagCode: "🇬🇧", default: true },
    { name: "Español", MDCode: "es", flagCode: "🇪🇸" },
    { name: "Español (Latinoamérica)", MDCode: "es-la", flagCode: "🇲🇽" },
    { name: "Français", MDCode: "fr", flagCode: "🇫🇷" },
    { name: "Português", MDCode: "pt", flagCode: "🇵🇹" },
    { name: "Português (Brasil)", MDCode: "pt-br", flagCode: "🇧🇷" },
    { name: "日本語", MDCode: "ja", flagCode: "🇯🇵" },
  ];

  constructor() {
    // Sort languages by name
    this.Languages = this.Languages.sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  getCodeList(): string[] {
    return this.Languages.map((language) => language.MDCode);
  }

  getName(code: string): string {
    return this.Languages.find((language) => language.MDCode === code)?.name ?? "Unknown";
  }

  getFlagCode(code: string): string {
    return this.Languages.find((language) => language.MDCode === code)?.flagCode ?? "🏳️";
  }

  getDefault(): string[] {
    return this.Languages.filter((language) => language.default).map((language) => language.MDCode);
  }
}

export const MFLanguages = new MFLanguagesClass();
