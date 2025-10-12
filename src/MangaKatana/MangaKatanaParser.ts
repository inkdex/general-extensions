import {
    type SearchResultItem,
    type Tag,
    type TagSection,
} from "@paperback/types";
import { type CheerioAPI } from "cheerio";

export const parseTags = ($: CheerioAPI): TagSection[] => {
    const arrayTags: Tag[] = [];

    for (const tag of $(".wrap_item").toArray()) {
        const label = $("a", tag).first().text().trim();
        const id = $("a", tag).attr("href")?.split("genre/")[1] ?? "";

        if (!id || !label) continue;
        arrayTags.push({ id: id, title: label });
    }
    const tagSections: TagSection[] = [
        {
            id: "0",
            title: "genres",
            tags: arrayTags.map((genre) => ({
                id: genre.id.toLowerCase().replace(/\s+/g, "_"),
                title: genre.title,
            })),
        },
    ];
    return tagSections;
};

export const parseSearch = ($: CheerioAPI): SearchResultItem[] => {
    const mangas: SearchResultItem[] = [];
    const collectedIds: string[] = [];

    if ($('meta[property="og:url"]').attr("content")?.includes("/manga/")) {
        const title = $("h1.heading").first().text().trim() ?? "";
        let id =
            $("meta[property$=url]").attr("content")?.split("/")?.pop() ?? "";
        const image = $("div.media div.cover img").attr("src") ?? "";

        id = decodeURIComponent(id)
            .replace(/[^\w@.]/g, "_")
            .trim();

        if (!id || !title || collectedIds.includes(id)) return [];
        mangas.push({
            imageUrl: image,
            title: title,
            mangaId: id,
            subtitle: undefined,
        });
        collectedIds.push(id);
    } else {
        for (const manga of $("div.item", "#book_list").toArray()) {
            const title: string = $(".title a", manga).text().trim();
            let id = $("a", manga).attr("href")?.split("/").pop() ?? "";
            const image = $("img", manga).attr("src") ?? "";
            const subtitle: string = $(".chapter", manga).first().text().trim();

            id = decodeURIComponent(id)
                .replace(/[^\w@.]/g, "_")
                .trim();

            if (!id || !title || collectedIds.includes(id)) continue;
            mangas.push({
                imageUrl: image,
                title: title,
                mangaId: id,
                subtitle: subtitle,
            });
            collectedIds.push(id);
        }
    }
    return mangas;
};

export const isLastPage = ($: CheerioAPI): boolean => {
    let isLast = true;
    const hasNext = Boolean(
        $("a.next.page-numbers", "ul.uk-pagination").text(),
    );

    if (hasNext) isLast = false;
    return isLast;
};
