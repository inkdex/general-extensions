export type Metadata = {
    page?: number;
};
type QueryValue = string | number | boolean | undefined | null;
type QueryParam = QueryValue | QueryValue[] | Record<string, QueryValue>;

/**
 * Check Blacklisted tags
 * @param tags : string[] - tags
 * @type {tags:string[]} => boolean
 * @return {boolean} - true: hide
 */
export function blacklistedTags(tags: string[]): boolean {
    const blacklistedSettings =
        (Application.getState("hide_tags") as string[] | undefined) ?? [];
    console.log("Blacklisted Tags Loaded: " + blacklistedSettings.join(","));

    for (const tag of tags) {
        if (blacklistedSettings.includes(tag.toLowerCase())) {
            console.log("Detected :" + tag + " manga rimosso dalla lista");
            return true;
        }
    }
    return false;
}

/**
 * Check Blacklisted types
 * @param {string}  type - type
 * @return {boolean} - true: hide
 */
export function blacklistedType(type: string): boolean {
    const blacklistedSettings =
        (Application.getState("hide_type") as string[] | undefined) ?? [];
    console.log("Blacklisted Type Loaded: " + blacklistedSettings.join(","));
    if (blacklistedSettings.includes(type.toLowerCase())) {
        console.log("Detected :" + type + " manga rimosso dalla lista");
        return true;
    }
    return false;
}
/**
 * Mature tags
 * @return [{ value: string, id: string }]
 */
export function getMatureFilter() {
    return [
        { value: "Ecchi", id: "ecchi" },
        { value: "Gender Bender", id: "gender-bender" },
        { value: "Harem", id: "harem" },
        { value: "Horror", id: "horror" },
        { value: "Josei", id: "josei" },
        { value: "Maturo", id: "maturo" },
        { value: "Seinen", id: "seinen" },
        { value: "Tragico", id: "tragico" },
        { value: "Yaoi", id: "yaoi" },
        { value: "Yuri", id: "yuri" },
    ];
}
/**
 * Adult Tags
 * @return [{ value: string, id: string }]
 */
export function getAdultFilter() {
    return [
        { value: "Adulti", id: "adulti" },
        { value: "Doujinshi", id: "doujinshi" },
        { value: "Hentai", id: "hentai" },
        { value: "Lolicon", id: "lolicon" },
        { value: "Shotacon", id: "shotacon" },
        { value: "Smut", id: "smut" },
    ];
}
/**
 * Get Manga Type
 * @return [{ value: string, id: string }]
 */
export function getMangaTypeFilter() {
    return [
        { value: "Manga", id: "manga" },
        { value: "Manhua", id: "manhua" },
        { value: "Manhwa", id: "manhwa" },
        { value: "Oneshot", id: "oneshot" },
        { value: "Thai", id: "thai" },
        { value: "Vietnamita", id: "vietnamese" },
    ];
}
/**
 * Get Ordering Type
 * @return [{value: string, id: string}]
 */
export function getOrderFilter() {
    return [
        { label: "Più Letto", id: "most_read" },
        { label: "Meno Letto", id: "less_read" },
        { label: "Alfabetico A-Z", id: "a-z" },
        { label: "Alfabetico Z-A", id: "z-a" },
        { label: "Più recente", id: "newest" },
        { label: "Meno recente", id: "oldest" },
    ];
}
/**
 * Get Genre
 * @return [{ value: string, id: string }]
 */
export function getGenreFilter() {
    return [
        { value: "Adulti", id: "adulti" },
        { value: "Arti Marziali", id: "arti-marziali" },
        { value: "Avventura", id: "avventura" },
        { value: "Azione", id: "azione" },
        { value: "Commedia", id: "commedia" },
        { value: "Doujinshi", id: "doujinshi" },
        { value: "Drammatico", id: "drammatico" },
        { value: "Ecchi", id: "ecchi" },
        { value: "Fantasy", id: "fantasy" },
        { value: "Gender Bender", id: "gender-bender" },
        { value: "Harem", id: "harem" },
        { value: "Hentai", id: "hentai" },
        { value: "Horror", id: "horror" },
        { value: "Josei", id: "josei" },
        { value: "Lolicon", id: "lolicon" },
        { value: "Maturo", id: "maturo" },
        { value: "Mecha", id: "mecha" },
        { value: "Mistero", id: "mistero" },
        { value: "Psicologico", id: "psicologico" },
        { value: "Romantico", id: "romantico" },
        { value: "Sci-fi", id: "sci-fi" },
        { value: "Scolastico", id: "scolastico" },
        { value: "Seinen", id: "seinen" },
        { value: "Shotacon", id: "shotacon" },
        { value: "Shoujo", id: "shoujo" },
        { value: "Shoujo Ai", id: "shoujo-ai" },
        { value: "Shounen", id: "shounen" },
        { value: "Shounen Ai", id: "shounen-ai" },
        { value: "Slice of Life", id: "slice-of-life" },
        { value: "Smut", id: "smut" },
        { value: "Soprannaturale", id: "soprannaturale" },
        { value: "Sport", id: "sport" },
        { value: "Storico", id: "storico" },
        { value: "Tragico", id: "tragico" },
        { value: "Yaoi", id: "yaoi" },
        { value: "Yuri", id: "yuri" },
    ];
}

export class URLBuilder {
    parameters: Record<string, QueryParam> = {};
    pathComponents: string[] = [];
    baseUrl: string;
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/(^\/)?(?=.*)(\/$)?/gim, "");
    }

    addPathComponent(component: string): URLBuilder {
        this.pathComponents.push(
            component.replace(/(^\/)?(?=.*)(\/$)?/gim, ""),
        );
        return this;
    }

    addQueryParameter(key: string, value: QueryParam): URLBuilder {
        this.parameters[key] = value;
        return this;
    }

    buildUrl(
        { addTrailingSlash, includeUndefinedParameters } = {
            addTrailingSlash: false,
            includeUndefinedParameters: false,
        },
    ): string {
        let finalUrl = this.baseUrl + "/";

        finalUrl += this.pathComponents.join("/");
        if (addTrailingSlash) finalUrl += "/";

        const entries = Object.entries(this.parameters);

        if (entries.length > 0) {
            const queryString = entries
                .flatMap(([key, value]) => {
                    if (value == null && !includeUndefinedParameters) return [];

                    if (Array.isArray(value)) {
                        return value
                            .filter(
                                (v) => v != null || includeUndefinedParameters,
                            )
                            .map(
                                (v) =>
                                    `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`,
                            );
                    }

                    if (typeof value === "object" && value !== null) {
                        return Object.entries(value)
                            .filter(
                                ([, v]) =>
                                    v != null || includeUndefinedParameters,
                            )
                            .map(
                                ([subKey, v]) =>
                                    `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(String(v))}`,
                            );
                    }
                    return [
                        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
                    ];
                })
                .join("&");

            if (queryString) {
                finalUrl += "?" + queryString;
            }
        }

        return finalUrl;
    }
}
