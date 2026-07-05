/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { DOMAIN, type PagesData } from "../models";

// Loads the chapter reader page in a WebView and lets the site's own JS fetch
// the pages. A Proxy on JSON.parse captures the `chapterPages` payload the
// moment the site parses it — the same technique the reader itself uses — so
// pages resolve even when the direct GraphQL query is unavailable, all without
// any Android-only APIs.
const BOOTSTRAP = `
  (function () {
    var doneResolve;
    window.__allMangaResult__ = new Promise(function (r) { doneResolve = r; });
    var settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      doneResolve(value);
    }
    var orig = JSON.parse;
    JSON.parse = new Proxy(orig, {
      apply: function (target, thisArg, args) {
        var parsed = Reflect.apply(target, thisArg, args);
        try {
          if (parsed && (parsed.chapterPages || (parsed.data && parsed.data.chapterPages))) {
            finish(args[0]);
          }
        } catch (e) {}
        return parsed;
      },
    });
    setTimeout(function () { finish(""); }, 25000);
  })();
`;

export async function pageListViaWebView(
  mangaId: string,
  chapterNum: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<PagesData | undefined> {
  const readerUrl = `${DOMAIN}/manga/${mangaId}/chapter-${chapterNum}-sub`;
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);
  const userAgent = await Application.getDefaultUserAgent();

  const [, buffer] = await Application.scheduleRequest({ url: readerUrl, method: "GET" });
  const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));
  $("head").prepend(`<script>${BOOTSTRAP}</script>`);

  const raw = await Application.executeInWebView({
    source: { html: $.html(), baseUrl: readerUrl, loadCSS: false, loadImages: false, userAgent },
    inject: `return window.__allMangaResult__`,
    storage: { cookies },
  });

  if (typeof raw.result !== "string" || raw.result.length === 0) {
    return undefined;
  }

  return parseWebViewPayload(raw.result);
}

// The captured string is the JSON the reader parsed; `chapterPages` may sit at
// the top level or under a GraphQL `data` envelope.
function parseWebViewPayload(payload: string): PagesData | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return undefined;
  }

  const root = parsed as { chapterPages?: unknown; data?: { chapterPages?: unknown } };
  const chapterPages = root.chapterPages ?? root.data?.chapterPages;
  if (!chapterPages) return undefined;

  return { chapterPages: chapterPages as PagesData["chapterPages"] };
}
