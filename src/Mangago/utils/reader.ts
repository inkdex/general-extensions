/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { CloudflareError } from "@paperback/types";

import { DOMAIN, READER_USER_AGENT } from "../models";
import { fetchText, fetchTextWithUrl } from "../network";
import {
  cacheReaderHtml,
  CHAPTER_JS_STATE_PREFIX,
  chapterJsCache,
  getCachedReaderHtml,
  mangagoPageUrlsCache,
  paceReaderFetch,
  pathnameKey,
} from "./cache";
import {
  aesCbcDecrypt,
  base64ToArrayBuffer,
  decodeHex,
  findCols,
  findHexEncodedVariable,
  getDescramblingKey,
  sojsonV4Decode,
  unscrambleImageList,
} from "./crypto";
import {
  buildReaderPageUrl,
  extractChapterJsUrl,
  extractCurlTemplate,
  extractCurrentReaderPage,
  extractImgsrcsFromHtml,
  extractMultimode,
  extractNextPageHref,
  extractPcurlTemplate,
  extractTotalPages,
  isImageIndexTemplate,
  isMangago404Page,
  readerChapterKey,
  usableCurlTemplate,
} from "./readerHtml";
import {
  absoluteUrl,
  canonicalReaderUrl,
  isNumericChapterReaderUrl,
  isReadMangaReaderUrl,
  numericChapterCandidates,
  readMangaPagePosition,
  readerHostOf,
  readerPagePosition,
  readerPathSearchOf,
  resolveUrl,
} from "./urls";

// Sec-Fetch-* headers a browser sends when navigating to a reader page. With the
// same-origin referer/origin (see readerHeadersForUrl), they make a sub-page
// fetch look like a real navigation, which mangago serves in full. Scoped to
// reader-page HTML only — image requests have a different Sec-Fetch context.
const READER_NAVIGATION_HEADERS: Record<string, string> = {
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "navigate",
  "sec-fetch-dest": "document",
  "sec-fetch-user": "?1",
};

// Decrypt + unscramble a single reader page's imgsrcs blob into raw image URLs.
function decodeImgsrcsBlob(
  imgsrcsRaw: string,
  deobfChapterJs: string,
  keyHex: string,
  ivHex: string,
  keepBlanks = false,
): Promise<string[]> {
  const encrypted = base64ToArrayBuffer(imgsrcsRaw);

  return aesCbcDecrypt(encrypted, decodeHex(keyHex), decodeHex(ivHex)).then((decryptedBuffer) => {
    // Use the provided converter rather than a global TextDecoder, which the
    // on-device runtime doesn't guarantee. This blob is plain ASCII (comma-joined
    // URLs).
    let decryptedText = Application.arrayBufferToUTF8String(decryptedBuffer);

    const nulChar = String.fromCharCode(0);
    while (decryptedText.endsWith(nulChar)) {
      decryptedText = decryptedText.slice(0, -1);
    }

    decryptedText = decryptedText.replace(/,+$/g, "");

    const imageList = unscrambleImageList(decryptedText, deobfChapterJs);

    const images = imageList.split(",").map((x) => x.trim());
    return keepBlanks ? images : images.filter(Boolean);
  });
}

// Turn a raw image URL into the final URL, appending the descramble fragment
// for scrambled (cspiclink) images so the interceptor can unscramble them.
function annotateImageUrl(rawUrl: string, deobfChapterJs: string, cols: number): string {
  const abs = absoluteUrl(rawUrl);

  if (!abs.includes("cspiclink")) {
    return abs;
  }

  if (!cols) {
    return abs;
  }

  try {
    const desckey = getDescramblingKey(deobfChapterJs, abs);
    return `${abs}#desckey=${encodeURIComponent(desckey)}&cols=${encodeURIComponent(String(cols))}`;
  } catch {
    return abs;
  }
}

// Validate a deobfuscated chapter.js before trusting it (especially one read
// from persistent state, which could be truncated or stale). Require every
// marker the decode pipeline needs; if any is missing, the caller refetches.
function isUsableDeobfChapterJs(js: unknown): js is string {
  return (
    typeof js === "string" &&
    js.length > 1000 &&
    !!findHexEncodedVariable(js, "key") &&
    !!findHexEncodedVariable(js, "iv") &&
    findCols(js) > 0 &&
    js.includes("var renImg = function(img,width,height,id){") &&
    js.includes("key = key.split(")
  );
}

async function getCachedDeobfChapterJs(chapterJsUrl: string): Promise<string> {
  const cached = chapterJsCache.get(chapterJsUrl);
  if (cached) return cached;

  // Persistent cache (survives app launches), keyed by the versioned script URL.
  // A version bump changes the key, so a stale script can't be re-served.
  const stateKey = `${CHAPTER_JS_STATE_PREFIX}${chapterJsUrl}`;
  try {
    const persisted = Application.getState(stateKey);
    if (isUsableDeobfChapterJs(persisted)) {
      chapterJsCache.set(chapterJsUrl, persisted);
      return persisted;
    }
  } catch {
    // State read is only an optimization; fall through to fetch.
  }

  const obfuscatedChapterJs = await fetchText(chapterJsUrl);
  const deobf = sojsonV4Decode(obfuscatedChapterJs);
  chapterJsCache.set(chapterJsUrl, deobf);

  // Only persist a value we've validated, so a bad decode is never frozen into
  // state and re-served on the next launch.
  if (isUsableDeobfChapterJs(deobf)) {
    try {
      Application.setState(deobf, stateKey);
    } catch {
      // Persisting is an optimization; ignore storage failures.
    }
  }

  return deobf;
}

// Fetch one reader page. Returns the HTML (with the imgsrcs blob and next_page
// link) plus the serving origin. Sets `outcome.dead` when the page returned
// Mangago's definitive 404 (vs. a retryable failure), so the fallback crawl can
// tell a dead reader from a temporary gap.
type ReaderFetchOutcome = { dead: boolean };

async function fetchReaderPage(
  pageUrl: string,
  outcome?: ReaderFetchOutcome,
): Promise<{ html: string; url: string; origin: string } | undefined> {
  // Pin the page to a host that serves it before anything else, so a relative
  // next-page link or quirky response URL can't drift the walk off-domain.
  // read-manga pins to www.mangago.me; numeric /chapter/ pages keep their mirror
  // host, since www.mangago.me 404s those.
  pageUrl = canonicalReaderUrl(pageUrl);

  // Reuse a recently-fetched copy of this page (e.g. when re-walking an
  // incomplete chapter) instead of re-hitting the network or rate limiter.
  const cachedHtml = getCachedReaderHtml(pageUrl);
  if (cachedHtml) {
    return { html: cachedHtml, url: pageUrl, origin: DOMAIN };
  }

  // Retry across a few rounds with a short backoff between them, since a page can
  // transiently fail (rate-limit, -999 cancel, momentary network) and the walk
  // treats one failed page as the chapter's end. The backoff is a wait between
  // retries, not a fetch timeout; without it all rounds fire before the blip
  // clears. A Cloudflare challenge is surfaced below so the bypass webview shows.
  let cloudflareError: CloudflareError | undefined;

  let definitive404 = false;

  const MAX_ROUNDS = 3;
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    try {
      await paceReaderFetch();
      const html = await fetchText(pageUrl, {
        // Desktop reader UA only. No bare "cookie" header: the interceptor
        // merges _m_superu=1 alongside any Cloudflare-bypass cookies, and setting
        // one here would drop those.
        "user-agent": READER_USER_AGENT,
        ...READER_NAVIGATION_HEADERS,
      });
      if (extractImgsrcsFromHtml(html)) {
        cacheReaderHtml(pageUrl, html);
        return { html, url: pageUrl, origin: DOMAIN };
      }
      // A definitive 404 is not retryable; stop instead of re-hammering it.
      if (isMangago404Page(html)) {
        definitive404 = true;
        break;
      }
    } catch (error) {
      if (error instanceof CloudflareError) cloudflareError = error;
    }

    if (round < MAX_ROUNDS) {
      await new Promise((resolve) => setTimeout(resolve, 400 * round));
    }
  }

  // A real Cloudflare wall must reach the user as a bypass prompt.
  if (cloudflareError) throw cloudflareError;

  if (outcome) outcome.dead = definitive404;
  return undefined;
}

async function decodeReaderPageImages(
  pageUrl: string,
  deobfChapterJs: string,
  keyHex: string,
  ivHex: string,
  keepBlanks = false,
  outcome?: ReaderFetchOutcome,
): Promise<{ images: string[]; html: string; url: string; origin: string } | undefined> {
  const result = await fetchReaderPage(pageUrl, outcome);
  if (!result) return undefined;

  const imgsrcs = extractImgsrcsFromHtml(result.html);
  if (!imgsrcs) return undefined;

  const images = await decodeImgsrcsBlob(imgsrcs, deobfChapterJs, keyHex, ivHex, keepBlanks);
  if (!images.some(Boolean)) return undefined;

  return { ...result, images };
}

export async function getMangagoPageUrls(chapterUrl: string): Promise<string[]> {
  const cachedPages = mangagoPageUrlsCache.get(chapterUrl);
  if (cachedPages && cachedPages.length > 0) {
    return cachedPages;
  }

  // The read-manga reader returns the complete image list in one shot. A stale
  // numeric library URL is normalised to www.mangago.me by canonicalReaderUrl
  // (where it 404s) after getChapterDetails has self-healed it to a read-manga URL.
  let html = "";
  let loadedUrl = chapterUrl;
  let cloudflareError: CloudflareError | undefined;
  const tried = new Set<string>();
  const canonical = canonicalReaderUrl(chapterUrl);
  const candidates: string[] = [];
  const addCandidate = (candidate: string): void => {
    if (candidate && !candidates.includes(candidate)) candidates.push(candidate);
  };
  addCandidate(canonical);
  addCandidate(chapterUrl);
  // A numeric /chapter/<mid>/<cid>/ reader 404s on www.mangago.me but is served
  // by the mirror hosts, so try every mirror for titles that only expose numeric
  // links. www.mangago.me stays first so a numeric URL that redirects to its
  // /read-manga/ reader still takes the fast path.
  for (const mirror of numericChapterCandidates(canonical)) addCandidate(mirror);

  for (const candidate of candidates) {
    if (tried.has(candidate)) continue;
    tried.add(candidate);

    const cached = getCachedReaderHtml(candidate);
    if (cached && cached.includes("imgsrcs")) {
      html = cached;
      loadedUrl = canonicalReaderUrl(candidate);
      break;
    }

    try {
      // No paceReaderFetch() here: this is the single initial chapter-page fetch,
      // not the sub-page burst, so pacing would only add latency. The rate
      // limiter still guards bursts; pacing is kept inside fetchReaderPage.
      const { text: attempt, finalUrl } = await fetchTextWithUrl(candidate, {
        // Desktop reader UA only; _m_superu is added by the interceptor (see
        // fetchReaderPage for why we don't set a bare cookie header).
        "user-agent": READER_USER_AGENT,
        ...READER_NAVIGATION_HEADERS,
      });
      if (attempt.includes("imgsrcs")) {
        cacheReaderHtml(candidate, attempt);
        html = attempt;
        // Use the final URL (after any numeric -> read-manga redirect) so the
        // walk keys off the page we actually landed on; otherwise same-chapter
        // next_page links won't match and the walk stops after the first window.
        // canonicalReaderUrl keeps a numeric reader on its mirror host.
        loadedUrl = canonicalReaderUrl(finalUrl);
        break;
      }
    } catch (error) {
      if (error instanceof CloudflareError) cloudflareError = error;
      // Otherwise try the next candidate.
    }
  }

  // Prefer surfacing a Cloudflare challenge over a generic "no usable page" error.
  if (!html && cloudflareError) throw cloudflareError;
  if (!html) throw new Error("[Mangago] no usable chapter page");

  const imgsrcsRaw = extractImgsrcsFromHtml(html);
  if (!imgsrcsRaw) throw new Error("Could not extract imgsrcs");

  const chapterJsSrc = extractChapterJsUrl(html);
  if (!chapterJsSrc) throw new Error("Could not find chapter.js URL");

  const chapterJsUrl = resolveUrl(chapterJsSrc, loadedUrl);
  const deobfChapterJs = await getCachedDeobfChapterJs(chapterJsUrl);

  const keyHex = findHexEncodedVariable(deobfChapterJs, "key");
  const ivHex = findHexEncodedVariable(deobfChapterJs, "iv");
  if (!keyHex) throw new Error("Could not find AES key");
  if (!ivHex) throw new Error("Could not find AES IV");

  const cols = findCols(deobfChapterJs);

  // Decode page 1's imgsrcs positionally (keep blanks). Mangago commonly ships
  // the full positional list on page 1 with blanks for other windows' slots, so
  // the presence of blanks is one windowed signal.
  const firstPositional = await decodeImgsrcsBlob(imgsrcsRaw, deobfChapterJs, keyHex, ivHex, true);
  const firstImages = firstPositional.filter((url) => url.trim() !== "");

  // The site's own windowing flag is the authoritative signal: `_multimode = "1"`
  // means page 1 is only a slice regardless of blanks. Some numeric readers emit
  // one window's worth of URLs with no blank padding while total_pages is far
  // larger, so "no blanks" alone can't be trusted there.
  const multimodeFlag = extractMultimode(html);

  // `_multimode`: `"1"` = windowed (page 1 is a slice), anything else = full
  // reader (page 1 carries every image). A read-manga URL fetched with the
  // desktop UA + _m_superu cookie reports "" and a complete imgsrcs list, so we
  // trust it outright. Non-read-manga (numeric) readers still need the stricter
  // no-blanks signal, since some serve only one window while total_pages is larger.
  const totalPages = extractTotalPages(html);
  const readMangaReader = isReadMangaReaderUrl(loadedUrl);

  // Cross-check `total_pages` against the read-manga "full reader" signal. Trust
  // page 1 as complete only when no total is advertised (total_pages = 0) or it
  // already carries at least that many images; otherwise fall through to the walk
  // to recover the rest.
  const readMangaComplete =
    readMangaReader && (totalPages === 0 || firstImages.length >= totalPages);

  // Fast path (the common case): page 1 holds the whole chapter, so return its
  // image URLs directly. Trusted for a read-manga reader (with the total_pages
  // cross-check above) or when page 1 carries every positional slot.
  if (
    multimodeFlag !== "1" &&
    firstImages.length > 0 &&
    (readMangaComplete || firstImages.length === firstPositional.length)
  ) {
    const pages = firstImages.map((url) => annotateImageUrl(url, deobfChapterJs, cols));
    // Don't cache a result that might be truncated (no-blanks matched but
    // total_pages says there should be more); only a confirmed-complete result
    // is safe to cache.
    const suspectedPartial = totalPages > 0 && firstImages.length < totalPages;
    if (pages.length > 0 && !suspectedPartial) mangagoPageUrlsCache.set(chapterUrl, pages);
    return pages;
  }

  const curlTemplate = usableCurlTemplate(extractCurlTemplate(html)) ?? extractPcurlTemplate(html);
  const nextPageHref = extractNextPageHref(html);
  const firstPageChapterKey = readerChapterKey(loadedUrl);
  const nextPageSameChapter = nextPageHref
    ? readerChapterKey(resolveUrl(nextPageHref, loadedUrl)) === firstPageChapterKey
    : false;
  const imageIndexTemplate = !!curlTemplate && isImageIndexTemplate(curlTemplate);
  const totalImagePages =
    !curlTemplate || imageIndexTemplate
      ? multimodeFlag === "1" && totalPages > 0 && firstImages.length >= totalPages
        ? 0
        : totalPages
      : 0;
  const totalReaderPages =
    curlTemplate && !imageIndexTemplate && totalPages > 0 && firstImages.length < totalPages
      ? totalPages
      : 0;

  // A multimode reader holds only a slice on page 1; the rest are reachable via
  // the next_page link. `total_pages` isn't stable across variants (numeric
  // readers count images, some read-manga readers count windows), so when page 1
  // already has at least that many images we leave the image total open-ended and
  // walk links until the site points at the next chapter.
  const isMultimode =
    (!!curlTemplate || !!nextPageHref) &&
    (multimodeFlag === "1" ||
      nextPageSameChapter ||
      (totalPages > 0 && firstImages.length < totalPages));

  // Windowed multimode is resolved eagerly by walking every reader window and
  // collecting the real image URLs — the returned URLs are fetched directly, so a
  // marker URL must never end up in the list.
  let rawImages: string[];
  let complete = true;

  if (!isMultimode) {
    rawImages = firstImages;
  } else {
    const pageSlots = new Map<number, string>();
    const seen = new Set<string>();
    const addImagesAt = (startPage: number, imgs: string[], positional = false): number => {
      let added = 0;
      imgs.forEach((img, index) => {
        const clean = img.trim();
        if (!clean || seen.has(clean)) return;

        const page = positional ? index + 1 : startPage + index;
        if (page < 1 || (totalImagePages > 0 && page > totalImagePages)) return;

        seen.add(clean);
        pageSlots.set(page, clean);
        added++;
      });
      return added;
    };
    const collectedCount = (): number => pageSlots.size;
    const nextMissingPage = (): number => {
      if (totalImagePages > 0) {
        for (let page = 1; page <= totalImagePages; page++) {
          if (!pageSlots.has(page)) return page;
        }
      }
      return collectedCount() + 1;
    };

    addImagesAt(extractCurrentReaderPage(html) ?? 1, firstImages);

    // Follow the last successful page's own next_page link (handles variable
    // window sizes and stops when it crosses into the next chapter). When a page
    // fails, fall back — on the numeric image-index reader only — to the curl
    // template at the next expected image index and skip the failed window
    // (gap-tolerant). read-manga "pg-N" readers use the template's reader-page
    // number instead, since each window can hold several images.
    const chapterKey = firstPageChapterKey;
    // Pages already loaded/attempted, keyed mirror-independently by path, so the
    // walk only moves forward (a backward/duplicate link can't stall it).
    const visitedPaths = new Set<string>([pathnameKey(loadedUrl)]);

    // Window size = how many images page 1 carried; used to step past a failed
    // page on the numeric reader.
    const stride = Math.max(1, firstImages.length);
    const imageIndexReader = imageIndexTemplate;

    // The numeric reader is host-locked to whichever mirror served page 1, but
    // its next_url is an absolute www.mangago.me URL even on a mirror, which 404s
    // there. Pin every walked URL to the page-1 host and use next_url only for its
    // page number, not its host. Scoped to numeric mirror readers; read-manga
    // walks already stay on www.mangago.me.
    const walkHost = isNumericChapterReaderUrl(loadedUrl) ? readerHostOf(loadedUrl) : undefined;
    const pinWalkHost = (url: string): string =>
      walkHost ? `https://${walkHost}${readerPathSearchOf(url)}` : url;

    let currentHtml = html; // HTML of the last reader page fetched successfully
    let currentUrl = loadedUrl;
    let expectedNext = imageIndexReader
      ? nextMissingPage()
      : (extractCurrentReaderPage(html) ?? readMangaPagePosition(loadedUrl) ?? 1) + 1;
    let consecutiveFailures = 0;
    let safety = Math.max(totalImagePages, totalReaderPages, firstImages.length, 50) + 25;
    let exhaustedSafety = true;

    while (safety-- > 0) {
      if (totalImagePages > 0 && collectedCount() >= totalImagePages) {
        exhaustedSafety = false;
        break; // collected them all
      }
      if (!imageIndexReader && totalReaderPages > 0 && expectedNext > totalReaderPages) {
        exhaustedSafety = false;
        break; // visited every known reader-page window
      }

      let nextUrl: string | undefined;
      const nextHref = currentHtml ? extractNextPageHref(currentHtml) : undefined;
      if (nextHref) {
        const resolved = resolveUrl(nextHref, currentUrl);
        if (readerChapterKey(resolved) === chapterKey) {
          nextUrl = resolved;
        }
      }

      if (
        !nextUrl &&
        curlTemplate &&
        (imageIndexReader
          ? totalImagePages === 0 || expectedNext <= totalImagePages
          : totalReaderPages === 0 || expectedNext <= totalReaderPages)
      ) {
        nextUrl = buildReaderPageUrl(curlTemplate, currentUrl || loadedUrl, expectedNext);
      }

      if (!nextUrl) {
        exhaustedSafety = false;
        break; // next chapter or no usable next link/template -> done
      }

      // Force the next window onto the page-1 host (see walkHost).
      nextUrl = pinWalkHost(nextUrl);

      // Forward-only guard. If we've already tried this page, skip past it on the
      // numeric reader; otherwise stop.
      if (visitedPaths.has(pathnameKey(nextUrl))) {
        if (imageIndexReader) {
          expectedNext = (readerPagePosition(nextUrl) ?? expectedNext) + stride;
          currentHtml = "";
          complete = false;
          continue;
        }
        if (curlTemplate && (totalReaderPages === 0 || expectedNext <= totalReaderPages)) {
          currentHtml = "";
          expectedNext++;
          complete = false;
          continue;
        }
        exhaustedSafety = false;
        break;
      }
      visitedPaths.add(pathnameKey(nextUrl));

      const result = await decodeReaderPageImages(nextUrl, deobfChapterJs, keyHex, ivHex);
      let progressed = false;
      if (
        result &&
        addImagesAt(
          imageIndexReader
            ? (extractCurrentReaderPage(result.html) ??
                readerPagePosition(result.url) ??
                expectedNext)
            : collectedCount() + 1,
          result.images,
        ) > 0
      ) {
        progressed = true;
        currentHtml = result.html;
        currentUrl = result.url;
        expectedNext = imageIndexReader
          ? nextMissingPage()
          : (extractCurrentReaderPage(result.html) ??
              readMangaPagePosition(result.url) ??
              expectedNext) + 1;
      }

      if (progressed) {
        consecutiveFailures = 0;
        continue;
      }

      // This page failed (no imgsrcs / decoded nothing / only duplicates). Skip
      // the failed window and keep collecting (gap-tolerant), bailing after a few
      // failures in a row so a dead reader doesn't hammer every page. read-manga
      // pg-N readers skip by reader window rather than image index.
      complete = false;
      if (imageIndexReader) {
        const skipTo = (readerPagePosition(nextUrl) ?? expectedNext) + stride;
        expectedNext = skipTo;
        currentHtml = "";
        if (++consecutiveFailures >= 3) {
          exhaustedSafety = false;
          break;
        }
      } else if (curlTemplate && (totalReaderPages === 0 || expectedNext <= totalReaderPages)) {
        const skipTo = (readMangaPagePosition(nextUrl) ?? expectedNext) + 1;
        expectedNext = skipTo;
        currentHtml = "";
        if (++consecutiveFailures >= 3) {
          exhaustedSafety = false;
          break;
        }
      } else {
        exhaustedSafety = false;
        break;
      }
    }
    if (exhaustedSafety) complete = false;

    if (curlTemplate && totalImagePages > 0 && collectedCount() < totalImagePages) {
      const allowWindowFallback = imageIndexReader && collectedCount() === firstImages.length;

      // Retry missing slots by reader window. Numeric image-index URLs address a
      // whole window, not a single image, so a failure on one window leaves a
      // range of pages empty and retrying intermediate indexes just hammers
      // non-existent windows. Non-image-index readers use the exact missing page,
      // since their URLs are page-specific.
      const directTriedSlots = new Set<number>();
      const fallbackStartFor = (missing: number): number =>
        imageIndexReader ? Math.floor((missing - 1) / stride) * stride + 1 : missing;
      const markDirectTried = (start: number): void => {
        const windowSize = imageIndexReader ? stride : 1;
        for (let page = start; page < start + windowSize && page <= totalImagePages; page++) {
          directTriedSlots.add(page);
        }
      };
      const nextUntriedMissingPage = (): number | undefined => {
        for (let page = 1; page <= totalImagePages; page++) {
          if (!pageSlots.has(page) && !directTriedSlots.has(page)) return page;
        }
      };

      // Stop on a run of consecutive failures so a dead reader can't become a
      // request storm, while still tolerating a few scattered gaps: confirmed-dead
      // (404) windows bail fast, other failures bail after a longer run. Any
      // successful window resets both counters.
      const MAX_CONSECUTIVE_DEAD = 3;
      const MAX_CONSECUTIVE_FAILURES = 6;
      let consecutiveDeadWindows = 0;
      let consecutiveFailedWindows = 0;
      for (
        let missing = nextUntriedMissingPage();
        missing !== undefined && collectedCount() < totalImagePages;
        missing = nextUntriedMissingPage()
      ) {
        const page = fallbackStartFor(missing);
        markDirectTried(page);
        // Pin the rebuilt window to the page-1 host so the crawl stays on the
        // mirror (nextPageHref is often an absolute www.mangago.me URL).
        const fallbackUrl = pinWalkHost(
          buildReaderPageUrl(curlTemplate, loadedUrl, page, nextPageHref),
        );

        const outcome: ReaderFetchOutcome = { dead: false };
        const result = await decodeReaderPageImages(
          fallbackUrl,
          deobfChapterJs,
          keyHex,
          ivHex,
          true,
          outcome,
        );
        if (!result) {
          consecutiveFailedWindows++;
          if (outcome.dead) {
            consecutiveDeadWindows++;
          } else {
            // Transient miss, not a dead reader — don't trip the fast dead cap.
            consecutiveDeadWindows = 0;
          }
          if (consecutiveDeadWindows >= MAX_CONSECUTIVE_DEAD) {
            break;
          }
          if (consecutiveFailedWindows >= MAX_CONSECUTIVE_FAILURES) {
            break;
          }
          continue;
        }
        consecutiveDeadWindows = 0;
        consecutiveFailedWindows = 0;

        visitedPaths.add(pathnameKey(result.url));
        const currentPage =
          extractCurrentReaderPage(result.html) ?? readerPagePosition(result.url) ?? page;
        if (result.images.length >= totalImagePages) {
          addImagesAt(1, result.images, true);
        } else if (allowWindowFallback || currentPage === page) {
          addImagesAt(currentPage, result.images);
        }
      }
    }

    if (totalImagePages > 0) complete = collectedCount() >= totalImagePages;

    rawImages =
      totalImagePages > 0
        ? Array.from(
            { length: totalImagePages },
            (_, index) => pageSlots.get(index + 1) ?? "",
          ).filter(Boolean)
        : [...pageSlots.entries()].sort(([a], [b]) => a - b).map(([, url]) => url);
  }

  // A partial multimode result is still returned (not thrown) so the reader opens
  // with every window Mangago served. It isn't cached below, so reopening retries
  // the missing windows.
  const pages = rawImages.map((url) => annotateImageUrl(url, deobfChapterJs, cols));

  // Only cache a result we believe is complete, so a partial/rate-limited run
  // is never frozen in the cache. Single-page is always complete; multimode is
  // complete only if every expected page slot was filled, including by fallback.
  if (pages.length > 0 && complete) {
    mangagoPageUrlsCache.set(chapterUrl, pages);
  }

  return pages;
}
