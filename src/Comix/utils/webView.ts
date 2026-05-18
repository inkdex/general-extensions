/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { DOMAIN } from "../models";

/**
 * Returns the signed `_=` token for a Comix API path.
 *
 * Approach: the bundle's signer (`bi.D`) is module-scoped in an ES module and
 * is no longer reachable from `globalThis` (the old `vmX_<hex>` namespace is
 * gone). Instead of probing for it, we load `pageUrl` (a real page whose own
 * JS fires a signed request to `pathOnly`) in a WebView and hook
 * `fetch` / `XMLHttpRequest.open` to capture the `_=` value off that URL.
 *
 * The bundle's interceptor signs by path only (`Ni` strips the query string),
 * so the captured token is reusable for any query on the same path. Callers
 * should cache it.
 */
export async function getVmToken(
  pathOnly: string,
  pageUrl: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
  const [, buffer] = await Application.scheduleRequest({ url: pageUrl, method: "GET" });
  const rawHtml = Application.arrayBufferToUTF8String(buffer);

  // Prepended to <head> so it runs before any site script registers the axios
  // interceptors. Captured tokens are stored on `window.__comixTokens__`
  // keyed by the API path (after stripping `/api/v1`).
  const hookScript = `
    (function () {
      window.__comixTokens__ = window.__comixTokens__ || {};
      function grab(rawUrl) {
        if (typeof rawUrl !== "string") return;
        try {
          var u = new URL(rawUrl, window.location.origin);
          var t = u.searchParams.get("_");
          if (!t) return;
          var p = u.pathname.replace(/^\\/api\\/v1/, "");
          if (!window.__comixTokens__[p]) window.__comixTokens__[p] = t;
        } catch (e) {}
      }
      var origFetch = window.fetch;
      window.fetch = function (input, init) {
        try { grab(typeof input === "string" ? input : input && input.url); } catch (e) {}
        return origFetch.apply(this, arguments);
      };
      var origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (m, u) {
        try { grab(u); } catch (e) {}
        return origOpen.apply(this, arguments);
      };
    })();
  `;

  const $ = cheerio.load(rawHtml);
  $("head").prepend(`<script>${hookScript}</script>`);
  const html = $.html();

  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);

  const raw = await Application.executeInWebView({
    source: {
      html,
      baseUrl: pageUrl,
      loadCSS: false,
      loadImages: false,
    },
    inject: `return (async () => {
      try {
        const path = ${JSON.stringify(pathOnly)};
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
          const t = window.__comixTokens__ && window.__comixTokens__[path];
          if (typeof t === "string" && t.length > 0) {
            return JSON.stringify({ ok: true, token: t });
          }
          await new Promise(r => setTimeout(r, 100));
        }
        const captured = Object.keys(window.__comixTokens__ || {});
        return JSON.stringify({ ok: false, error: "timeout; captured paths: " + JSON.stringify(captured) });
      } catch (e) {
        return JSON.stringify({ ok: false, error: "exception: " + (e && e.message || e) });
      }
    })()`,
    storage: { cookies },
  });

  if (typeof raw.result !== "string") {
    throw new Error(`Comix getVmToken returned non-string: ${JSON.stringify(raw.result)}`);
  }
  const out = JSON.parse(raw.result) as { ok: boolean; token?: string; error?: string };
  if (!out.ok || !out.token) throw new Error(`Comix getVmToken failed: ${out.error ?? "unknown"}`);
  return out.token;
}
