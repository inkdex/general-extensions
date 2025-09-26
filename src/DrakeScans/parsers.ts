// DrakeScans parsers
// Implementation based on drakecomic.org HTML structure

import { DiscoverSectionItem } from "@paperback/types";
import * as cheerio from "cheerio";

export class DrakeScansParser {
    private parseDropdownFilter(
        $: cheerio.CheerioAPI,
        name: string,
        buttonText: string,
    ): { id: string; value: string; label: string }[] {
        const options: { id: string; value: string; label: string }[] = [];

        $(".quickfilter .filter.dropdown").each((_, dropdownEl) => {
            const $dropdown = $(dropdownEl);
            const dropdownButtonText = $dropdown
                .find("button")
                .text()
                .toLowerCase();

            if (dropdownButtonText.includes(buttonText)) {
                $dropdown.find(".dropdown-menu li").each((_, liEl) => {
                    const $li = $(liEl);
                    const $input = $li.find(
                        `input[type="radio"][name="${name}"]`,
                    );
                    const $label = $li.find("label");

                    if ($input.length && $label.length) {
                        const rawValue = $input.attr("value") || "";
                        const labelText = $label.text().trim();

                        if (labelText && rawValue && rawValue.trim() !== "") {
                            const sanitizedId = labelText
                                .toLowerCase()
                                .replace(/[^a-z0-9._\-@()[\]%?#+=/&:]/g, "-");
                            options.push({
                                id: sanitizedId,
                                value: rawValue,
                                label: labelText,
                            });
                        }
                    }
                });
            }
        });

        return options;
    }

    async parsePopularToday(
        $: cheerio.CheerioAPI,
    ): Promise<DiscoverSectionItem[]> {
        const items: DiscoverSectionItem[] = [];

        $(".popconslide .bs .bsx").each((_, element) => {
            const $el = $(element);
            const $link = $el.find("a").first();
            const $img = $el.find(".limit img");
            const $title = $el.find(".bigor .tt");
            const $chapter = $el.find(".adds .epxs");
            const href = $link.attr("href");
            if (!href) return;

            const mangaId = this.extractMangaId(href);
            const title = $title.text().trim();
            // Only use absolute image URL from src
            const imageUrl = $img.attr("src") || "";
            const chapter = $chapter.text().trim();

            if (mangaId && title) {
                items.push({
                    type: "simpleCarouselItem",
                    mangaId,
                    title,
                    imageUrl,
                    subtitle: chapter,
                });
            }
        });

        return items;
    }

    async parseLatestUpdate($: cheerio.CheerioAPI): Promise<{
        items: DiscoverSectionItem[];
        hasNextPage: boolean;
    }> {
        const items: DiscoverSectionItem[] = [];

        $(".bs.styletere.stylefiv .bsx").each((_, element) => {
            const $el = $(element);
            const $link = $el.find("a").first();
            const $img = $el.find(".limit img");
            const $title = $el.find(".bigor .tt a");
            const $latestChapter = $el.find(".chfiv li:first-child .fivchap");
            const $time = $el.find(".chfiv li:first-child .fivtime");

            const href = $link.attr("href");
            if (!href) return;

            const mangaId = this.extractMangaId(href);
            const title = $title.text().trim();
            const imageUrl = $img.attr("src") || "";
            const chapter = $latestChapter.text().trim();
            const time = $time.text().trim();

            if (mangaId && title) {
                items.push({
                    type: "simpleCarouselItem",
                    mangaId,
                    title,
                    imageUrl,
                    subtitle: chapter || time,
                });
            }
        });

        // Fallback: more generic Madara list selectors if primary returned nothing
        if (items.length === 0) {
            $(".listupd .bsx, .list-update .bsx, .listupd .bs .bsx").each(
                (_, element) => {
                    const $el = $(element);
                    const $a = $el.find("a").first();
                    const href = $a.attr("href") || "";
                    if (!href) return;
                    const mangaId = this.extractMangaId(href);
                    const imageUrl = ($el.find("img").attr("src") || "").trim();
                    const title = (
                        $el.find(".tt").text() ||
                        $a.attr("title") ||
                        ""
                    ).trim();
                    const chapter = (
                        $el.find(".epxs").first().text() ||
                        $el.find(".chfiv .fivchap").first().text() ||
                        ""
                    ).trim();
                    if (mangaId && title) {
                        items.push({
                            type: "simpleCarouselItem",
                            mangaId,
                            title,
                            imageUrl,
                            subtitle: chapter || undefined,
                        });
                    }
                },
            );
        }

        // Only check for next page if there are items
        let hasNextPage = false;
        if (items.length > 0) {
            $(".hpage a, .pagination a, .pagination .page-numbers").each(
                (_, el) => {
                    const text = $(el).text().trim();
                    if (
                        text === "Next" ||
                        $(el).hasClass("next") ||
                        $(el).hasClass("r")
                    ) {
                        hasNextPage = true;
                    }
                },
            );
        }

        return { items, hasNextPage };
    }

    // Parse popular series section
    async parsePopularSeries($: cheerio.CheerioAPI): Promise<{
        items: DiscoverSectionItem[];
        hasNextPage: boolean;
    }> {
        const items: DiscoverSectionItem[] = [];

        // Parse the serieslist structure used in Popular Series
        $(".serieslist.pop li").each((_, element) => {
            const $el = $(element);
            const $link = $el.find(".imgseries a.series");
            const $img = $el.find(".imgseries img");
            const $title = $el.find(".leftseries h2 a.series");

            const href = $link.attr("href");
            if (!href) return;

            const mangaId = this.extractMangaId(href);
            const title = $title.text().trim();
            // Only use absolute image URL from src
            const imageUrl = $img.attr("src") || "";

            if (mangaId && title) {
                items.push({
                    type: "simpleCarouselItem",
                    mangaId,
                    title,
                    imageUrl,
                    subtitle: undefined,
                });
            }
        });

        // Check for pagination
        const hasNextPage = $(".pagination .page-numbers.next").length > 0;

        return { items, hasNextPage };
    }

    // Parse specific Popular Series subsections
    async parsePopularSeriesWeekly(
        $: cheerio.CheerioAPI,
    ): Promise<DiscoverSectionItem[]> {
        const items: DiscoverSectionItem[] = [];

        $(".serieslist.pop.wpop-weekly li").each((_, element) => {
            const $el = $(element);
            const $link = $el.find(".imgseries a.series");
            const $img = $el.find(".imgseries img");
            const $title = $el.find(".leftseries h2 a.series");

            const href = $link.attr("href");
            if (!href) return;

            const mangaId = this.extractMangaId(href);
            const title = $title.text().trim();
            const imageUrl = $img.attr("src") || "";

            if (mangaId && title) {
                items.push({
                    type: "simpleCarouselItem",
                    mangaId,
                    title,
                    imageUrl,
                    subtitle: undefined,
                });
            }
        });

        return items;
    }

    async parsePopularSeriesMonthly(
        $: cheerio.CheerioAPI,
    ): Promise<DiscoverSectionItem[]> {
        const items: DiscoverSectionItem[] = [];

        $(".serieslist.pop.wpop-monthly li").each((_, element) => {
            const $el = $(element);
            const $link = $el.find(".imgseries a.series");
            const $img = $el.find(".imgseries img");
            const $title = $el.find(".leftseries h2 a.series");

            const href = $link.attr("href");
            if (!href) return;

            const mangaId = this.extractMangaId(href);
            const title = $title.text().trim();
            const imageUrl = $img.attr("src") || "";

            if (mangaId && title) {
                items.push({
                    type: "simpleCarouselItem",
                    mangaId,
                    title,
                    imageUrl,
                    subtitle: undefined,
                });
            }
        });

        return items;
    }

    async parsePopularSeriesAllTime(
        $: cheerio.CheerioAPI,
    ): Promise<DiscoverSectionItem[]> {
        const items: DiscoverSectionItem[] = [];

        $(".serieslist.pop.wpop-alltime li").each((_, element) => {
            const $el = $(element);
            const $link = $el.find(".imgseries a.series");
            const $img = $el.find(".imgseries img");
            const $title = $el.find(".leftseries h2 a.series");

            const href = $link.attr("href");
            if (!href) return;

            const mangaId = this.extractMangaId(href);
            const title = $title.text().trim();
            const imageUrl = $img.attr("src") || "";

            if (mangaId && title) {
                items.push({
                    type: "simpleCarouselItem",
                    mangaId,
                    title,
                    imageUrl,
                    subtitle: undefined,
                });
            }
        });

        return items;
    }

    // Parse manga details from manga page
    parseMangaDetails($: cheerio.CheerioAPI): {
        title: string;
        cover: string;
        description: string;
        genres: string[];
        author: string;
        status: string;
    } {
        const title = (
            $("h1.entry-title").first().text() ||
            $("h1").first().text() ||
            $(".post-title").first().text()
        ).trim();

        const coverFromThumb =
            $(".main-info .info-left .thumb img").attr("src") || "";
        const ogImage = $('meta[property="og:image"]').attr("content") || "";
        const cover = coverFromThumb || ogImage || "";

        const description = (
            $(".entry-content.entry-content-single").first().text() ||
            $(".seriestucon .seriestucont .seriestucond .entry-content")
                .first()
                .text() ||
            $('meta[name="description"]').attr("content") ||
            ""
        ).trim();

        const genres: string[] = [];
        $(".mgen a").each((_, el) => {
            const t = $(el).text().trim();
            if (t) genres.push(t);
        });

        let status = "";
        let author = "";
        $(".tsinfo .imptdt").each((_, el) => {
            const label = ($(el).clone().children().remove().end().text() || "")
                .trim()
                .toLowerCase();
            const value = $(el).find("i, a").first().text().trim();
            if (!value) return;
            if (label.includes("status")) status = value;
            if (label.includes("author")) author = value;
        });

        return { title, cover, description, genres, author, status };
    }

    // Parse chapter list from manga page
    parseChapterList(
        $: cheerio.CheerioAPI,
        sourceManga: import("@paperback/types").SourceManga,
    ): import("@paperback/types").Chapter[] {
        const chapters: import("@paperback/types").Chapter[] = [];
        const items = $("#chapterlist li");
        const total = items.length;
        items.each((index, li) => {
            const $li = $(li);
            const $a = $li.find("a").first();
            const href = $a.attr("href") || "";
            if (!href) return;
            const chapterPath = href.startsWith("http")
                ? href.replace(/^https?:\/\/[^/]+/, "")
                : href;
            const titleText =
                $li.find(".chapternum").first().text().trim() ||
                $a.text().trim();
            let chapNum = NaN;
            const dataNum = $li.attr("data-num");
            if (dataNum) chapNum = parseFloat(dataNum);
            if (Number.isNaN(chapNum)) {
                const m1 = titleText.match(/(\d+(?:\.\d+)?)/);
                if (m1) chapNum = parseFloat(m1[1]);
            }
            if (Number.isNaN(chapNum)) {
                const m2 = chapterPath.match(/chapter[-_ ]?(\d+(?:\.\d+)?)/i);
                if (m2) chapNum = parseFloat(m2[1]);
            }
            if (Number.isNaN(chapNum)) chapNum = total - index;

            const dateText = $li.find(".chapterdate").first().text().trim();
            const publishDate = dateText ? new Date(dateText) : undefined;

            chapters.push({
                chapterId: chapterPath,
                sourceManga,
                langCode: "en",
                chapNum,
                title: titleText,
                ...(publishDate && !Number.isNaN(publishDate.getTime())
                    ? { publishDate }
                    : {}),
                sortingIndex: total - index,
            });
        });
        return chapters;
    }

    // Parse chapter pages (image URLs) from a chapter HTML using JavaScript execution
    parseChapterPages($: cheerio.CheerioAPI): string[] {
        let pages: string[] = [];

        // Look for ts_reader.run script
        $("script").each((_, el) => {
            if (pages.length > 0) return;
            const content = $(el).html() || "";
            if (!content.includes("ts_reader.run(")) return;

            try {
                // Create a mock ts_reader object to capture the data
                const mockTsReader = {
                    run: (data: {
                        sources?: Array<{
                            source?: string;
                            images?: string[];
                        }>;
                        defaultSource?: string;
                    }) => {
                        // Extract image URLs from chapter reader data
                        if (
                            Array.isArray(data.sources) &&
                            data.sources.length > 0
                        ) {
                            const defaultSource = data.defaultSource;
                            let selectedSource = data.sources.find(
                                (s) => s.source === defaultSource,
                            );

                            // Fallback to first available source with images
                            if (
                                !selectedSource ||
                                !Array.isArray(selectedSource.images) ||
                                selectedSource.images.length === 0
                            ) {
                                selectedSource = data.sources.find(
                                    (s) =>
                                        Array.isArray(s.images) &&
                                        s.images.length > 0,
                                );
                            }

                            if (
                                selectedSource &&
                                Array.isArray(selectedSource.images)
                            ) {
                                pages = selectedSource.images.filter(
                                    (url) =>
                                        typeof url === "string" &&
                                        url.trim().length > 0,
                                );
                            }
                        }
                    },
                };

                // Parse the chapter's embedded JavaScript for image source data
                const runMatch = content.match(/ts_reader\.run\(([\s\S]*?)\);/);
                if (runMatch) {
                    try {
                        // Clean up escaped JSON before parsing
                        let jsonString = runMatch[1];
                        jsonString = jsonString.replace(/\\\//g, "/");
                        jsonString = jsonString.replace(/\\"/g, '"');

                        const jsonData = JSON.parse(jsonString) as {
                            sources?: Array<{
                                source?: string;
                                images?: string[];
                            }>;
                            defaultSource?: string;
                        };

                        // Extract image URLs using our mock parser
                        mockTsReader.run(jsonData);
                    } catch {
                        // Continue silently on error
                    }
                }
            } catch {
                // Continue silently on error
            }
        });

        return pages;
    }

    // Helper method to extract manga ID from URL
    private extractMangaId(url: string): string {
        const match = url.match(/\/manga\/([^/]+)\/?$/);
        return match ? match[1] : "";
    }

    // Parse filter options from the manga page
    parseFilterOptions(
        $: cheerio.CheerioAPI,
    ): import("@paperback/types").SearchFilter[] {
        const filters: import("@paperback/types").SearchFilter[] = [];

        // Parse genres from .quickfilter .genrez structure
        const genreOptions: {
            id: string;
            value: string;
            label: string;
            urlParam?: string;
        }[] = [];

        $(".quickfilter .genrez li").each((_, element) => {
            const $el = $(element);
            const $input = $el.find('input[type="checkbox"][name="genre[]"]');
            const $label = $el.find("label");

            if ($input.length && $label.length) {
                const rawValue = $input.attr("value") || "";
                const labelText = $label.text().trim();

                if (rawValue && labelText) {
                    // Sanitize ID to make it valid for Paperback
                    const sanitizedId = labelText
                        .toLowerCase()
                        .replace(/[^a-z0-9._\-@()[\]%?#+=/&:]/g, "-");

                    // Store URL param separately from display name for proper mapping
                    genreOptions.push({
                        id: sanitizedId,
                        value: labelText, // Display name shown in UI
                        label: labelText,
                        urlParam: rawValue, // Numeric ID used in search URLs
                    });
                }
            }
        });

        if (genreOptions.length > 0) {
            filters.push({
                id: "genre",
                title: "Genres",
                type: "multiselect",
                options: genreOptions,
                value: {},
                allowExclusion: false,
                allowEmptySelection: true,
                maximum: genreOptions.length,
            });
        }

        // Parse status options
        const statusOptions = this.parseDropdownFilter($, "status", "status");

        if (statusOptions.length > 0) {
            filters.push({
                id: "status",
                title: "Status",
                type: "dropdown",
                options: statusOptions,
                value: "",
            });
        }

        // Parse type options
        const typeOptions = this.parseDropdownFilter($, "type", "type");

        if (typeOptions.length > 0) {
            filters.push({
                id: "type",
                title: "Type",
                type: "dropdown",
                options: typeOptions,
                value: "",
            });
        }

        return filters;
    }

    // Parse sorting options from the manga page
    parseSortingOptions(
        $: cheerio.CheerioAPI,
    ): import("@paperback/types").SortingOption[] {
        const sortingOptions: import("@paperback/types").SortingOption[] = [];

        $(".quickfilter .filter.dropdown").each((_, dropdownEl) => {
            const $dropdown = $(dropdownEl);
            const buttonText = $dropdown.find("button").text().toLowerCase();

            if (buttonText.includes("sort by") || buttonText.includes("sort")) {
                $dropdown.find(".dropdown-menu li").each((_, liEl) => {
                    const $li = $(liEl);
                    const $input = $li.find(
                        'input[type="radio"][name="order"]',
                    );
                    const $label = $li.find("label");

                    if ($input.length && $label.length) {
                        const id = $input.attr("value") || "";
                        const label = $label.text().trim();

                        if (label) {
                            sortingOptions.push({ id: id || "", label });
                        }
                    }
                });
            }
        });

        return sortingOptions;
    }

    // Parse search results from the manga page
    parseSearchResults($: cheerio.CheerioAPI): {
        items: import("@paperback/types").SearchResultItem[];
        hasNextPage: boolean;
    } {
        const items: import("@paperback/types").SearchResultItem[] = [];

        $(".listupd .bs .bsx").each((_, element) => {
            const $el = $(element);
            const $link = $el.find("a").first();
            const $img = $el.find(".limit img");
            const $title = $el.find(".bigor .tt");
            const $chapter = $el.find(".adds .epxs");
            const href = $link.attr("href");
            if (!href) return;

            const mangaId = this.extractMangaId(href);
            const title = $title.text().trim();
            const imageUrl = $img.attr("src") || "";
            const _chapter = $chapter.text().trim();

            if (mangaId && title) {
                items.push({
                    mangaId,
                    title,
                    imageUrl,
                });
            }
        });

        // Check for pagination
        const hasNextPage = $(".hpage a.r").length > 0;

        return { items, hasNextPage };
    }
}
