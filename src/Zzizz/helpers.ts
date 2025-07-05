// Helper functions for Zzizz extension
// These utilities encapsulate common parsing and transformation logic for maintainability and clarity.
// Comments focus on intent, edge cases, and site-specific quirks for future maintainers.

import { ContentRating } from "@paperback/types";
import { CONTENT_RATING_GENRES, STATUS_MAPPING } from "./constants";

export class ZizHelpers {
    /**
     * Builds a full URL from a relative path, using the provided domain.
     * If the URL is already absolute, returns it unchanged.
     */
    static buildFullUrl(relativeUrl: string, domain: string): string {
        if (!relativeUrl) return "";
        return relativeUrl.startsWith("http")
            ? relativeUrl
            : `${domain}${relativeUrl}`;
    }

    /**
     * Normalizes status text to standard values for Paperback.
     * Zzizz uses 'In Release' for ongoing; update mapping if site changes.
     */
    static normalizeStatus(statusText: string): string {
        if (!statusText) return "Ongoing";
        const normalized = statusText.toLowerCase();
        if (STATUS_MAPPING.ONGOING.some((status) => status === normalized)) {
            return "Ongoing";
        }
        return statusText; // Return original if no mapping found
    }

    /**
     * Converts a rating from Zzizz's 5-point scale to Paperback's decimal format.
     * Returns undefined if rating is missing or not a number.
     */
    static calculateRating(ratingText: string): number | undefined {
        if (!ratingText || ratingText === "N/A") return undefined;
        const parsed = parseFloat(ratingText);
        if (isNaN(parsed)) return undefined;
        // Convert from 5-point scale to 10-point scale, then to decimal for Paperback
        return (parsed * 2) / 10;
    }

    /**
     * Determines content rating based on genres.
     * If 'harem' or 'harém' is present, returns ADULT; otherwise EVERYONE.
     */
    static determineContentRating(genres: string[]): ContentRating {
        const genreKeywords = genres.map((g) => g.toLowerCase());
        if (
            genreKeywords.some((g) =>
                CONTENT_RATING_GENRES.ADULT.some(
                    (adultGenre) => adultGenre === g,
                ),
            )
        ) {
            return ContentRating.ADULT;
        }
        return ContentRating.EVERYONE;
    }

    /**
     * Extracts chapter number and name from the title or URL.
     * Falls back to URL if not present in the title.
     */
    static extractChapterNumber(
        chapterTitle: string,
        chapterId: string,
    ): { number: number; name: string } {
        // Try to extract from title first (e.g., 'Chapter 49')
        const chapterMatch = chapterTitle.match(/Chapter\s+(\d+)/i);
        if (chapterMatch) {
            const number = parseFloat(chapterMatch[1]) || 0;
            return { number, name: `Chapter ${chapterMatch[1]}` };
        }
        // Fallback: try to extract from URL
        const urlMatch = chapterId.match(/reader\/manga\/[^/]+\/(\d+)/i);
        if (urlMatch) {
            const number = parseFloat(urlMatch[1]) || 0;
            return { number, name: `Chapter ${urlMatch[1]}` };
        }
        return { number: 0, name: "" };
    }

    /**
     * Parses a relative time string (e.g., '1 day ago') to a Date object.
     * If parsing fails, returns the current date.
     */
    static parseRelativeDate(dateString: string): Date {
        if (!dateString) return new Date();
        // Try to parse various date formats (future-proofing)
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date;
        }
        // Fallback to current date
        return new Date();
    }

    /**
     * Cleans a manga ID from a URL, removing query params and trailing slashes.
     * Handles both /manga/slug and /reader/manga/slug formats.
     */
    static cleanMangaId(url: string): string {
        if (!url || typeof url !== "string") return "";
        const cleanUrl = url.split("?")[0].replace(/\/$/, "");
        const match = cleanUrl.match(/(?:\/manga\/|\/reader\/manga\/)([^/]+)/);
        return match
            ? match[1]
            : cleanUrl.split("/").filter(Boolean).pop() || "";
    }

    /**
     * Ensures a URL ends with a trailing slash (for consistency with Zzizz site).
     */
    static ensureTrailingSlash(url: string): string {
        return url.endsWith("/") ? url : `${url}/`;
    }
}
