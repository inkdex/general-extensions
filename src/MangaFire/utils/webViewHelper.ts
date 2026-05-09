/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";
import * as cheerio from "cheerio";

import { DOMAIN, VRF_CHAPTER_CACHE_KEY, VRF_SEARCH_CACHE_KEY } from "../models";
import { cacheGet, cacheSet } from "./cache";

interface CaptureOptions {
  triggerUrl: string;
  matcher: string;
  trigger?: string;
  cookieInterceptor: CookieStorageInterceptor;
  timeoutMs?: number;
}

async function captureVrfUrl(opts: CaptureOptions): Promise<string> {
  const { triggerUrl, matcher, trigger = "", cookieInterceptor, timeoutMs = 15000 } = opts;

  const [response, buffer] = await Application.scheduleRequest({
    url: triggerUrl,
    method: "GET",
  });

  if (response.status >= 400) {
    throw new Error(`Failed to fetch ${triggerUrl}: HTTP ${response.status}`);
  }

  let html = Application.arrayBufferToUTF8String(buffer);
  html = html.replace(/(["'])\/\/([a-zA-Z0-9.-]+)/g, "$1https://$2");

  const hookSource = `
    (function() {
      const re = new RegExp(${JSON.stringify(matcher)});
      let resolveFn, rejectFn;
      window.__vrfCapture = new Promise(function(resolve, reject) {
        resolveFn = resolve;
        rejectFn = reject;
      });
      const timer = setTimeout(function() {
        rejectFn(new Error("vrf capture timeout"));
      }, ${timeoutMs});
      function check(url) {
        if (typeof url === "string" && re.test(url)) {
          clearTimeout(timer);
          resolveFn(url);
          return true;
        }
        return false;
      }
      const origOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        check(url);
        return origOpen.apply(this, arguments);
      };
      if (typeof window.fetch === "function") {
        const origFetch = window.fetch;
        window.fetch = function(input, init) {
          const u = typeof input === "string" ? input : (input && input.url) || "";
          check(u);
          return origFetch.apply(this, arguments);
        };
      }
    })();
  `;

  const $ = cheerio.load(html);
  if ($("head").length === 0) $("html").prepend("<head></head>");
  $("head").prepend(`<script>${hookSource}</script>`);
  html = $.html();

  const cookies = cookieInterceptor.cookiesForUrl(triggerUrl);

  const inject = `
    ${trigger}
    return window.__vrfCapture;
  `;

  const result = await Application.executeInWebView({
    source: {
      html,
      baseUrl: `${DOMAIN}/`,
      loadCSS: false,
      loadImages: false,
    },
    inject,
    storage: { cookies },
  });

  if (typeof result.result !== "string") {
    throw new Error(`Unexpected vrf capture result: ${JSON.stringify(result.result)}`);
  }

  return result.result;
}

export async function getSearchVrfUrl(
  query: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
  const cached = cacheGet(VRF_SEARCH_CACHE_KEY, query);
  if (cached) return cached;

  const trigger = `
    $(function() {
      setInterval(() => {
        $(".search-inner input[name=keyword]").val(${JSON.stringify(query)}).trigger("keyup");
      }, 1000);
    });
  `;

  const captured = await captureVrfUrl({
    triggerUrl: `${DOMAIN}/home`,
    matcher: "ajax/manga/search\\?",
    trigger,
    cookieInterceptor,
  });

  cacheSet(VRF_SEARCH_CACHE_KEY, query, captured);
  return captured;
}

export async function getChapterPagesVrfUrl(
  chapterUrlPath: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
  const cached = cacheGet(VRF_CHAPTER_CACHE_KEY, chapterUrlPath);
  if (cached) return cached;

  const triggerUrl = chapterUrlPath.startsWith("http")
    ? chapterUrlPath
    : `${DOMAIN}${chapterUrlPath.startsWith("/") ? "" : "/"}${chapterUrlPath}`;

  const captured = await captureVrfUrl({
    triggerUrl,
    matcher: "/ajax/read/(chapter|volume)[/?]",
    cookieInterceptor,
  });

  cacheSet(VRF_CHAPTER_CACHE_KEY, chapterUrlPath, captured);
  return captured;
}

export function extractVrf(url: string): string {
  const match = url.match(/[?&]vrf=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}
