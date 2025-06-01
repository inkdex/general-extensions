import * as cheerio from "cheerio";

export type Metadata = {
    page?: number;
};
type QueryValue = string | number | boolean | undefined | null;
type QueryParam = QueryValue | QueryValue[] | Record<string, QueryValue>;
type OptionItem = {
    value: string;
    id: string;
};

/**
 * Populate Search Filter
 * @param baseUrl
 */
export async function populateFilter(baseUrl: string) {
    const lastFilterFetch = Number(
        Application.getState("last-filter-fetch-date") ?? 0,
    );
    if (lastFilterFetch + 604800 > new Date().valueOf() / 1000) {
        console.log("Use Cached Filters");
        setGenreFilter(
            JSON.parse(
                Application.getState(".genres") as string,
            ) as OptionItem[],
        );
        setMangaTypeFilter(
            JSON.parse(Application.getState(".type") as string) as OptionItem[],
        );
        setStatusFilter(
            JSON.parse(
                Application.getState(".status") as string,
            ) as OptionItem[],
        );
        setOrderFilter(
            JSON.parse(Application.getState(".sort") as string) as OptionItem[],
        );
        setYearFilter(
            JSON.parse(Application.getState(".year") as string) as OptionItem[],
        );
    } else {
        console.log("Scraping Filters");
        const data = (
            await Application.scheduleRequest({
                url: `${baseUrl}/archive`,
                method: "GET",
            })
        )[1];
        const $ = cheerio.load(Application.arrayBufferToUTF8String(data));
        setGenreFilter(extractOptions($, ".genres"));
        setMangaTypeFilter(extractOptions($, ".type"));
        setStatusFilter(extractOptions($, ".status"));
        setOrderFilter(extractOptions($, ".sort"));
        setYearFilter(extractOptions($, ".year"));
        Application.setState(
            String(new Date().valueOf() / 1000),
            "last-filter-fetch-date",
        );
    }
}

/**
 * Check Excluded tags
 * @param tags
 * @param exc
 * @return {boolean} - true: hide
 */
export const excludedTags = (tags: string[], exc: string[]): boolean => {
    return tags.some((tag) => {
        const found = exc.includes(tag);
        if (found) {
            console.log("Detected :" + tag + " manga rimosso dalla lista");
        }
        return found;
    });
};

/**
 * Check Excluded tags
 * @return {boolean} - true: hide
 * @param type
 * @param excluded
 */
export const excludedTypes = (type: string, excluded: string[]): boolean => {
    if (excluded.includes(type.toLowerCase())) {
        console.log("Detected :" + type + " manga rimosso dalla lista");
        return true;
    }
    return false;
};

/**
 * Extract filter option {value, id}.
 * @param $ - Requests.
 * @param filterSelector - CSS selector.
 * @returns{[{value, id}]}.
 */
function extractOptions(
    $: cheerio.CheerioAPI,
    filterSelector: string,
): OptionItem[] {
    const options = $(`${filterSelector} select.filter-select option`);
    const result: OptionItem[] = [];

    options.each((_, el) => {
        const id = $(el).attr("data-name");
        const label = $(el).text().trim();

        if (id) {
            result.push({ value: label, id });
        }
    });
    Application.setState(JSON.stringify(result), filterSelector);
    return result;
}

let YearFilter: OptionItem[] = [];
let GenreFilter: OptionItem[] = [];
let MangaTypeFilter: OptionItem[] = [];
let OrderFilter: OptionItem[] = [];
let StatusFilter: OptionItem[] = [];

/**
 * Check Blacklisted tags
 * @param tags : string[] - tags
 * @return {boolean} - true: hide
 */
export const blacklistedTags = (tags: string[]): boolean => {
    const blacklistedSettings =
        (Application.getState("hide_tags") as string[] | undefined) ?? [];
    return tags.some((tag) => {
        const isBlacklisted = blacklistedSettings.includes(tag);
        if (isBlacklisted) {
            console.log(`Detected: ${tag} manga rimosso dalla lista`);
        }
        return isBlacklisted;
    });
};

/**
 * Check Blacklisted types
 * @param {string}  type - type
 * @return {boolean} - true: hide
 */
export const blacklistedType = (type: string): boolean => {
    const blacklistedSettings =
        (Application.getState("hide_type") as string[] | undefined) ?? [];
    if (blacklistedSettings.includes(type.toLowerCase())) {
        console.log("Detected :" + type + " manga rimosso dalla lista");
        return true;
    }
    return false;
};

/**
 * Set Manga Type Filter
 */
function setMangaTypeFilter(newValue: OptionItem[]) {
    MangaTypeFilter = newValue;
}
/**
 * Get Manga Type
 * @return [{ value: string, id: string }]
 */
export function getMangaTypeFilter() {
    return MangaTypeFilter;
}
/**
 * Set Ordering Filter
 */
function setOrderFilter(newValue: OptionItem[]) {
    OrderFilter = newValue;
}
/**
 * Get Ordering Type
 * @return [{value: string, id: string}]
 */
export function getOrderFilter() {
    return OrderFilter;
}
/**
 * Set Status Filter
 */
function setStatusFilter(newValue: OptionItem[]) {
    StatusFilter = newValue;
}
/**
 * Get Status
 * @return [{value: string, id: string}]
 */
export function getStatusFilter() {
    return StatusFilter;
}
/**
 * Set Genres
 */
function setGenreFilter(newValue: OptionItem[]) {
    GenreFilter = newValue;
}
/**
 * Get Genres
 * @return [{ value: string, id: string }]
 */
export function getGenreFilter() {
    return GenreFilter;
}

/**
 * Set Years
 */
function setYearFilter(newValue: OptionItem[]) {
    YearFilter = newValue;
}
/**
 * Get Years
 * @return [{ value: string, id: string }]
 */
export function getYearFilter() {
    return YearFilter;
}

export class URLBuilder {
    private parameters: Record<string, QueryParam> = {};
    private pathComponents: string[] = [];
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/^\/|\/$/g, "");
    }

    addPathComponent(component: string): this {
        this.pathComponents.push(component.replace(/^\/|\/$/g, ""));
        return this;
    }

    addQueryParameter(key: string, value: QueryParam): this {
        this.parameters[key] = value;
        return this;
    }

    buildUrl(
        options: {
            addTrailingSlash?: boolean;
            includeUndefinedParameters?: boolean;
        } = {},
    ): string {
        const { addTrailingSlash = false, includeUndefinedParameters = false } =
            options;

        let url = `${this.baseUrl}/${this.pathComponents.join("/")}`;
        if (addTrailingSlash) url += "/";

        const queryParams = Object.entries(this.parameters).flatMap(
            ([key, value]) => {
                if (value == null && !includeUndefinedParameters) return [];

                if (Array.isArray(value)) {
                    return value
                        .filter((v) => v != null || includeUndefinedParameters)
                        .map(
                            (v) =>
                                `${encodeURIComponent(key)}=${encodeURIComponent(String(v ?? ""))}`,
                        );
                }

                if (typeof value === "object" && value !== null) {
                    return Object.entries(value).flatMap(([subKey, v]) =>
                        v != null || includeUndefinedParameters
                            ? `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(String(v ?? ""))}`
                            : [],
                    );
                }

                return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
            },
        );

        if (queryParams.length > 0) {
            url += `?${queryParams.join("&")}`;
        }

        return url;
    }
}
