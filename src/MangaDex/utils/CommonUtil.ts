import { type Request } from "@paperback/types";

// API endpoints and common constants
export const MANGADEX_DOMAIN = "https://mangadex.org";
export const MANGADEX_API = "https://api.mangadex.org";
export const COVER_BASE_URL = "https://uploads.mangadex.org/covers";
export const SEASONAL_LIST = "77430796-6625-4684-b673-ffae5140f337";

/**
 * Validates manga ID format, throws error for legacy IDs
 */
export function checkId(id: string): void {
  if (!id.includes("-")) {
    throw new Error("OLD ID: PLEASE REFRESH AND CLEAR ORPHANED CHAPTERS");
  }
}

/**
 * Fetches and parses JSON response from API
 */
export async function fetchJSON<T>(request: Request): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest(request);
  const data = Application.arrayBufferToUTF8String(buffer);
  const json: T = typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
  if (response.status !== 200) {
    console.log(`Failed to fetch json results for ${request.url}`);
  }
  return json;
}
