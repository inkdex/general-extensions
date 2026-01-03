import type { SourceManga } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { QIScansPost } from "../shared/models";

export function parseMangaDetails(post: QIScansPost): SourceManga {
    const author = post.author?.trim();
    const artist = post.artist?.trim();

    return {
        mangaId: post.id.toString(),
        mangaInfo: {
            primaryTitle: Application.decodeHTMLEntities(post.postTitle),

            secondaryTitles: post.alternativeTitles
                ? post.alternativeTitles
                      .split(/, ?/)
                      .map((t) => t.trim())
                      .filter((t) => t.length > 0)
                : [],

            thumbnailUrl: (() => {
                const url =
                    post.featuredImage ||
                    "https://qiscans.org/wp-content/uploads/2023/05/qiscans-logo.png";
                return url.replace("/file/qiscans/", "/");
            })(),

            synopsis: Application.decodeHTMLEntities(
                post.postContent.replace(/<[^>]+>/g, ""),
            ),

            ...(author ? { author } : {}),
            ...(artist ? { artist } : {}),

            status: post.seriesStatus ?? "UNKNOWN",
            contentRating: ContentRating.EVERYONE,

            tagGroups:
                post.genres && post.genres.length > 0
                    ? [
                          {
                              id: "genres",
                              title: "Genres",
                              tags: post.genres.map((g) => ({
                                  id: g.id.toString(),
                                  title: g.name,
                              })),
                          },
                      ]
                    : [],

            additionalInfo: {
                postId: post.id.toString(),
                slug: post.slug,
            },

            shareUrl: `https://qiscans.org/series/${post.slug}`,
        },
    };
}
