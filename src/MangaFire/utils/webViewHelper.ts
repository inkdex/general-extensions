import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

const baseUrl = "https://mangafire.to";

const SEARCH_CACHE_KEY = "mangafire_search_vrf_cache";
const CHAPTER_CACHE_KEY = "mangafire_chapter_vrf_cache";
const CACHE_MAX_ENTRIES = 20;
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  value: string;
  expiresAt: number;
}

type Cache = Record<string, CacheEntry>;

function readCache(stateKey: string): Cache {
  return (Application.getState(stateKey) as Cache | undefined) ?? {};
}

function cacheGet(stateKey: string, key: string): string | undefined {
  const cache = readCache(stateKey);
  const entry = cache[key];
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    delete cache[key];
    Application.setState(cache, stateKey);
    return undefined;
  }
  return entry.value;
}

function cacheSet(stateKey: string, key: string, value: string): void {
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

interface CaptureOptions {
  triggerUrl: string;
  matcher: string;
  trigger?: string;
  cookieInterceptor: CookieStorageInterceptor;
  timeoutMs?: number;
}

async function captureVrfUrl(opts: CaptureOptions): Promise<string> {
  const { triggerUrl, matcher, trigger = "", cookieInterceptor, timeoutMs = 15000 } = opts;

  const [response, buffer] = await Application.scheduleRequest({
    url: triggerUrl,
    method: "GET",
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch ${triggerUrl}: HTTP ${response.status}`);
  }

  let html = Application.arrayBufferToUTF8String(buffer);
  html = html.replace(/(["'])\/\/([a-zA-Z0-9.-]+)/g, "$1https://$2");

  const hookSource = `
    (function() {
      const re = new RegExp(${JSON.stringify(matcher)});
      let resolveFn, rejectFn;
      window.__vrfCapture = new Promise(function(resolve, reject) {
        resolveFn = resolve;
        rejectFn = reject;
      });
      const timer = setTimeout(function() {
        rejectFn(new Error("vrf capture timeout"));
      }, ${timeoutMs});
      function check(url) {
        if (typeof url === "string" && re.test(url)) {
          clearTimeout(timer);
          resolveFn(url);
          return true;
        }
        return false;
      }
      const origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        check(url);
        return origOpen.apply(this, arguments);
      };
      if (typeof window.fetch === "function") {
        const origFetch = window.fetch;
        window.fetch = function(input, init) {
          const u = typeof input === "string" ? input : (input && input.url) || "";
          check(u);
          return origFetch.apply(this, arguments);
        };
      }
    })();
  `;

  const $ = cheerio.load(html);
  if ($("head").length === 0) $("html").prepend("<head></head>");
  $("head").prepend(`<script>${hookSource}</script>`);
  html = $.html();

  const cookies = cookieInterceptor.cookiesForUrl(triggerUrl);

  const inject = `
    ${trigger}
    return window.__vrfCapture;
  `;

  const result = await Application.executeInWebView({
    source: {
      html,
      baseUrl: `${baseUrl}/`,
      loadCSS: false,
      loadImages: false,
    },
    inject,
    storage: { cookies },
  });

  if (typeof result.result !== "string") {
    throw new Error(`Unexpected vrf capture result: ${JSON.stringify(result.result)}`);
  }

  return result.result;
}

export async function captureSearchVrf(
  query: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
  const cached = cacheGet(SEARCH_CACHE_KEY, query);
  if (cached) return cached;

  const trigger = `
    $(function() {
      setInterval(() => {
        $(".search-inner input[name=keyword]").val(${JSON.stringify(query)}).trigger("keyup");
      }, 1000);
    });
  `;

  const captured = await captureVrfUrl({
    triggerUrl: `${baseUrl}/home`,
    matcher: "ajax/manga/search\\?",
    trigger,
    cookieInterceptor,
  });

  cacheSet(SEARCH_CACHE_KEY, query, captured);
  return captured;
}

export async function captureChapterPagesVrf(
  chapterUrlPath: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
  const cached = cacheGet(CHAPTER_CACHE_KEY, chapterUrlPath);
  if (cached) return cached;

  const triggerUrl = chapterUrlPath.startsWith("http")
    ? chapterUrlPath
    : `${baseUrl}${chapterUrlPath.startsWith("/") ? "" : "/"}${chapterUrlPath}`;

  const captured = await captureVrfUrl({
    triggerUrl,
    matcher: "/ajax/read/(chapter|volume)[/?]",
    cookieInterceptor,
  });

  cacheSet(CHAPTER_CACHE_KEY, chapterUrlPath, captured);
  return captured;
}

export function extractVrf(url: string): string {
  const match = url.match(/[?&]vrf=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
