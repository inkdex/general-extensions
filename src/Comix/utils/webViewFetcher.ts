/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { DOMAIN } from "../models";

const CHAPTER_LIST_SCRIPT = `(function () {
  const rewriteUrl = function (url) {
    if (typeof url === 'string' && url.indexOf('/chapters') !== -1 && /[?&]limit=\\d+/.test(url)) {
      return url.replace(/([?&]limit=)\\d+/, '$1100');
    }
    return url;
  };
  const origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    arguments[1] = rewriteUrl(url);
    return origXHROpen.apply(this, arguments);
  };
  const origFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string') input = rewriteUrl(input);
    else if (input && typeof input.url === 'string') {
      var u = rewriteUrl(input.url);
      if (u !== input.url) input = new Request(u, input);
    }
    return origFetch.call(this, input, init);
  };
  const seen = new Set();
  const payloads = [];
  var resolveAll, rejectAll;
  window.__chapterListResult__ = new Promise(function (res, rej) {
    resolveAll = res;
    rejectAll = rej;
  });
  var timer = setTimeout(function () {
    if (payloads.length > 0) resolveAll(payloads);
    else rejectAll(new Error('Timed out waiting for chapter list'));
  }, 30000);
  const origParse = JSON.parse;
  JSON.parse = new Proxy(origParse, {
    apply: function (t, a, args) {
      var parsed = Reflect.apply(t, a, args);
      try {
        if (
          parsed && parsed.result &&
          Array.isArray(parsed.result.items) &&
          parsed.result.items.length > 0 &&
          parsed.result.items[0] &&
          parsed.result.items[0].id !== undefined &&
          parsed.result.items[0].mangaId !== undefined
        ) {
          var meta = parsed.result.meta || parsed.result.pagination;
          var page = (meta && meta.page) || 1;
          if (!seen.has(page)) {
            seen.add(page);
            payloads.push(args[0]);
            var hasNext = !!(meta && meta.hasNext);
            if (!hasNext) {
              clearTimeout(timer);
              resolveAll(payloads);
            } else {
              var tries = 0;
              var iv = setInterval(function () {
                var btn = document.querySelector('.mchap-foot button[aria-label*=Next]');
                if (btn && !btn.disabled) {
                  btn.click();
                  clearInterval(iv);
                } else if (++tries > 50) {
                  clearInterval(iv);
                }
              }, 100);
            }
          }
        }
      } catch (e) {
      }
      return parsed;
    }
  });
})();`;

const PAGE_LIST_SCRIPT = `(function () {
  var resolve, reject;
  window.__pageListResult__ = new Promise(function (res, rej) {
    resolve = res;
    reject = rej;
  });
  var timer = setTimeout(function () {
    reject(new Error('Timed out waiting for page list'));
  }, 30000);
  const origParse = JSON.parse;
  JSON.parse = new Proxy(origParse, {
    apply: function (t, a, args) {
      var parsed = Reflect.apply(t, a, args);
      try {
        if (parsed && parsed.result && parsed.result.pages) {
          clearTimeout(timer);
          resolve(args[0]);
        }
      } catch (e) {
      }
      return parsed;
    }
  });
})();`;

function prependScript(html: string, script: string): string {
  const $ = cheerio.load(html);
  $("head").prepend(`<script>${script}</script>`);
  return $.html();
}

/**
 * Loads the manga title page and captures chapter list data by intercepting
 * the site's own JSON.parse calls. Patches XHR/fetch to request limit=100 and
 * handles pagination by clicking the "Next" button in the chapter list widget.
 */
export async function chapterListViaWebView(
  mangaId: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string[]> {
  const mangaUrl = `${DOMAIN}/title/${mangaId}`;
  console.log(mangaUrl);
  const [, buffer] = await Application.scheduleRequest({ url: mangaUrl, method: "GET" });
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);

  const raw = await Application.executeInWebView({
    source: {
      html: prependScript(Application.arrayBufferToUTF8String(buffer), CHAPTER_LIST_SCRIPT),
      baseUrl: mangaUrl,
      loadCSS: false,
      loadImages: false,
    },
    inject: `return (async () => {
  try {
    var payloads = await window.__chapterListResult__;
    return JSON.stringify({ ok: true, payloads: payloads });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e && e.message || e) });
  }
})()`,
    storage: { cookies },
  });

  const out = parseWebViewResult<{ ok: boolean; payloads?: string[]; error?: string }>(
    raw.result,
    "chapter list",
  );
  if (!out.ok || !out.payloads) {
    throw new Error(`Comix chapter list failed: ${out.error ?? "unknown"}`);
  }
  return out.payloads;
}

/**
 * Loads the chapter reading page and captures page list data by intercepting
 * the site's own JSON.parse calls.
 */
export async function pageListViaWebView(
  chapterHid: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
  const chapterUrl = `${DOMAIN}/chapter/${chapterHid}`;
  console.log(chapterUrl);
  const [, buffer] = await Application.scheduleRequest({ url: chapterUrl, method: "GET" });
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);

  const raw = await Application.executeInWebView({
    source: {
      html: prependScript(Application.arrayBufferToUTF8String(buffer), PAGE_LIST_SCRIPT),
      baseUrl: chapterUrl,
      loadCSS: false,
      loadImages: false,
    },
    inject: `return (async () => {
  try {
    var payload = await window.__pageListResult__;
    return JSON.stringify({ ok: true, payload: payload });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e && e.message || e) });
  }
})()`,
    storage: { cookies },
  });

  const out = parseWebViewResult<{ ok: boolean; payload?: string; error?: string }>(
    raw.result,
    "page list",
  );
  if (!out.ok || !out.payload) {
    throw new Error(`Comix page list failed: ${out.error ?? "unknown"}`);
  }
  return out.payload;
}

function parseWebViewResult<R>(raw: unknown, label: string): R {
  if (typeof raw !== "string") {
    throw new Error(`Comix ${label} returned non-string: ${JSON.stringify(raw)}`);
  }
  try {
    return JSON.parse(raw) as R;
  } catch {
    throw new Error(`Comix ${label} returned unparsable: ${raw.slice(0, 500)}`);
  }
}
