import moment from "moment";
import "moment/locale/fr";
import "moment/locale/de";
import "moment/locale/es";
import "moment/locale/th";
import "moment/locale/zh-tw";
import "moment/locale/id";

moment.updateLocale("id", {
    monthsShort: "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Agu_Sep_Okt_Nov_Des".split("_"),
});

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

export const formatDate = (date: string, language: Language) => {
    switch (language) {
        case Language.ENGLISH:
            return new Date(
                moment(date, "MMMM D, YYYY", Language.ENGLISH).toDate(),
            );
        case Language.FRENCH:
            return new Date(
                moment(date, "D MMM YYYY", Language.FRENCH).toDate(),
            );
        case Language.GERMAN:
            return new Date(
                moment(date, "DD.MM.YYYY", Language.GERMAN).toDate(),
            );
        case Language.SPANISH:
            return new Date(
                moment(date, "D MMM YYYY", Language.SPANISH).toDate(),
            );
        case Language.THAI:
            return new Date(moment(date, "D MMM YYYY", Language.THAI).toDate());
        case Language.INDONESIAN:
            return new Date(
                moment(date, "D MMM YYYY", Language.INDONESIAN).toDate(),
            );
        case Language.CHINESE:
            return new Date(moment(date, "l", "zh-tw").toDate());
        default:
            return new Date(date);
    }
};

export const getDateDayFormat = () => {
    return moment().locale("en").format("dddd").toLowerCase();
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
