/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";

import { getLanguages } from "../forms/settings";
import { CHAPTER_PAGE_LIMIT, DOMAIN } from "../models";
import { cacheGet, cacheSet } from "./cache";

const VRF_CACHE_KEY = "mangafire_vrf_cache";

interface CaptureOptions {
  triggerUrl: string;
  matcher: string;
  cookieInterceptor: CookieStorageInterceptor;
  apiPath?: string;
  apiParams?: Record<string, unknown>;
}

const toFullUrl = (url: string) =>
  url.startsWith("http") ? url : `${DOMAIN}${url.startsWith("/") ? "" : "/"}${url}`;

function cacheCapturedUrl(url: string, targetMangaId?: string): void {
  const fullUrl = toFullUrl(url);
  const hid = fullUrl.match(/\/titles\/([^/?]+)/)?.[1];
  if (!hid) return;

  const mangaId = targetMangaId ?? hid;

  if (fullUrl.includes("/chapters")) {
    const lang = fullUrl.match(/[?&]language=([^&]+)/)?.[1];
    const page = fullUrl.match(/[?&]page=([^&]+)/)?.[1] ?? "1";
    if (lang) {
      cacheSet(VRF_CACHE_KEY, `${DOMAIN}/manga/${mangaId}?lang=${lang}&page=${page}`, fullUrl);
    }
  } else {
    cacheSet(VRF_CACHE_KEY, `${DOMAIN}/manga/${mangaId}?type=details`, fullUrl);
  }
}

export async function getVrfUrl(opts: CaptureOptions): Promise<string> {
  const { triggerUrl, matcher, cookieInterceptor, apiPath, apiParams } = opts;

  const cached = cacheGet(VRF_CACHE_KEY, triggerUrl);
  if (cached) return cached;

  const pageUrl = triggerUrl.startsWith("http") ? triggerUrl : `${DOMAIN}/home`;
  const [response, buffer] = await Application.scheduleRequest({ url: pageUrl, method: "GET" });
  if (response.status >= 400) {
    throw new Error(`Failed to fetch ${pageUrl}: HTTP ${response.status}`);
  }

  const html = Application.arrayBufferToUTF8String(buffer).replace(
    /(["'])\/\/([a-zA-Z0-9.-]+)/g,
    "$1https://$2",
  );

  const targetMangaId = triggerUrl.match(/\/manga\/([^/?]+)/)?.[1];
  const selectedLanguages = getLanguages();
  const pageLimit = CHAPTER_PAGE_LIMIT;

  const hookSource = `
    (function () {
      let resolveFn;
      window.__vrfCapture = new Promise((resolve) => {
        resolveFn = resolve;
      });

      const capturedMap = {};
      const targetRegex = new RegExp(${JSON.stringify(matcher)});
      let matchedUrl = null;

      const innerTimer = setTimeout(() => {
        if (!matchedUrl) {
          resolveFn(JSON.stringify({ matched: "", all: Object.keys(capturedMap) }));
        }
      }, 10000);

      function checkUrl(url) {
        if (typeof url === "string" && url.includes("/api/")) {
          capturedMap[url] = true;
          if (targetRegex.test(url) && !matchedUrl) {
            matchedUrl = url;
            clearTimeout(innerTimer);
            setTimeout(() => {
              resolveFn(
                JSON.stringify({
                  matched: matchedUrl,
                  all: Object.keys(capturedMap),
                }),
              );
            }, 200);
          }
        }
      }

      Object.defineProperty(Object.prototype, "interceptors", {
        configurable: true,
        get() {
          return this._interceptors;
        },
        set(val) {
          this._interceptors = val;
          if (this?.get && this?.post) {
            window.__siteAxios = this;
          }
        },
      });

      const targetPath = ${JSON.stringify(apiPath || null)};
      const targetParams = ${JSON.stringify(apiParams || null)};
      const languages = ${JSON.stringify(selectedLanguages)};
      const limit = ${pageLimit};

      if (targetPath) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.__siteAxios) {
            clearInterval(interval);
            try {
              window.__siteAxios.get(targetPath, { params: targetParams || {} });
              if (targetPath.match(/\\/titles\\/[^/]+$/)) {
                for (const lang of languages) {
                  window.__siteAxios.get(targetPath + "/chapters", {
                    params: {
                      language: lang,
                      sort: "number",
                      order: "desc",
                      page: 1,
                      limit: limit,
                    },
                  });
                }
              }
            } catch (e) {}
          } else if (attempts > 100) {
            clearInterval(interval);
          }
        }, 50);
      }

      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        checkUrl(url);
        return originalOpen.apply(this, arguments);
      };

      if (window.fetch) {
        const originalFetch = window.fetch;
        window.fetch = function (input, init) {
          checkUrl(typeof input === "string" ? input : input?.url);
          return originalFetch.apply(this, arguments);
        };
      }
    })();
  `;

  const scriptTag = `<script>${hookSource}</script>`;
  const fullHtml = html.includes("<head>")
    ? html.replace("<head>", `<head>${scriptTag}`)
    : `${scriptTag}${html}`;

  const result = await Application.executeInWebView({
    source: {
      html: fullHtml,
      baseUrl: pageUrl,
      loadCSS: false,
      loadImages: false,
      userAgent: await Application.getDefaultUserAgent(),
    },
    inject: "return window.__vrfCapture;",
    storage: { cookies: cookieInterceptor.cookiesForUrl(pageUrl) },
    captureConsoleLog: false,
  });

  const rawResult = result.result;
  if (typeof rawResult !== "string") {
    throw new Error(`Unexpected vrf capture result: ${JSON.stringify(rawResult)}`);
  }

  let payload: { matched: string; all: string[] };
  try {
    payload = JSON.parse(rawResult);
  } catch {
    payload = { matched: rawResult, all: [rawResult] };
  }

  for (const rawUrl of payload.all ?? []) {
    cacheCapturedUrl(rawUrl, targetMangaId);
  }

  if (!payload.matched) {
    throw new Error(`VRF capture timed out matching ${matcher}`);
  }

  const matchedPath = payload.matched.startsWith("/") ? payload.matched : `/${payload.matched}`;
  const matchedFullUrl = payload.matched.startsWith("http")
    ? payload.matched
    : `${DOMAIN}${matchedPath}`;

  cacheSet(VRF_CACHE_KEY, triggerUrl, matchedFullUrl);
  return matchedFullUrl;
}
