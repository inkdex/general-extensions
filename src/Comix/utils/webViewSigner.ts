/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type Cookie, type CookieStorageInterceptor } from "@paperback/types";

import { DOMAIN, type ApiResponse } from "../models";
import { cacheGet, cacheSet } from "./cache";

const TOKEN_CACHE_KEY = "comix.signedToken.v1";
const SECURE_URL_CACHE_KEY = "comix.secureUrl.v1";

interface WebViewSource {
  html: string;
  baseUrl: string;
  loadCSS: boolean;
  loadImages: boolean;
}

/**
 * Fetches a protected Comix API path. fetch() from inside `executeInWebView`
 * is blocked (the loadHTMLString:baseURL: document has an opaque origin),
 * so the work is split:
 *
 *   1. Webview #1 — find the signer (`Qi`) and produce a token for the
 *      path. Cached per path so repeat calls skip this step.
 *   2. Outside — `Application.scheduleRequest` to /api/v1 with the token.
 *      Routes through MainInterceptor (cookies + CF + UA). Captures the
 *      `x-enc` response header.
 *   3. Webview #2 — find the axios installer, run its request interceptor
 *      (sets up per-request module state), then feed the encrypted body
 *      and `x-enc` header into the response interceptor. The decryptor
 *      reads `headers["x-enc"]` to derive its key.
 */
export async function apiViaWebView<T>(
  apiPath: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<ApiResponse<T>> {
  const pathOnly = apiPath.split("?")[0];
  const sep = apiPath.includes("?") ? "&" : "?";

  const secureUrl = await resolveSecureUrl();
  const [, homeBuf] = await Application.scheduleRequest({
    url: `${DOMAIN}/`,
    method: "GET",
  });
  const html = stripCspMeta(Application.arrayBufferToUTF8String(homeBuf));
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);
  const source: WebViewSource = {
    html,
    baseUrl: `${DOMAIN}/`,
    loadCSS: false,
    loadImages: false,
  };

  let token = cacheGet(TOKEN_CACHE_KEY, pathOnly);
  const usedCachedToken = !!token;
  if (!token) token = await signInWebView(source, cookies, secureUrl, pathOnly);

  let { response, encryptedText } = await fetchSigned(apiPath, sep, token);
  if (response.status >= 400 && usedCachedToken) {
    token = await signInWebView(source, cookies, secureUrl, pathOnly);
    ({ response, encryptedText } = await fetchSigned(apiPath, sep, token));
  }
  if (response.status >= 400) {
    throw new Error(`Comix API HTTP ${response.status} for ${apiPath}`);
  }
  cacheSet(TOKEN_CACHE_KEY, pathOnly, token);

  const envelope = parseJsonOrThrow(encryptedText);
  if (!isEncrypted(envelope)) {
    return envelope as ApiResponse<T>;
  }

  const headers = (response.headers ?? {}) as Record<string, string>;
  const xEnc = headers["x-enc"] ?? headers["X-Enc"] ?? headers["X-ENC"] ?? "";

  const decrypted = await decryptInWebView(
    source,
    cookies,
    secureUrl,
    encryptedText,
    apiPath,
    xEnc,
  );
  return JSON.parse(decrypted) as ApiResponse<T>;
}

async function fetchSigned(apiPath: string, sep: string, token: string) {
  const url = `${DOMAIN}/api/v1${apiPath}${sep}_=${encodeURIComponent(token)}`;
  const [response, buf] = await Application.scheduleRequest({ url, method: "GET" });
  return { response, encryptedText: Application.arrayBufferToUTF8String(buf) };
}

function parseJsonOrThrow(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Comix API returned non-JSON: ${text.slice(0, 200)}`);
  }
}

function isEncrypted(v: unknown): v is { e: string } {
  return !!v && typeof v === "object" && "e" in (v as Record<string, unknown>);
}

// HTTP-header CSP isn't carried into loadHTMLString, but a meta-equiv CSP
// would be — strip it defensively in case a future deploy adds one.
function stripCspMeta(html: string): string {
  return html.replace(
    /<meta[^>]+http-equiv=["']Content-Security-Policy(?:-Report-Only)?["'][^>]*>/gi,
    "",
  );
}

async function resolveSecureUrl(): Promise<string> {
  const cached = cacheGet(SECURE_URL_CACHE_KEY, "current");
  if (cached) return cached;

  const [, homeBuf] = await Application.scheduleRequest({
    url: `${DOMAIN}/`,
    method: "GET",
  });
  const homeHtml = Application.arrayBufferToUTF8String(homeBuf);
  const mainMatch = homeHtml.match(
    /<script[^>]+type="module"[^>]+src="(https?:\/\/[^"]+\/dist\/main-[^"]+\.js)"/,
  );
  if (!mainMatch) throw new Error("Comix: could not find main bundle URL on homepage");
  const mainUrl = mainMatch[1];

  const [, mainBuf] = await Application.scheduleRequest({ url: mainUrl, method: "GET" });
  const mainSrc = Application.arrayBufferToUTF8String(mainBuf);
  const secureMatch = mainSrc.match(/"((?:\.\/)?secure-[a-zA-Z0-9_-]+\.js)"/);
  if (!secureMatch) throw new Error("Comix: could not find secure chunk in main bundle");
  const secureRel = secureMatch[1].replace(/^\.\//, "");

  const distBase = mainUrl.replace(/\/[^/]+$/, "/");
  const secureUrl = distBase + secureRel;
  cacheSet(SECURE_URL_CACHE_KEY, "current", secureUrl);
  return secureUrl;
}

async function signInWebView(
  source: WebViewSource,
  cookies: Cookie[],
  secureUrl: string,
  pathOnly: string,
): Promise<string> {
  const raw = await Application.executeInWebView({
    source,
    inject: buildSignInject(secureUrl, pathOnly),
    storage: { cookies },
  });
  const out = parseInjectResult<{ ok: boolean; token?: string; error?: string }>(
    raw.result,
    "sign",
  );
  if (!out.ok || !out.token) throw new Error(`Comix sign failed: ${out.error ?? "unknown"}`);
  return out.token;
}

async function decryptInWebView(
  source: WebViewSource,
  cookies: Cookie[],
  secureUrl: string,
  encryptedBody: string,
  apiPath: string,
  xEnc: string,
): Promise<string> {
  const raw = await Application.executeInWebView({
    source,
    inject: buildDecryptInject(secureUrl, encryptedBody, apiPath, xEnc),
    storage: { cookies },
  });
  const out = parseInjectResult<{ ok: boolean; body?: string; error?: string }>(
    raw.result,
    "decrypt",
  );
  if (!out.ok || !out.body) throw new Error(`Comix decrypt failed: ${out.error ?? "unknown"}`);
  return out.body;
}

function parseInjectResult<R>(raw: unknown, label: string): R {
  if (typeof raw !== "string") {
    throw new Error(`Comix ${label} returned non-string: ${JSON.stringify(raw)}`);
  }
  try {
    return JSON.parse(raw) as R;
  } catch {
    throw new Error(`Comix ${label} returned unparsable: ${raw.slice(0, 500)}`);
  }
}

// Locate the bundle's obfuscated VM namespace (deploy-rotated `vm[A-Z]_<hex>`)
// and expose its callable members. Falls back to short single-letter globals
// for older bundle layouts.
const PROBE_NS_SNIPPET = `
  let nsObj = null;
  for (const k of Object.keys(globalThis)) {
    if (!/^vm[A-Za-z]_[a-zA-Z0-9]{4,}$/.test(k)) continue;
    const v = globalThis[k];
    if (v && typeof v === "object") { nsObj = v; break; }
  }
  if (!nsObj) {
    nsObj = {};
    for (const k of Object.keys(globalThis)) {
      if (/^[A-Za-z]{1,3}$/.test(k) && typeof globalThis[k] === "function") {
        nsObj[k] = globalThis[k];
      }
    }
  }
  const fnNames = Object.keys(nsObj).filter(n => typeof nsObj[n] === "function");
`;

function buildSignInject(secureUrl: string, pathOnly: string): string {
  return `return (async () => {
    try {
      await import(${JSON.stringify(secureUrl)});
      ${PROBE_NS_SNIPPET}

      // Identify the signer behaviorally: the only function that returns a
      // base64url-shaped token for an arbitrary path string.
      const TARGET = ${JSON.stringify(pathOnly)};
      for (const name of fnNames) {
        try {
          const token = nsObj[name](TARGET);
          if (typeof token === "string" && /^[A-Za-z0-9_+/=-]{20,}$/.test(token)) {
            return JSON.stringify({ ok: true, token });
          }
        } catch (e) {}
      }
      return JSON.stringify({ ok: false, error: "signer not found" });
    } catch (e) {
      return JSON.stringify({ ok: false, error: "exception: " + (e && e.message || e) });
    }
  })()`;
}

function buildDecryptInject(
  secureUrl: string,
  encryptedBody: string,
  apiPath: string,
  xEnc: string,
): string {
  return `return (async () => {
    try {
      await import(${JSON.stringify(secureUrl)});
      ${PROBE_NS_SNIPPET}

      const ENCRYPTED = ${JSON.stringify(encryptedBody)};
      const API_PATH = ${JSON.stringify(apiPath)};
      const X_ENC = ${JSON.stringify(xEnc)};
      const PATH_ONLY = API_PATH.split("?")[0];
      const QUERY = API_PATH.indexOf("?") >= 0 ? API_PATH.slice(API_PATH.indexOf("?") + 1) : "";

      const params = {};
      if (QUERY) {
        for (const part of QUERY.split("&")) {
          const eq = part.indexOf("=");
          const k = decodeURIComponent(eq < 0 ? part : part.slice(0, eq));
          const v = eq < 0 ? "" : decodeURIComponent(part.slice(eq + 1));
          if (k in params) {
            if (!Array.isArray(params[k])) params[k] = [params[k]];
            params[k].push(v);
          } else { params[k] = v; }
        }
      }

      // Find the axios installer — the only function that registers BOTH a
      // request and response interceptor when given a fake axios. Both are
      // required: the request interceptor populates per-request module
      // state that the response interceptor reads back.
      let reqHandler = null, respHandler = null;
      for (const name of fnNames) {
        try {
          let req, resp;
          nsObj[name]({
            interceptors: {
              request:  { use: function(h) { if (typeof h === "function") req = h; } },
              response: { use: function(h) { if (typeof h === "function") resp = h; } },
            },
            defaults: { headers: { common: {} }, transformRequest: [], transformResponse: [] },
          });
          if (req && resp) { reqHandler = req; respHandler = resp; break; }
        } catch (e) {}
      }
      if (!reqHandler || !respHandler) {
        return JSON.stringify({ ok: false, error: "installer not found" });
      }

      let cfg = {
        url: "/api/v1" + PATH_ONLY,
        method: "get",
        baseURL: "",
        headers: { common: {} },
        params: params,
      };
      cfg = (await reqHandler(cfg)) || cfg;

      const response = await respHandler({
        data: JSON.parse(ENCRYPTED),
        status: 200, statusText: "OK",
        headers: { "content-type": "application/json", "x-enc": X_ENC },
        config: cfg,
        request: {},
      });
      const data = response && response.data;
      if (!data || typeof data !== "object" || ("e" in data)) {
        return JSON.stringify({ ok: false, error: "decryption did not unwrap envelope" });
      }
      // Wrap to match the existing TS DTO shape (ApiResponse<T>).
      return JSON.stringify({ ok: true, body: JSON.stringify({ status: "ok", result: data }) });
    } catch (e) {
      return JSON.stringify({ ok: false, error: "exception: " + (e && e.message || e) });
    }
  })()`;
}
