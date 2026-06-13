/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { type ChapterItem, type ResultManga, DOMAIN } from "../models";

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

// Capture each chapter fetch's decrypted JSON via JSON.parse and paginate by
// clicking Next until meta.lastPage. Don't rewrite the request URL — it carries
// a per-request `_=` signature, so changing limit/params returns 403.
export async function chapterListViaWebView(
  mangaId: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<ChapterItem[]> {
  const bootstrap = `
    (function () {
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

// `/browse` serves an empty shell and loads its list via an encrypted XHR, so
// run the bundle and capture the decrypted `{result:{items,meta}}` off
// JSON.parse. `&page=N` in the URL selects the page; one capture per call.
export async function browseViaWebView(
  browseUrl: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<ResultManga> {
  const bootstrap = `
    (function () {
      var doneResolve;
      window.__comixResult__ = new Promise(function (r) {
        doneResolve = r;
      });
      var done = false;
      function finish(val) {
        if (done) return;
        done = true;
        doneResolve(val);
      }
      var orig = JSON.parse;
      JSON.parse = new Proxy(orig, {
        apply: function (t, a, args) {
          var parsed = Reflect.apply(t, a, args);
          try {
            var result = parsed && parsed.result;
            if (
              result &&
              Array.isArray(result.items) &&
              result.items.length > 0 &&
              result.items[0] &&
              result.items[0].hid !== undefined
            ) {
              finish({ items: result.items, meta: result.meta || result.pagination || null });
            }
          } catch {}
          return parsed;
        },
      });
      setTimeout(function () {
        finish(null);
      }, 20000);
    })();
  `;
  const result = await runProxiedWebView<ResultManga | null>(
    browseUrl,
    bootstrap,
    cookieInterceptor,
  );
  if (!result) throw new Error("Comix browseViaWebView: timed out waiting for browse JSON");
  return result;
}
