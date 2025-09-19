import { DiscoverSectionItem, SearchResultItem } from "@paperback/types";
import { CheerioAPI } from "cheerio";

export function parseSearch(
    $: CheerioAPI,
    collectedIds: string[],
    baseUrl: string,
): SearchResultItem[] {
    const searchResults: SearchResultItem[] = [];

    $(".grid.gap-x-16.gap-y-48 a[data-discover='true']").each((_, element) => {
        const unit = $(element);
        const title = unit.find("p.title").text().trim();
        const imageSrc = unit.find("img").attr("src") || "";
        const image = imageSrc.startsWith("http")
            ? imageSrc
            : `${baseUrl}${imageSrc.slice(1)}`;
        const mangaId = unit.attr("href")?.replace("/manga/", "") || "";

        if (!title || !mangaId || collectedIds.includes(mangaId)) {
            return;
        }

        collectedIds.push(mangaId);

        searchResults.push({
            mangaId: mangaId,
            imageUrl: image,
            title: title,
            subtitle: undefined,
            metadata: undefined,
        });
    });

    return searchResults;
}

export function parsePopular(
    $: CheerioAPI,
    collectedIds: string[],
    baseUrl: string,
): DiscoverSectionItem[] {
    const popularResults: DiscoverSectionItem[] = [];

    $(".popular-update-item a").each((_, element) => {
        const unit = $(element);
        const title = unit.find(".title").text().trim();
        const imageSrc = unit.find("img").attr("src") || "";
        const image = imageSrc.startsWith("http")
            ? imageSrc
            : `${baseUrl}${imageSrc.slice(1)}`;
        const mangaId = unit.attr("href")?.replace("/manga/", "") || "";

        if (!title || !mangaId || collectedIds.includes(mangaId)) {
            return;
        }

        collectedIds.push(mangaId);

        popularResults.push({
            type: "featuredCarouselItem",
            mangaId: mangaId,
            imageUrl: image,
            title: title,
            supertitle: undefined,
            metadata: undefined,
        });
    });

    return popularResults;
}

export function parseNewReleases(
    $: CheerioAPI,
    collectedIds: string[],
    baseUrl: string,
): DiscoverSectionItem[] {
    const newReleaseResults: DiscoverSectionItem[] = [];

    $(".swiper-slide a[data-discover='true']").each((_, element) => {
        const unit = $(element);
        const href = unit.attr("href") || "";
        const mangaId = href.replace("/manga/", "");
        const title = unit.find("p").text().trim();
        const slide = unit.closest(".swiper-slide");
        const style = slide.attr("style") || "";
        const backgroundMatch = style.match(
            /background-image:\s*url\(["']?([^"']+)["']?\)/,
        );
        let image = "";
        if (backgroundMatch) {
            const imageSrc = backgroundMatch[1];
            image = imageSrc.startsWith("http")
                ? imageSrc
                : `${baseUrl}${imageSrc.slice(1)}`;
        }

        if (!title || !mangaId || collectedIds.includes(mangaId)) {
            return;
        }

        collectedIds.push(mangaId);

        newReleaseResults.push({
            type: "featuredCarouselItem",
            mangaId: mangaId,
            imageUrl: image,
            title: title,
            supertitle: undefined,
            metadata: undefined,
        });
    });

    return newReleaseResults;
}
