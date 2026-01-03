import type { SearchResultItem } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { QIScansQueryResponse } from "../shared/models";

export function parseSearchResults(
    json: QIScansQueryResponse,
): SearchResultItem[] {
    return (json.posts ?? [])
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

            return {
                mangaId: mangaId,
                title: Application.decodeHTMLEntities(post.postTitle),
                imageUrl: imageUrl,
                subtitle: `${post._count?.chapters ?? 0} Chapters`,
                contentRating: ContentRating.EVERYONE,
            };
        });
}
