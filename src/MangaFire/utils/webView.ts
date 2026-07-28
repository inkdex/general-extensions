/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { URL, type CookieStorageInterceptor } from "@paperback/types";

import { getLanguages } from "../forms/settings";
import { CHAPTER_PAGE_LIMIT, DOMAIN } from "../models";
import { cacheGet, cacheSet } from "./cache";

const VRF_CACHE_KEY = "mangafire_vrf_cache";

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

let cachedHomeHtml: string | null = null;

async function getHomeHtml(): Promise<string> {
  if (cachedHomeHtml) return cachedHomeHtml;

  const pageUrl = `${DOMAIN}/home`;
  const [response, buffer] = await Application.scheduleRequest({ url: pageUrl, method: "GET" });
  if (response.status >= 400) {
    throw new Error(`Failed to fetch ${pageUrl}: HTTP ${response.status}`);
  }

  cachedHomeHtml = Application.arrayBufferToUTF8String(buffer).replace(
    /(["'])\/\/([a-zA-Z0-9.-]+)/g,
    "$1https://$2",
  );
  return cachedHomeHtml;
}

export async function getVrfUrl({
  triggerUrl,
  cookieInterceptor,
  apiPath,
  apiParams,
}: {
  triggerUrl: string;
  cookieInterceptor: CookieStorageInterceptor;
  apiPath?: string;
  apiParams?: Record<string, unknown>;
}): Promise<string> {
  const cached = cacheGet(VRF_CACHE_KEY, triggerUrl);
  if (cached) {
    return cached;
  }

  const computedParams = apiParams ?? new URL(triggerUrl).queryItems;

  const pageUrl = triggerUrl.startsWith("http") ? triggerUrl : `${DOMAIN}/home`;
  const html = await getHomeHtml();

  const targetMangaId = triggerUrl.match(/\/manga\/([^/?]+)/)?.[1];
  const selectedLanguages = getLanguages();
  const pageLimit = CHAPTER_PAGE_LIMIT;

  const hookSource = `
    (function () {
      window.__vrfCapture = new Promise((resolve) => {
        const capturedMap = {};
        let matchedUrl = null;

        function record(url) {
          if (!url.includes("vrf=")) return;
          capturedMap[url] = true;
          if (!matchedUrl && (!targetPath || url.includes(targetPath))) {
            matchedUrl = url;
          }
        }

        function finish() {
          resolve(
            JSON.stringify({
              matched: matchedUrl || "",
              all: Object.keys(capturedMap),
            }),
          );
        }

        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
          if (typeof url === "string" && url.includes("/api/")) {
            this._blocked = true;
            if (url.includes("vrf=")) record(url);
          }
          return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function () {
          if (this._blocked) return;
          return originalSend.apply(this, arguments);
        };

        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function (input, init) {
            const urlStr = typeof input === "string" ? input : input?.url;
            if (typeof urlStr === "string" && urlStr.includes("/api/")) {
              if (urlStr.includes("vrf=")) record(urlStr);
              return Promise.resolve(new Response(JSON.stringify({})));
            }
            return originalFetch.apply(this, arguments);
          };
        }

        const targetPath = ${JSON.stringify(apiPath || null)};
        const targetParams = ${JSON.stringify(computedParams || null)};
        const languages = ${JSON.stringify(selectedLanguages)};
        const limit = ${pageLimit};

        function triggerRequests(axios) {
          setTimeout(() => {
            if (targetPath) {
              axios.get(targetPath, { params: targetParams || {} });

              if (targetPath.match(/\\/titles\\/[^/]+$/)) {
                for (const lang of languages) {
                  axios.get(targetPath + "/chapters", {
                    params: { language: lang, sort: "number", order: "desc", page: 1, limit: limit },
                  });
                }
              }
            }
            setTimeout(finish, 100);
          }, 100);
        }

        // MangaFire creates multiple axios instances on load; only the one that
        // registers a request interceptor (the VRF-signing client) is useful here.
        // Hooking "interceptors" assignment alone isn't enough to tell them apart,
        // so also patch request.use to detect when a real interceptor lands.
        Object.defineProperty(Object.prototype, "interceptors", {
          configurable: true,
          get() {
            return this._interceptors;
          },
          set(val) {
            this._interceptors = val;
            const axiosInstance = this;
            if (axiosInstance?.get && axiosInstance?.post && val?.request?.use && !axiosInstance._vrfUsePatched) {
              axiosInstance._vrfUsePatched = true;
              const originalUse = val.request.use;
              val.request.use = function (...args) {
                const ret = originalUse.apply(val.request, args);
                if (!window.__siteAxios && val.request.handlers?.length > 0) {
                  window.__siteAxios = axiosInstance;
                  triggerRequests(axiosInstance);
                }
                return ret;
              };
            }
          },
        });

        setTimeout(finish, 3000); // hard cap in case the axios hook never fires
      });
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
    throw new Error(`VRF capture timed out generating signed URL for ${apiPath}`);
  }

  const matchedFullUrl = toFullUrl(payload.matched);

  cacheSet(VRF_CACHE_KEY, triggerUrl, matchedFullUrl);
  return matchedFullUrl;
}
