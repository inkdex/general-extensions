import type { DiscoverSectionItem } from "@paperback/types";
import type { QIScansV2Response } from "../shared/models";

export function parseDiscoverItems(
    json: QIScansV2Response,
    sectionType: string,
): DiscoverSectionItem[] {
    const posts = json.data ?? [];

    if (posts.length === 0) {
        return [];
    }

    return posts
        .filter((post) => {
            if (!post.postTitle || post.postTitle.trim().length === 0) {
                return false;
            }
            if (
                post.postTitle.startsWith("http://") ||
                post.postTitle.startsWith("https://")
            ) {
                return false;
            }
            return true;
        })
        .map((post) => {
            const mangaId = post.id.toString();

            let imageUrl = post.featuredImage || "";
            if (imageUrl.includes("/file/qiscans/")) {
                imageUrl = imageUrl.replace("/file/qiscans/", "/");
            }

            // for chapterUpdates sections
            if (sectionType === "latest") {
                const latestChapter = post.chapters?.[0];

                return {
                    type: "chapterUpdatesCarouselItem" as const,
                    mangaId: mangaId,
                    chapterId: latestChapter?.slug || "",
                    title: Application.decodeHTMLEntities(post.postTitle),
                    imageUrl: imageUrl,
                    subtitle: latestChapter
                        ? `Ch. ${latestChapter.number}`
                        : `${post._count?.chapters ?? 0} Chapters`,
                };
            }

            // all other sections
            return {
                type: "simpleCarouselItem" as const,
                mangaId: mangaId,
                title: Application.decodeHTMLEntities(post.postTitle),
                imageUrl: imageUrl,
                subtitle: `${post._count?.chapters ?? 0} Chapters`,
            };
        });
}
