/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

interface Language {
  name: string;
  MDCode: string;
  flagCode: string;
  default?: boolean;
}

class MDLanguagesClass {
  Languages: Language[] = [
    {
      // Arabic
      name: "اَلْعَرَبِيَّةُ",
      MDCode: "ar",
      flagCode: "🇦🇪",
    },
    {
      // Bulgarian
      name: "български",
      MDCode: "bg",
      flagCode: "🇧🇬",
    },
    {
      // Bengali
      name: "বাংলা",
      MDCode: "bn",
      flagCode: "🇧🇩",
    },
    {
      // Catalan
      name: "Català",
      MDCode: "ca",
      flagCode: "🇪🇸",
    },
    {
      // Czech
      name: "Čeština",
      MDCode: "cs",
      flagCode: "🇨🇿",
    },
    {
      // Danish
      name: "Dansk",
      MDCode: "da",
      flagCode: "🇩🇰",
    },
    {
      // German
      name: "Deutsch",
      MDCode: "de",
      flagCode: "🇩🇪",
    },
    {
      // English
      name: "English",
      MDCode: "en",
      flagCode: "🇬🇧",
      default: true,
    },
    {
      // Spanish
      name: "Español",
      MDCode: "es",
      flagCode: "🇪🇸",
    },
    {
      // Spanish (Latin American)
      name: "Español (Latinoamérica)",
      MDCode: "es-la",
      flagCode: "🇪🇸",
    },
    {
      // Farsi
      name: "فارسی",
      MDCode: "fa",
      flagCode: "🇮🇷",
    },
    {
      // Finnish
      name: "Suomi",
      MDCode: "fi",
      flagCode: "🇫🇮",
    },
    {
      // French
      name: "Français",
      MDCode: "fr",
      flagCode: "🇫🇷",
    },
    {
      // Hebrew
      name: "עִבְרִית",
      MDCode: "he",
      flagCode: "🇮🇱",
    },
    {
      // Hindi
      name: "हिन्दी",
      MDCode: "hi",
      flagCode: "🇮🇳",
    },
    {
      // Hungarian
      name: "Magyar",
      MDCode: "hu",
      flagCode: "🇭🇺",
    },
    {
      // Indonesian
      name: "Indonesia",
      MDCode: "id",
      flagCode: "🇮🇩",
    },
    {
      // Italian
      name: "Italiano",
      MDCode: "it",
      flagCode: "🇮🇹",
    },
    {
      // Japanese
      name: "日本語",
      MDCode: "ja",
      flagCode: "🇯🇵",
    },
    {
      // Korean
      name: "한국어",
      MDCode: "ko",
      flagCode: "🇰🇷",
    },
    {
      // Lithuanian
      name: "Lietuvių",
      MDCode: "lt",
      flagCode: "🇱🇹",
    },
    {
      // Mongolian
      name: "монгол",
      MDCode: "mn",
      flagCode: "🇲🇳",
    },
    {
      // Malay
      name: "Melayu",
      MDCode: "ms",
      flagCode: "🇲🇾",
    },
    {
      // Burmese
      name: "မြန်မာဘာသာ",
      MDCode: "my",
      flagCode: "🇲🇲",
    },
    {
      // Dutch
      name: "Nederlands",
      MDCode: "nl",
      flagCode: "🇳🇱",
    },
    {
      // Norwegian
      name: "Norsk",
      MDCode: "no",
      flagCode: "🇳🇴",
    },
    {
      // Polish
      name: "Polski",
      MDCode: "pl",
      flagCode: "🇵🇱",
    },
    {
      // Portuguese
      name: "Português",
      MDCode: "pt",
      flagCode: "🇵🇹",
    },
    {
      // Portuguese (Brazilian)
      name: "Português (Brasil)",
      MDCode: "pt-br",
      flagCode: "🇧🇷",
    },
    {
      // Romanian
      name: "Română",
      MDCode: "ro",
      flagCode: "🇷🇴",
    },
    {
      // Russian
      name: "Русский",
      MDCode: "ru",
      flagCode: "🇷🇺",
    },
    {
      // Serbian
      name: "Српски",
      MDCode: "sr",
      flagCode: "🇷🇸",
    },
    {
      // Swedish
      name: "Svenska",
      MDCode: "sv",
      flagCode: "🇸🇪",
    },
    {
      // Thai
      name: "ไทย",
      MDCode: "th",
      flagCode: "🇹🇭",
    },
    {
      // Tagalog
      name: "Filipino",
      MDCode: "tl",
      flagCode: "🇵🇭",
    },
    {
      // Turkish
      name: "Türkçe",
      MDCode: "tr",
      flagCode: "🇹🇷",
    },
    {
      // Ukrainian
      name: "Українська",
      MDCode: "uk",
      flagCode: "🇺🇦",
    },
    {
      // Vietnamese
      name: "Tiếng Việt",
      MDCode: "vi",
      flagCode: "🇻🇳",
    },
    {
      // Chinese (Simplified)
      name: "中文 (简化字)",
      MDCode: "zh",
      flagCode: "🇨🇳",
    },
    {
      // Chinese (Traditional)
      name: "中文 (繁體字)",
      MDCode: "zh-hk",
      flagCode: "🇭🇰",
    },
  ];

  // Indexed by MDCode for O(1) lookup from getName and getFlagCode, both
  // of which are called for every chapter inside 500 chapter feed loops.
  private byCode: Map<string, Language>;

  constructor() {
    this.Languages.sort((a, b) => a.name.localeCompare(b.name));
    this.byCode = new Map(this.Languages.map((l) => [l.MDCode, l]));
  }

  getMDCodeList(): string[] {
    return this.Languages.map((Language) => Language.MDCode);
  }

  getName(MDCode: string): string {
    return this.byCode.get(MDCode)?.name ?? "Unknown";
  }

  getFlagCode(MDCode: string): string {
    return this.byCode.get(MDCode)?.flagCode ?? "_unknown";
  }

  getDefault(): string[] {
    return this.Languages.filter((Language) => Language.default).map((Language) => Language.MDCode);
  }
}

export const MDLanguages = new MDLanguagesClass();
