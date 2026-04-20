/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { distance as levenshtein } from "fastest-levenshtein";
import { stemmer } from "stemmer";

export const relevanceScore = (title: string, queryTitle: string): number => {
  /**
   * Calculates the relevance score between a given `title` and a `queryTitle` using a comprehensive set of string matching techniques.
   * The scoring system prioritizes exact matches but also considers partial similarities to provide a nuanced relevance metric.
   *
   * 100: Exact match of title and query after stripping and tokenization.
   * 99: Exact phrase match at the beginning of the title.
   * 95: Exact phrase match elsewhere in the title.
   * 90: Adjacent sequence match at the beginning.
   * 85: Adjacent sequence match elsewhere.
   * 80: Query words appear in order but not adjacent.
   * 75: All query words are present regardless of order.
   * Below 70: Partial matches, with similarity calculated.
   *
   * @param title - The manga/comic title to compare.
   * @param queryTitle - The user's search query.
   * @returns a number representing the relevance score
   */
  const titleTokens = tokenize(title);
  const queryTokens = tokenize(queryTitle);

  const titleWords = stemmedTokens(titleTokens);
  const queryWords = stemmedTokens(queryTokens);

  const titleStripped = titleWords.join("");
  const queryStripped = queryWords.join("");

  // Exact match after stemming
  if (titleStripped === queryStripped) {
    return 100;
  }

  const titlePhrase = titleWords.join(" ");
  const queryPhrase = queryWords.join(" ");

  // Exact phrase match at beginning after stemming
  const phraseAtStartRegex = new RegExp(`^${queryPhrase}\\b`, "i");
  if (phraseAtStartRegex.test(titlePhrase)) {
    return 99;
  }

  // Exact phrase match anywhere after stemming
  const phraseAnywhereRegex = new RegExp(`\\b${queryPhrase}\\b`, "i");
  if (phraseAnywhereRegex.test(titlePhrase)) {
    return 95;
  }

  // Adjacent sequence match (exact order, consecutive)
  const adjIdx = findAdjacentSequence(titleWords, queryWords);
  if (adjIdx === 0) {
    return 90; // Adjacent sequence at the beginning
  } else if (adjIdx > 0) {
    return 85; // Adjacent sequence elsewhere
  }

  // All query words present regardless of order
  if (allWordsPresent(titleWords, queryWords)) {
    if (wordsAppearInOrder(titleWords, queryWords)) {
      return 80; // All words present and in order (not adjacent)
    } else {
      return 75; // All words present in any order
    }
  }

  // Words appear in order but not adjacent
  // (Removed: redundant wordsAppearInOrder check)

  // Partial matches
  const matchedQueryWords = getMatchedQueryWordsCount(titleWords, queryWords);
  const proportionMatched = matchedQueryWords / queryWords.length;

  let totalSimilarity = 0;
  for (const queryWord of queryWords) {
    let maxSimilarity = 0;
    for (const titleWord of titleWords) {
      const similarity = wordSimilarity(queryWord, titleWord);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }
    totalSimilarity += maxSimilarity;
  }
  const averageSimilarity = totalSimilarity / queryWords.length;
  const finalScore = averageSimilarity * 70 * proportionMatched; // Scale appropriately
  return Math.max(0, Math.min(70, finalScore));
};

// Sanitize and split text into tokens/words
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[\u2019']/g, "") // Remove apostrophes
    .replace(/[^\w\s-]+/g, " ") // Replace punctuation except hyphens with space
    .split(/[\s-_]+/) // Split into words on spaces or hyphens or underscores
    .filter((word) => word.length > 0);
};

const stemmedTokens = (tokens: string[]): string[] => {
  return tokens.map((word) => stemmer(word));
};

const getMatchedQueryWordsCount = (titleWords: string[], queryWords: string[]): number => {
  let count = 0;
  for (const queryWord of queryWords) {
    for (const titleWord of titleWords) {
      if (wordSimilarity(queryWord, titleWord) >= 0.7) {
        count++;
        break;
      }
    }
  }
  return count;
};

const wordsAppearInOrder = (titleWords: string[], queryWords: string[]): boolean => {
  let titleIndex = 0;
  for (let i = 0; i < queryWords.length; i++) {
    const queryWord = queryWords[i];
    while (titleIndex < titleWords.length) {
      if (wordSimilarity(queryWord, titleWords[titleIndex]) >= 0.7) {
        // Match found
        titleIndex++;
        break;
      }
      titleIndex++;
    }
    if (titleIndex === titleWords.length && i < queryWords.length - 1) {
      // Not all words found in order
      return false;
    }
  }
  return true;
};

/**
 * Returns the index of the first adjacent sequence of queryWords in titleWords.
 * Returns -1 if not found.
 */
const findAdjacentSequence = (titleWords: string[], queryWords: string[]): number => {
  if (queryWords.length === 0 || titleWords.length < queryWords.length) return -1;
  for (let i = 0; i <= titleWords.length - queryWords.length; i++) {
    let allMatch = true;
    for (let j = 0; j < queryWords.length; j++) {
      if (wordSimilarity(queryWords[j], titleWords[i + j]) < 0.7) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return i;
  }
  return -1;
};

const allWordsPresent = (titleWords: string[], queryWords: string[]): boolean => {
  for (const queryWord of queryWords) {
    let found = false;
    for (const titleWord of titleWords) {
      if (wordSimilarity(queryWord, titleWord) >= 0.7) {
        found = true;
        break;
      }
    }
    if (!found) {
      // Word not found in title
      return false;
    }
  }
  return true;
};

// Get word similarity between two words
const wordSimilarity = (word1: string, word2: string): number => {
  const stemmedWord1 = stemmer(word1);
  const stemmedWord2 = stemmer(word2);

  // Direct match after stemming
  if (stemmedWord1 === stemmedWord2) {
    return 1.0;
  }

  // **Substring Match Check**
  if (stemmedWord1.includes(stemmedWord2) || stemmedWord2.includes(stemmedWord1)) {
    return 0.8; // Fixed similarity score for substring matches
  }

  // Levenshtein distance
  const maxLen = Math.max(stemmedWord1.length, stemmedWord2.length);
  const distance = levenshtein(stemmedWord1, stemmedWord2);
  const similarity = (maxLen - distance) / maxLen;

  if (similarity >= 0.6) {
    return similarity;
  }

  return 0;
};
