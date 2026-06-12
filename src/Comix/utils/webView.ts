/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { type ChapterItem, DOMAIN } from "../models";

// Loads a Comix page in a WebView and lets the site's own JS run end-to-end:
// the bundle signs API requests and decrypts `{e:"blob"}` responses internally,
// then calls JSON.parse on the plaintext. A Proxy on JSON.parse captures that
// plaintext, so we never need to probe the rotating signer or reimplement the
// decryption. The WebView runs under the app's default UA (source.userAgent),
// the same UA cf_clearance is bound to, so the page's own loads + same-origin
// API XHRs all pass Cloudflare.
async function runProxiedWebView<T>(
  pageUrl: string,
  bootstrap: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<T> {
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);
  const userAgent = await Application.getDefaultUserAgent();
  const [, buffer] = await Application.scheduleRequest({ url: pageUrl, method: "GET" });
  const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

  $("head").prepend(`<script>${bootstrap}</script>`);

  const raw = await Application.executeInWebView({
    source: { html: $.html(), baseUrl: pageUrl, loadCSS: false, loadImages: false, userAgent },
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
