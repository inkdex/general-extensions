import { URL, type Request } from "@paperback/types";

// API endpoints and common constants
export const MANGADEX_DOMAIN = "https://mangadex.org";
export const MANGADEX_API = "https://api.mangadex.org";
export const COVER_BASE_URL = "https://uploads.mangadex.org/covers";
export const SEASONAL_LIST = "77430796-6625-4684-b673-ffae5140f337";

export function isLegacyId(id: string): boolean {
  return /^\d+$/.test(id);
}

const RESOLVED_ID_STATE_KEY = "resolvedLegacyIds";
const resolvedIdCache = new Map<string, string | null>();
let cacheLoaded = false;

function loadCache(): void {
  if (cacheLoaded) return;
  cacheLoaded = true;
  const stored = Application.getState(RESOLVED_ID_STATE_KEY) as Record<string, string> | undefined;
  if (stored) {
    for (const [k, v] of Object.entries(stored)) {
      resolvedIdCache.set(k, v);
    }
  }
}

function persistCache(): void {
  const obj: Record<string, string> = {};
  for (const [k, v] of resolvedIdCache.entries()) {
    if (v !== null) obj[k] = v;
  }
  Application.setState(obj, RESOLVED_ID_STATE_KEY);
}

export async function resolveLegacyId(
  numericId: string,
  type: "title" | "chapter" = "title",
): Promise<string | null> {
  loadCache();
  if (resolvedIdCache.has(numericId)) return resolvedIdCache.get(numericId) ?? null;

  try {
    const apiType = type === "title" ? "manga" : "chapter";
    const request = {
      url: new URL(MANGADEX_API).addPathComponent("legacy").addPathComponent("mapping").toString(),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: apiType,
        ids: [Number(numericId)],
      }),
    };

    const json = await fetchJSON<MangaDex.LegacyMappingResponse>(request);
    const newId = json.data?.[0]?.attributes?.newId;
    if (newId) {
      resolvedIdCache.set(numericId, newId);
      persistCache();
      return newId;
    }
  } catch (e) {
    console.warn(`Failed to resolve legacy ID "${numericId}": ${String(e)}`);
  }
  resolvedIdCache.set(numericId, null);
  return null;
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
