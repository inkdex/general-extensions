/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { distance as levenshtein } from "fastest-levenshtein";
import { stemmer } from "stemmer";

import type { Metadata } from "./models";

// Splits an array into batches of at most `size` items.
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

// undefined = no more pages (cap hit, total reached, or partial page). Cap is 10,000.
export function computeNextMetadata(
  offset: number,
  returned: number,
  total: number | undefined,
  pageSize: number,
): Metadata | undefined {
  if (returned < pageSize) return undefined;
  if (typeof total === "number" && offset + returned >= total) return undefined;
  const nextOffset = offset + pageSize;
  if (nextOffset >= 10000) return undefined;
  return { offset: nextOffset };
}

// MangaDex's createdAtSince filter. Anchored to start of UTC day
export function formatCreatedAtSince(ms: number): string {
  const d = new Date(ms);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 19);
}

// Skip the host call when no entities are possible.
export function decodeHTML(text: string): string {
  if (!text || !text.includes("&")) return text;
  return Application.decodeHTMLEntities(text) ?? text;
}

// Sniffs the first non whitespace char before JSON.parse. CDN returns HTML on 503.
export function parseJSONBody<T>(data: unknown, status: number): T {
  if (typeof data !== "string") {
    return data as T;
  }

  // Scan whitespace in place. trimStart would copy a 500 chapter feed body just to peek.
  let i = 0;
  const n = data.length;
  while (i < n) {
    const c = data.charCodeAt(i);
    if (c !== 32 && c !== 9 && c !== 10 && c !== 13) break;
    i++;
  }
  const firstChar = i < n ? data.charAt(i) : "";
  if (firstChar === "{" || firstChar === "[") {
    return JSON.parse(data) as T;
  }

  if (status >= 500) {
    throw new Error(`${status} MangaDex Unavailable`);
  }
  if (status >= 400) {
    throw new Error(`${status} MangaDex Request Failed`);
  }
  // Snippet so logs distinguish HTML maintenance from binary garbage.
  const snippet = data.slice(i, i + 80).replace(/\s+/g, " ");
  throw new Error(`Unexpected non JSON response from MangaDex (status ${status}): ${snippet}`);
}

// Tokenized and stemmed query. Built once per search (or per
// blocked group name) and reused across every candidate title.
export interface PrecomputedQuery {
  words: string[]; // stemmed query tokens
  phrase: string; // words.join(" ")
  stripped: string; // words.join("")
  // null for CJK only queries because \b is ASCII only, so the 99 and 95 tiers would be unreachable.
  startRegex: RegExp | null;
  anywhereRegex: RegExp | null;
}

// Defensive escape: a tokenizer change that lets a metacharacter
// through would otherwise break RegExp construction.
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const hasAsciiWord = (s: string): boolean => /[A-Za-z0-9]/.test(s);

export function precomputeQuery(queryTitle: string): PrecomputedQuery {
  const words = tokenize(queryTitle).map((w) => stemmer(w));
  const phrase = words.join(" ");
  const stripped = words.join("");
  const escapedPhrase = escapeRegExp(phrase);
  const buildRegex = hasAsciiWord(phrase);
  return {
    words,
    phrase,
    stripped,
    startRegex: buildRegex ? new RegExp(`^${escapedPhrase}\\b`, "i") : null,
    anywhereRegex: buildRegex ? new RegExp(`\\b${escapedPhrase}\\b`, "i") : null,
  };
}

export const relevanceScore = (title: string, query: PrecomputedQuery): number => {
  // Scale: 100 exact, 99 prefix phrase, 95 phrase, 90 prefix adj, 85 adj,
  // 80 in order, 75 any order, <70 partial.
  if (query.words.length === 0) {
    return 0;
  }

  const titleWords = tokenize(title).map((w) => stemmer(w));
  const titleStripped = titleWords.join("");

  if (titleStripped === query.stripped) {
    return 100;
  }

  const titlePhrase = titleWords.join(" ");
  if (query.startRegex && query.startRegex.test(titlePhrase)) {
    return 99;
  }
  if (query.anywhereRegex && query.anywhereRegex.test(titlePhrase)) {
    return 95;
  }

  const adjacentMatchIndex = findAdjacentSequence(titleWords, query.words);
  if (adjacentMatchIndex === 0) {
    return 90;
  } else if (adjacentMatchIndex > 0) {
    return 85;
  }

  // First pass: first match index per query word. One sweep covers
  // both allPresent and the in order check.
  const matchIndices: number[] = Array.from({ length: query.words.length });
  let allPresent = true;
  for (let k = 0; k < query.words.length; k++) {
    const queryWord = query.words[k];
    let found = -1;
    for (let i = 0; i < titleWords.length; i++) {
      if (stemmedWordSimilarity(queryWord, titleWords[i]) >= 0.7) {
        found = i;
        break;
      }
    }
    matchIndices[k] = found;
    if (found < 0) {
      allPresent = false;
    }
  }
  if (allPresent) {
    // Strictly increasing positions means in order, so skip the second sweep.
    let inOrder = true;
    for (let k = 1; k < matchIndices.length; k++) {
      if (matchIndices[k] <= matchIndices[k - 1]) {
        inOrder = false;
        break;
      }
    }
    if (!inOrder) {
      // Streaming pointer replay. Keeps the 80 vs 75 boundary for "King ... the King".
      let titlePos = 0;
      inOrder = true;
      for (const queryWord of query.words) {
        let found = -1;
        for (let i = titlePos; i < titleWords.length; i++) {
          if (stemmedWordSimilarity(queryWord, titleWords[i]) >= 0.7) {
            found = i;
            break;
          }
        }
        if (found < 0) {
          inOrder = false;
          break;
        }
        titlePos = found + 1;
      }
    }
    return inOrder ? 80 : 75;
  }

  const matchedQueryWords = getMatchedQueryWordsCount(titleWords, query.words);
  const proportionMatched = matchedQueryWords / query.words.length;

  let totalSimilarity = 0;
  for (const queryWord of query.words) {
    let maxSimilarity = 0;
    for (const titleWord of titleWords) {
      const similarity = stemmedWordSimilarity(queryWord, titleWord);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }
    totalSimilarity += maxSimilarity;
  }
  const averageSimilarity = totalSimilarity / query.words.length;
  // Both factors are in [0, 1], so the product is already bounded.
  return averageSimilarity * 70 * proportionMatched;
};

const tokenize = (text: string): string[] => {
  // \p{L}\p{N} with the u flag, not \w. \w is ASCII so CJK, Cyrillic, and Arabic would tokenize to nothing.
  return text
    .toLowerCase()
    .replace(/[\u2019']/g, "")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/[\s\-_]+/)
    .filter((word) => word.length > 0);
};

const getMatchedQueryWordsCount = (titleWords: string[], queryWords: string[]): number =>
  queryWords.filter((queryWord) =>
    titleWords.some((titleWord) => stemmedWordSimilarity(queryWord, titleWord) >= 0.7),
  ).length;

const findAdjacentSequence = (titleWords: string[], queryWords: string[]): number => {
  if (queryWords.length === 0 || titleWords.length < queryWords.length) return -1;
  for (let i = 0; i <= titleWords.length - queryWords.length; i++) {
    let allMatch = true;
    for (let j = 0; j < queryWords.length; j++) {
      if (stemmedWordSimilarity(queryWords[j], titleWords[i + j]) < 0.7) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return i;
  }
  return -1;
};

// Both inputs MUST be stemmed. Restemming here would waste cycles
// in the partial match hot path.
const stemmedWordSimilarity = (a: string, b: string): number => {
  if (a === b) {
    return 1.0;
  }

  // Substring shortcut, but guarded: a 1-char "A" would otherwise
  // match every group whose name contains the letter "a".
  const minLen = Math.min(a.length, b.length);
  const maxLen = Math.max(a.length, b.length);
  if (minLen >= 3 && minLen / maxLen >= 0.5 && (a.includes(b) || b.includes(a))) {
    return 0.8;
  }

  const distance = levenshtein(a, b);
  const similarity = (maxLen - distance) / maxLen;

  if (similarity >= 0.6) {
    return similarity;
  }

  return 0;
};
