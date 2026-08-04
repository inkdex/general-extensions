/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { DOMAIN, type PagesData } from "../models";

// Match the parser pin, not its current iframe-realm implementation.
const parsePinnedParserKey = ($: cheerio.CheerioAPI): string | undefined => {
  const script = $("script:not([src])")
    .toArray()
    .map((element) => $(element).text())
    .find((text) => /defineProperty\(\s*window/.test(text) && /\bJSON\b/.test(text));
  if (script == undefined) return undefined;

  const target = /defineProperty\(\s*window\s*,\s*(["']?[A-Za-z0-9_$]+["']?)/.exec(script)?.[1];
  if (target == undefined) return undefined;
  if (/^["']/.test(target)) return target.slice(1, -1);

  // Otherwise the key is a variable, assembled just above the call.
  const assignment = new RegExp(`\\b${target}\\s*=\\s*([^;]+);`).exec(script)?.[1];
  const literals = assignment?.match(/["'][A-Za-z0-9_$]*["']/g);
  if (literals == undefined) return undefined;

  const key = literals.map((literal) => literal.slice(1, -1)).join("");
  return key.length > 0 ? key : undefined;
};

const buildBootstrap = (pinnedKey: string | undefined): string => {
  // Claiming the key first makes the page's own defineProperty throw, which its try/catch
  // swallows. Both flags have to stay false for that to happen.
  const pin =
    pinnedKey == undefined
      ? ""
      : `
    try {
      Object.defineProperty(window, ${JSON.stringify(pinnedKey)}, {
        value: captureParse,
        writable: false,
        configurable: false,
        enumerable: false,
      });
    } catch (e) {}`;

  return `
  (function () {
    var doneResolve;
    window.__allMangaResult__ = new Promise(function (r) { doneResolve = r; });
    var settled = false;
    function finish(value) {
      if (settled) return;
      settled = true;
      doneResolve(value);
    }
    function capture(parsed, raw) {
      try {
        if (parsed && (parsed.chapterPages || (parsed.data && parsed.data.chapterPages))) {
          finish(raw);
        }
      } catch (e) {}
    }
    var orig = JSON.parse;
    var captureParse = new Proxy(orig, {
      apply: function (target, thisArg, args) {
        var parsed = Reflect.apply(target, thisArg, args);
        capture(parsed, args[0]);
        return parsed;
      },
    });
    JSON.parse = captureParse;${pin}
    var origJson = Response.prototype.json;
    Response.prototype.json = function () {
      return origJson.call(this).then(function (parsed) {
        capture(parsed, JSON.stringify(parsed));
        return parsed;
      });
    };
    setTimeout(function () { finish(""); }, 25000);
  })();
`;
};

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
  $("head").prepend(`<script>${buildBootstrap(parsePinnedParserKey($))}</script>`);

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

// chapterPages may be top-level or nested under a GraphQL `data` envelope.
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
