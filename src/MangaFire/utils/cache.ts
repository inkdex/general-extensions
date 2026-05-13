/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

const CACHE_MAX_ENTRIES = 20;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  value: string;
  expiresAt: number;
}

type Cache = Record<string, CacheEntry>;

function readCache(stateKey: string): Cache {
  return (Application.getState(stateKey) as Cache | undefined) ?? {};
}

export function cacheGet(stateKey: string, key: string): string | undefined {
  const cache = readCache(stateKey);
  const entry = cache[key];
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    return undefined;
  }
  return entry.value;
}

export function cacheClear(stateKey: string): void {
  Application.setState(undefined, stateKey);
}

export function cacheSet(stateKey: string, key: string, value: string): void {
  const cache = readCache(stateKey);
  const now = Date.now();

  for (const k of Object.keys(cache)) {
    if (cache[k].expiresAt < now) delete cache[k];
  }

  cache[key] = { value, expiresAt: now + CACHE_TTL_MS };

  const keys = Object.keys(cache);
  if (keys.length > CACHE_MAX_ENTRIES) {
    keys.sort((a, b) => cache[a].expiresAt - cache[b].expiresAt);
    for (let i = 0; i < keys.length - CACHE_MAX_ENTRIES; i++) {
      delete cache[keys[i]];
    }
  }

  Application.setState(cache, stateKey);
}
