/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { type ChapterItem, DOMAIN } from "../models";

// Paperback's WebView in loadHTMLString mode fires `error` (no `load`) on
// every <script src> and <link href> in the document — subresources can't
// be fetched by the HTML parser. So the bundle and every chunk it
// statically imports must be inlined server-side. Each chunk is base64-
// baked into a data: URL and the import specifier rewritten.
// Cache is module-level so the 5-chunk static-import graph is fetched once
// per app session, not per `chapterListViaWebView` / `pageListViaWebView`
// call. Bundle URLs are hash-suffixed (e.g. `main-tffn2n-Bxupx-A1.js`), so
// a deploy produces a fresh URL → cache miss → fresh fetch automatically.
const moduleCache = new Map<string, string>();

async function inlineModuleTree(url: string, cache: Map<string, string>): Promise<string> {
  const baseUrl = url.substring(0, url.lastIndexOf("/") + 1);
  const [, buf] = await Application.scheduleRequest({ url, method: "GET" });
  let body = Application.arrayBufferToUTF8String(buf);
  const re = /(from|import)(\s*)["'](\.\/[^"']+)["']/g;
  const work: Array<{ full: string; rel: string }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) work.push({ full: m[0], rel: m[3] });
  for (const { full, rel } of work) {
    const childUrl = baseUrl + rel.slice(2);
    let dataUrl = cache.get(childUrl);
    if (!dataUrl) {
      const childBody = await inlineModuleTree(childUrl, cache);
      const b64 = Application.base64Encode(childBody) as string;
      dataUrl = `data:application/javascript;base64,${b64}`;
      cache.set(childUrl, dataUrl);
    }
    body = body.split(full).join(full.replace(rel, dataUrl));
  }
  return body;
}

// Loads a Comix page in a WebView and lets the site's own JS run end-to-end:
// the bundle signs API requests and decrypts `{e:"blob"}` envelopes
// internally, then calls JSON.parse on the plaintext. A Proxy on JSON.parse
// captures that plaintext, so we never need to probe the rotating signer or
// reimplement the decryption. WKWebView's default UA (Macintosh) differs
// from Paperback's (iPhone) — cf_clearance is issued against Paperback's
// UA, so XHR/fetch are shimmed to send that UA, otherwise CF invalidates
// the cookie and every in-WebView API call gets the challenge page.
async function runProxiedWebView<T>(
  pageUrl: string,
  bootstrap: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<T> {
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);
  const userAgent = await Application.getDefaultUserAgent();
  const [, buffer] = await Application.scheduleRequest({ url: pageUrl, method: "GET" });
  const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

  for (const el of $('script[type="module"][src]').toArray()) {
    const src = $(el).attr("src");
    if (!src) continue;
    const absUrl = src.startsWith("http")
      ? src
      : `${DOMAIN}${src.startsWith("/") ? "" : "/"}${src}`;
    const body = await inlineModuleTree(absUrl, moduleCache);
    $(el).removeAttr("src").text(body);
  }

  const uaShim = `
    (function () {
      var UA = ${JSON.stringify(userAgent)};
      var origSetReq = XMLHttpRequest.prototype.setRequestHeader;
      var origSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function () {
        try { origSetReq.call(this, "User-Agent", UA); } catch (e) {}
        return origSend.apply(this, arguments);
      };
      var origFetch = window.fetch;
      window.fetch = function (input, init) {
        init = init || {};
        var h = new Headers((init && init.headers) || (input && input.headers) || {});
        h.set("User-Agent", UA);
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

export async function chapterListViaWebView(
  mangaId: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<ChapterItem[]> {
  // The SPA fetches chapters on mount and on Next-button click. Capture the
  // decrypted JSON for each fetch via JSON.parse, then drive pagination by
  // clicking the Next button until meta.lastPage is reached.
  const bootstrap = `
    (function () {
      var items = [];
      var seenPages = new Set();
      var totalPages = null;
      var submitted = false;
      var doneResolve;
      window.__comixResult__ = new Promise(function (r) { doneResolve = r; });
      function submit() {
        if (submitted) return;
        submitted = true;
        doneResolve(items);
      }
      function gotoNext() {
        // The Next button is rendered by the SPA after the API response; our
        // JSON.parse hook fires synchronously in the same tick, before any
        // DOM update. Poll for it, give up after 5s.
        var tries = 0;
        var iv = setInterval(function () {
          var btn = document.querySelector(".mchap-foot button[aria-label*=Next]");
          if (btn && !btn.disabled) { btn.click(); clearInterval(iv); }
          else if (++tries > 50) { clearInterval(iv); submit(); }
        }, 100);
      }
      var orig = JSON.parse;
      JSON.parse = new Proxy(orig, {
        apply: function (t, a, args) {
          var parsed = Reflect.apply(t, a, args);
          try {
            if (
              !submitted && parsed && parsed.result &&
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
                if (totalPages === null && meta && typeof meta.lastPage === "number") totalPages = meta.lastPage;
                if (totalPages !== null && page < totalPages) gotoNext();
                else submit();
              }
            }
          } catch (e) {}
          return parsed;
        }
      });
      setTimeout(submit, 30000);
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
      window.__comixResult__ = new Promise(function (r) { doneResolve = r; });
      var orig = JSON.parse;
      JSON.parse = new Proxy(orig, {
        apply: function (t, a, args) {
          var parsed = Reflect.apply(t, a, args);
          try {
            if (parsed && parsed.result && parsed.result.pages) doneResolve(args[0]);
          } catch (e) {}
          return parsed;
        }
      });
      setTimeout(function () { doneResolve(""); }, 20000);
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
