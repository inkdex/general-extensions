/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { fetchJSON } from "../../services/network";
import { buildLegacyMappingUrl } from "./urls";
import { chunk } from "./utils";

interface LegacyMappingItem {
  id: string;
  type: string;
  attributes: {
    type: string;
    legacyId: number;
    newId: string;
  };
}

interface LegacyMappingResponse {
  result: string;
  data: LegacyMappingItem[];
}

// Promise values let concurrent resolveLegacyId calls share one
// round trip. Failures are not cached so outages can retry.
const legacyToNewIdCache: Record<string, string | Promise<string>> = {};

const LEGACY_ID_RE = /^\d+$/;
// MangaDex's /legacy/mapping caps each POST at 100 ids.
const LEGACY_MAPPING_BATCH_SIZE = 100;
// Single source of truth for the v4 UUID shape. Locked to version 4
// so a corrupt id cannot inject extra path segments into a request URL.
export const UUID_FRAGMENT = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
export const UUID_RE = new RegExp(`^${UUID_FRAGMENT}$`, "i");
// Unanchored variant for UUIDs embedded in user typed search text.
export const UUID_SEARCH_RE = new RegExp(UUID_FRAGMENT, "i");

// Trim, lowercase, then validate against the v4 UUID shape. Returns undefined
// for empty input or anything that does not match
export function normalizeUuid(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().toLowerCase();
  return UUID_RE.test(trimmed) ? trimmed : undefined;
}

function isLegacyId(id: string): boolean {
  return LEGACY_ID_RE.test(id);
}

function cacheKey(type: "manga" | "chapter", legacyId: string): string {
  return `${type}:${legacyId}`;
}

export const resolveMangaId = (id: string): Promise<string> => resolveLegacyId(id, "manga");
export const resolveChapterId = (id: string): Promise<string> => resolveLegacyId(id, "chapter");

async function resolveLegacyId(id: string, type: "manga" | "chapter"): Promise<string> {
  if (!id) {
    throw new Error(`Empty ${type} id`);
  }
  // UUIDs pass through (lowercase form). Anything else is rejected.
  if (!isLegacyId(id)) {
    if (!UUID_RE.test(id)) {
      throw new Error(`Invalid ${type} id format: ${id}`);
    }
    return id.toLowerCase();
  }

  const key = cacheKey(type, id);
  const cached = legacyToNewIdCache[key];
  if (cached !== undefined) return cached;

  const numeric = parseInt(id, 10);
  // Reject ids past the safe integer range so precision loss can't send a
  // wrong id to /legacy/mapping
  if (!Number.isSafeInteger(numeric)) {
    throw new Error(`Invalid legacy ${type} id ${id}`);
  }
  // Declared up front so catch can check identity before clearing the cache slot.
  let promise!: Promise<string>;
  promise = (async (): Promise<string> => {
    try {
      const response = await fetchJSON<LegacyMappingResponse>({
        url: buildLegacyMappingUrl(),
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ids: [numeric] }),
      });
      const rawNewId = response.data?.find((d) => d.attributes?.legacyId === numeric)?.attributes
        ?.newId;
      // Validate the mapped id shape before caching and interpolating it into
      // request URLs, the same guard the direct UUID path applies above.
      const newId = normalizeUuid(rawNewId);
      if (!newId) {
        throw new Error(
          `Could not resolve legacy ${type} id ${id}. The ${type} may have been removed from MangaDex.`,
        );
      }
      if (legacyToNewIdCache[key] === promise) legacyToNewIdCache[key] = newId;
      return newId;
    } catch (e) {
      // Drop the entry so the next call retries. The identity
      // check guards against clearing a slot the batch path replaced.
      if (legacyToNewIdCache[key] === promise) delete legacyToNewIdCache[key];
      throw e;
    }
  })();

  legacyToNewIdCache[key] = promise;
  return promise;
}

// Batch resolves manga ids for the update flow. UUIDs pass through.
// Unresolved legacy ids are absent so the caller can skip them.
export async function resolveMangaIds(ids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const toFetchSet = new Set<number>();
  const inFlight: Array<{ id: string; promise: Promise<string> }> = [];

  for (const id of ids) {
    if (!id) continue;
    if (!isLegacyId(id)) {
      // UUIDs pass through lowercase. Anything else is dropped.
      if (UUID_RE.test(id)) out[id] = id.toLowerCase();
      continue;
    }
    const cached = legacyToNewIdCache[cacheKey("manga", id)];
    if (typeof cached === "string") {
      out[id] = cached;
      continue;
    }
    if (cached !== undefined) {
      // Share the in flight resolveMangaId promise.
      inFlight.push({ id, promise: cached });
      continue;
    }
    const num = parseInt(id, 10);
    // Drop unsafe ids
    if (Number.isSafeInteger(num)) toFetchSet.add(num);
  }

  // Reserve cache slots BEFORE awaiting so any concurrent
  // resolveMangaId finds our promise and shares it.
  const toFetch = Array.from(toFetchSet);
  let batchResolved: Promise<Record<string, string>> | null = null;
  if (toFetch.length > 0) {
    batchResolved = (async () => {
      // Let failures throw. Returning {} on a transient error would
      // let the update flow wipe every manga's chapter list.
      const responses = await Promise.all(
        chunk(toFetch, LEGACY_MAPPING_BATCH_SIZE).map((batch) =>
          fetchJSON<LegacyMappingResponse>({
            url: buildLegacyMappingUrl(),
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "manga", ids: batch }),
          }),
        ),
      );
      const result: Record<string, string> = {};
      for (const item of responses.flatMap((r) => r.data ?? [])) {
        const { legacyId, newId } = item.attributes ?? {};
        const normalized = normalizeUuid(newId);
        if (legacyId !== undefined && normalized) result[legacyId.toString()] = normalized;
      }
      return result;
    })();

    for (const num of toFetch) {
      const key = cacheKey("manga", num.toString());
      const idPromise = batchResolved.then(
        (m): string => {
          const newId = m[num.toString()];
          if (!newId) {
            // Missing from the response: invalid or deleted. Drop
            // the cache slot so a later call can retry.
            if (legacyToNewIdCache[key] === idPromise) delete legacyToNewIdCache[key];
            throw new Error(
              `Could not resolve legacy manga id ${num}. The manga may have been removed from MangaDex.`,
            );
          }
          legacyToNewIdCache[key] = newId;
          return newId;
        },
        (err: unknown): never => {
          // Batch failed (rate limit, 5xx, or network). Drop the slot
          // so the next call can retry.
          if (legacyToNewIdCache[key] === idPromise) delete legacyToNewIdCache[key];
          throw err instanceof Error ? err : new Error(String(err));
        },
      );
      // No op catch so the cached promise does not surface as
      // unhandled. Real callers still see it via their own awaits.
      idPromise.catch(() => {});
      legacyToNewIdCache[key] = idPromise;
    }
  }

  if (inFlight.length > 0) {
    const settled = await Promise.allSettled(inFlight.map((e) => e.promise));
    for (const [i, result] of settled.entries()) {
      if (result.status === "fulfilled") {
        out[inFlight[i].id] = result.value;
        continue;
      }
      // "Could not resolve legacy..." = absent on 200, so fall through. Anything else propagates.
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      if (!msg.includes("Could not resolve legacy")) {
        throw result.reason instanceof Error ? result.reason : new Error(msg);
      }
    }
  }

  if (batchResolved) {
    Object.assign(out, await batchResolved);
  }

  return out;
}
