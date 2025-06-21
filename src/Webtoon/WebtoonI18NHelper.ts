export enum Language {
    ENGLISH = "en",
    FRENCH = "fr",
    GERMAN = "de",
    SPANISH = "es",
    THAI = "th",
    INDONESIAN = "id",
    CHINESE = "zh-hant",
}

export const LanguagesOptions = [
    { id: Language.ENGLISH, title: "English" },
    { id: Language.FRENCH, title: "Français" },
    { id: Language.GERMAN, title: "Deutsch" },
    { id: Language.SPANISH, title: "Español" },
    { id: Language.THAI, title: "ภาษาไทย" },
    { id: Language.INDONESIAN, title: "Indonesia" },
    { id: Language.CHINESE, title: "中文 (繁體)" },
];

export const getLanguagesTitle = (language: Language) => {
    return LanguagesOptions.find((option) => option.id === language)?.title;
};

export const getDateDayFormat = () => {
    return new Intl.DateTimeFormat("en-US", { weekday: "long" })
        .format()
        .toLowerCase();
};

export const haveTrending = (language: Language) => {
    switch (language) {
        case Language.GERMAN:
        case Language.SPANISH:
            return false;
        default:
            return true;
    }
};
