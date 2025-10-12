import {
    ContentRating,
    type SearchQuery,
    type Tag,
    type TagSection,
} from "@paperback/types";
import { TagSectionId, WC_DOMAIN } from "./models";
import { type Query } from "./requests";

export function getFilterTagsBySection(
    section: TagSectionId,
    tags: SearchQuery["filters"],
): string[] {
    const values = tags.find((x) => (x.id as TagSectionId) === section)?.value;
    if (values === undefined) {
        return [];
    }
    return Object.entries(values)
        .filter((x) => x[1] == "included")
        .map((x) => parseTagId(x[0]));
}

export function formatTagId(tagId: string): string {
    return tagId.replaceAll(" ", "_");
}

export function parseTagId(tagId: string): string {
    return tagId.replace("_", " ");
}

export function isInvalidTags(tags: Tag[]): boolean {
    return tags.some((tag) => !/^[a-zA-Z0-9._\-@()[\]]+$/.test(tag.id));
}

export function getTagFromTagStore(
    tagId: TagSectionId,
    tags: TagSection[],
): TagSection {
    const tag = tags.find((x) => (x.id as TagSectionId) === tagId);
    if (tag === undefined) {
        throw new Error(`${tagId} Tag section not found`);
    }
    return tag;
}

export function getShareUrl(mangaId: string): string {
    return `${WC_DOMAIN}/series/${mangaId}`;
}

export function getRating(rating: string): ContentRating {
    return rating === "Yes" ? ContentRating.ADULT : ContentRating.EVERYONE;
}

export function newQuery(key: string, value: string | string[]): Query {
    return {
        key,
        value,
    };
}
