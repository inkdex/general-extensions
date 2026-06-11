/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { type ChapterItem, DOMAIN } from "../models";

// Cloudflare binds cf_clearance to a User-Agent. executeInWebView runs in a
// WKWebView whose UA (a macOS-Safari string) differs from Application's default
// (iPad) and can't be overridden (no UA option on executeInWebView), so the
// WebView's own loads — main.js, the API XHRs — would carry an identity the
// clearance doesn't cover and Cloudflare blocks them. Since we can't change the
// WebView UA, we adopt it everywhere: read it once, then sign native requests +
// the CF challenge with it (see network.ts) so the clearance is issued for, and
// matches, the UA the WebView actually uses.
//
// Cached in memory only — not persisted. If a future iOS/Paperback update
// changes the WebView UA, the next app session re-reads it and self-heals,
// rather than reusing a stale UA that no longer matches the issued clearance.
let cachedWebViewUA: string | undefined;
let webViewUAPromise: Promise<string> | undefined;

async function queryWebViewUserAgent(): Promise<string> {
  try {
    // A bare document with no subresources needs no network and no clearance,
    // so this is safe to run before any cf_clearance is established.
    const raw = await Application.executeInWebView({
      source: {
        html: "<html><head></head><body></body></html>",
        baseUrl: `${DOMAIN}/`,
        loadCSS: false,
        loadImages: false,
      },
      inject: "return navigator.userAgent",
      storage: { cookies: [] },
    });
    if (typeof raw.result === "string" && raw.result) {
      cachedWebViewUA = raw.result;
      return raw.result;
    }
  } catch (error) {
    console.log(
      `[Comix] WebView UA query failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  // Fall back to the app UA if the probe fails (keeps native requests working).
  return Application.getDefaultUserAgent();
}

export function getWebViewUserAgent(): Promise<string> {
  if (cachedWebViewUA) return Promise.resolve(cachedWebViewUA);
  if (!webViewUAPromise) webViewUAPromise = queryWebViewUserAgent();
  return webViewUAPromise;
}

// Loads a Comix page in a WebView and lets the site's own JS run end-to-end:
// the bundle signs API requests and decrypts `{e:"blob"}` responses internally,
// then calls JSON.parse on the plaintext. A Proxy on JSON.parse captures that
// plaintext, so we never need to probe the rotating signer or reimplement the
// decryption. The WebView runs under its own UA, which cf_clearance is bound to
// (see getWebViewUserAgent), so the page's own loads + API calls pass Cloudflare.
async function runProxiedWebView<T>(
  pageUrl: string,
  bootstrap: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<T> {
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);
  const userAgent = await getWebViewUserAgent();
  const [, buffer] = await Application.scheduleRequest({ url: pageUrl, method: "GET" });
  const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

  // Belt-and-braces: also push the UA onto in-page XHR/fetch + a referer. (Most
  // engines ignore a JS-set User-Agent, but it's harmless and the referer helps.)
  const uaShim = `
    (function () {
      var UA = ${JSON.stringify(userAgent)};
      var REFERER = ${JSON.stringify(pageUrl)};
      var origSetReq = XMLHttpRequest.prototype.setRequestHeader;
      var origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function () {
        try {
          origSetReq.call(this, "User-Agent", UA);
        } catch {}
        try {
          origSetReq.call(this, "Referer", REFERER);
        } catch {}
        return origSend.apply(this, arguments);
      };
      var origFetch = window.fetch;
      window.fetch = function (input, init) {
        init = init || {};
        var h = new Headers((init && init.headers) || (input && input.headers) || {});
        h.set("User-Agent", UA);
        h.set("Referer", REFERER);
        init.headers = h;
        return origFetch.call(this, input, init);
      };
    })();
  `;
  $("head").prepend(`<script>${uaShim}${bootstrap}</script>`);

  const raw = await Application.executeInWebView({
    source: { html: $.html(), baseUrl: pageUrl, loadCSS: false, loadImages: false },
    inject: `return window.__comixResult__`,
    storage: { cookies },
  });

  if (raw.result === undefined || raw.result === null) {
    throw new Error("Comix WebView returned no result");
  }
  return raw.result as T;
}

// The SPA fetches chapters on mount and on Next-button click. Capture the
// decrypted JSON for each fetch via JSON.parse, then drive pagination by
// clicking the Next button until meta.lastPage is reached. Chapter requests
// are rewritten to limit=100 before they fire, so most titles resolve in one
// or two fetches instead of one per default-sized page; if the site renames
// the param the regex stops matching and we just paginate at the default.
export async function chapterListViaWebView(
  mangaId: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<ChapterItem[]> {
  const bootstrap = `
    (function () {
      function rewriteUrl(url) {
        if (typeof url === "string" && url.indexOf("/chapters") !== -1 && /[?&]limit=\\d+/.test(url))
          return url.replace(/([?&]limit=)\\d+/, function (_m, p1) { return p1 + "100"; });
        return url;
      }
      var origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (method, url) {
        arguments[1] = rewriteUrl(url);
        return origOpen.apply(this, arguments);
      };
      var origFetch = window.fetch;
      window.fetch = function (input, init) {
        if (typeof input === "string") input = rewriteUrl(input);
        else if (input && typeof input.url === "string")
          input = new Request(rewriteUrl(input.url), input);
        return origFetch.call(this, input, init);
      };
      var items = [];
      var seenPages = new Set();
      var totalPages = null;
      var submitted = false;
      var doneResolve;
      window.__comixResult__ = new Promise(function (r) {
        doneResolve = r;
      });
      function submit() {
        if (submitted) return;
        submitted = true;
        doneResolve(items);
      }
      var idleTimer;
      function armIdle() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(submit, 20000);
      }
      armIdle();
      function gotoNext() {
        var tries = 0;
        var iv = setInterval(function () {
          var btn = document.querySelector(".mchap-foot button[aria-label*=Next]");
          if (btn && !btn.disabled) {
            btn.click();
            clearInterval(iv);
          } else if (++tries > 50) {
            clearInterval(iv);
            submit();
          }
        }, 100);
      }
      var orig = JSON.parse;
      JSON.parse = new Proxy(orig, {
        apply: function (t, a, args) {
          var parsed = Reflect.apply(t, a, args);
          try {
            if (
              !submitted &&
              parsed &&
              parsed.result &&
              Array.isArray(parsed.result.items) &&
              parsed.result.items[0] &&
              parsed.result.items[0].id !== undefined &&
              parsed.result.items[0].mangaId !== undefined
            ) {
              var meta = parsed.result.meta || parsed.result.pagination;
              var page = (meta && meta.page) || 1;
              if (!seenPages.has(page)) {
                seenPages.add(page);
                for (var i = 0; i < parsed.result.items.length; i++) items.push(parsed.result.items[i]);
                if (totalPages === null && meta && typeof meta.lastPage === "number")
                  totalPages = meta.lastPage;
                if (totalPages !== null && page < totalPages) {
                  armIdle();
                  gotoNext();
                } else submit();
              }
            }
          } catch {}
          return parsed;
        },
      });
    })();
  `;
  return runProxiedWebView<ChapterItem[]>(
    `${DOMAIN}/title/${mangaId}`,
    bootstrap,
    cookieInterceptor,
  );
}

export async function pageListViaWebView(
  chapterPagePath: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
  const bootstrap = `
    (function () {
      var doneResolve;
      window.__comixResult__ = new Promise(function (r) {
        doneResolve = r;
      });
      var orig = JSON.parse;
      JSON.parse = new Proxy(orig, {
        apply: function (t, a, args) {
          var parsed = Reflect.apply(t, a, args);
          try {
            if (parsed && parsed.result && parsed.result.pages) doneResolve(args[0]);
          } catch {}
          return parsed;
        },
      });
      setTimeout(function () {
        doneResolve("");
      }, 20000);
    })();
  `;
  const payload = await runProxiedWebView<string>(
    `${DOMAIN}${chapterPagePath}`,
    bootstrap,
    cookieInterceptor,
  );
  if (!payload) throw new Error("Comix pageListViaWebView: timed out waiting for pages JSON");
  return payload;
}
