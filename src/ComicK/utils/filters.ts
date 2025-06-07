const SORT_FILTER = [
    { id: "follow", value: "Most follows" },
    { id: "view", value: "Most views" },
    { id: "rating", value: "High rating" },
    { id: "uploaded", value: "Last updated" },
];

const DEMOGRAPHIC_FILTER = [
    { id: "1", value: "Shonen" },
    { id: "2", value: "Shoujo" },
    { id: "3", value: "Seinen" },
    { id: "4", value: "Josei" },
];

const SEARCH_BY_FILTER = [
    { id: "user", value: "User" },
    { id: "author", value: "Author" },
    { id: "group", value: "Group" },
    { id: "comic", value: "Comic" },
];

const CREATED_AT_FILTER = [
    { id: "30", value: "30 days" },
    { id: "90", value: "3 months" },
    { id: "180", value: "6 months" },
    { id: "365", value: "1 year" },
];

const COMIC_TYPE_FILTER = [
    { id: "kr", value: "Manhwa" },
    { id: "jp", value: "Manga" },
    { id: "cn", value: "Manhua" },
];

export {
    SORT_FILTER,
    DEMOGRAPHIC_FILTER,
    SEARCH_BY_FILTER,
    CREATED_AT_FILTER,
    COMIC_TYPE_FILTER,
};
