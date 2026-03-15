import { ContentRating, URL, type SourceManga } from "@paperback/types";
import { parseMangaDetails } from "../MangaDexParser";
import { getCoverArtworkEnabled } from "../MangaDexSettings";
import {
  fetchJSON,
  isLegacyId,
  MANGADEX_API,
  MANGADEX_DOMAIN,
  resolveLegacyId,
} from "../utils/CommonUtil";

/**
 * Handles fetching manga details and information
 */
export class MangaProvider {
  /**
   * Retrieves detailed information for a specific manga
   */
  async getMangaDetails(mangaId: string): Promise<SourceManga> {
    if (isLegacyId(mangaId)) {
      const resolvedId = await resolveLegacyId(mangaId);
      if (resolvedId && !isLegacyId(resolvedId)) {
        console.log(`getMangaDetails: resolved legacy ID "${mangaId}" to "${resolvedId}"`);
        const result = await this.getMangaDetails(resolvedId);
        return { ...result, mangaId };
      }

      console.warn(`getMangaDetails: could not resolve legacy ID "${mangaId}"`);
      return {
        mangaId,
        mangaInfo: {
          primaryTitle: `Legacy Manga (ID: ${mangaId})`,
          secondaryTitles: [],
          thumbnailUrl: "",
          synopsis:
            "This manga uses an old numeric ID that could not be resolved. Tap the MangaDex icon at the top right to visit the correct MangaDex page, then re-add this manga by searching for it.",
          shareUrl: `${MANGADEX_DOMAIN}/title/${mangaId}`,
          contentRating: ContentRating.EVERYONE,
        },
      };
    }

    let request = {
      url: new URL(MANGADEX_API)
        .addPathComponent("manga")
        .addPathComponent(mangaId)
        .setQueryItems({
          "includes[]": ["author", "artist", "cover_art"],
        })
        .toString(),
      method: "GET",
    };

    const json = await fetchJSON<MangaDex.MangaDetailsResponse>(request);

    // Handle MangaDex API error responses with proper typing
    if (json.result === "error" && Array.isArray(json.errors) && json.errors.length === 1) {
      const err = json.errors[0];
      if (err.status === 404) {
        throw new Error(
          `MangaDex API Error: [${err.status}] ${err.detail}. You may need to re-add this manga`,
        );
      }
    }

    request = {
      url: new URL(MANGADEX_API)
        .addPathComponent("statistics")
        .addPathComponent("manga")
        .addPathComponent(mangaId)
        .toString(),
      method: "GET",
    };

    const ratingJson = await fetchJSON<MangaDex.StatisticsResponse>(request);

    let coversJson: MangaDex.CoverArtResponse | undefined;

    if (getCoverArtworkEnabled()) {
      request = {
        url: new URL(MANGADEX_API)
          .addPathComponent("cover")
          .setQueryItem("manga[]", mangaId)
          .setQueryItem("limit", "100")
          .setQueryItem("order[volume]", "desc")
          .setQueryItem("order[createdAt]", "desc")
          .toString(),
        method: "GET",
      };

      coversJson = await fetchJSON<MangaDex.CoverArtResponse>(request);
    }

    return parseMangaDetails(mangaId, json, ratingJson, coversJson);
  }
}
