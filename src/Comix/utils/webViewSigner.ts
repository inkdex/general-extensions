/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type Cookie, type CookieStorageInterceptor } from "@paperback/types";

import { DOMAIN, type ApiResponse } from "../models";
import { cacheGet, cacheSet } from "./cache";

const TOKEN_CACHE_KEY = "comix.signedToken.v1";

interface WebViewSource {
  html: string;
  baseUrl: string;
  loadCSS: boolean;
  loadImages: boolean;
}

interface WebViewContext {
  source: WebViewSource;
  cookies: Cookie[];
}

interface DecryptItem {
  encryptedBody: string;
  apiPath: string;
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
  apiPaths: string[],
  cookieInterceptor: CookieStorageInterceptor,
): Promise<ApiResponse<T>[]> {
  if (apiPaths.length === 0) return [];

  const ctx = await prepareContext(cookieInterceptor);

  const tokens: Record<string, string> = {};
  const pathsToSign = new Set<string>();
  for (const apiPath of apiPaths) {
    const pathOnly = apiPath.split("?")[0];
    const cached = cacheGet(TOKEN_CACHE_KEY, pathOnly);
    if (cached) tokens[pathOnly] = cached;
    else pathsToSign.add(pathOnly);
  }

  if (pathsToSign.size > 0) {
    const fresh = await signInWebView(ctx, [...pathsToSign]);
    Object.assign(tokens, fresh);
  }

  const fetched = await Promise.all(
    apiPaths.map(async (apiPath) => {
      const pathOnly = apiPath.split("?")[0];
      const sep = apiPath.includes("?") ? "&" : "?";
      let token = tokens[pathOnly];
      let { response, encryptedText } = await fetchSigned(apiPath, sep, token);
      // Only retry if the token came from cache — a fresh token failing means something else is wrong.
      if (response.status >= 400 && !pathsToSign.has(pathOnly)) {
        const fresh = await signInWebView(ctx, [pathOnly]);
        token = fresh[pathOnly];
        ({ response, encryptedText } = await fetchSigned(apiPath, sep, token));
      }
      if (response.status >= 400)
        throw new Error(`Comix API HTTP ${response.status} for ${apiPath}`);
      cacheSet(TOKEN_CACHE_KEY, pathOnly, token);
      return { apiPath, encryptedText };
    }),
  );

  const results: Array<ApiResponse<T> | null> = Array.from({ length: apiPaths.length }, () => null);
  const toDecrypt: Array<{ index: number } & DecryptItem> = [];

  for (let i = 0; i < fetched.length; i++) {
    const { apiPath, encryptedText } = fetched[i];
    const envelope = parseJsonOrThrow(encryptedText);
    if (!isEncrypted(envelope)) results[i] = envelope as ApiResponse<T>;
    else toDecrypt.push({ index: i, encryptedBody: encryptedText, apiPath });
  }

  if (toDecrypt.length > 0) {
    const decrypted = await decryptInWebView(
      ctx,
      toDecrypt.map(({ encryptedBody, apiPath }) => ({ encryptedBody, apiPath })),
    );
    for (let i = 0; i < toDecrypt.length; i++) {
      results[toDecrypt[i].index] = JSON.parse(decrypted[i]) as ApiResponse<T>;
    }
  }

  return results as ApiResponse<T>[];
}

async function prepareContext(
  cookieInterceptor: CookieStorageInterceptor,
): Promise<WebViewContext> {
  const [, buffer] = await Application.scheduleRequest({ url: `${DOMAIN}/`, method: "GET" });
  const html = Application.arrayBufferToUTF8String(buffer);
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);
  return {
    cookies,
    source: { html, baseUrl: `${DOMAIN}/`, loadCSS: false, loadImages: false },
  };
}

async function fetchSigned(apiPath: string, sep: string, token: string) {
  const url = `${DOMAIN}/api/v1${apiPath}${sep}_=${encodeURIComponent(token)}`;
  const [response, buf] = await Application.scheduleRequest({ url, method: "GET" });
  return { response, encryptedText: Application.arrayBufferToUTF8String(buf) };
}

async function signInWebView(
  ctx: WebViewContext,
  paths: string[],
): Promise<Record<string, string>> {
  const raw = await Application.executeInWebView({
    source: ctx.source,
    inject: buildSignInject(paths),
    storage: { cookies: ctx.cookies },
  });
  const out = parseInjectResult<{ ok: boolean; tokens?: Record<string, string>; error?: string }>(
    raw.result,
    "sign",
  );
  if (!out.ok || !out.tokens) throw new Error(`Comix sign failed: ${out.error ?? "unknown"}`);
  return out.tokens;
}

async function decryptInWebView(ctx: WebViewContext, items: DecryptItem[]): Promise<string[]> {
  const raw = await Application.executeInWebView({
    source: ctx.source,
    inject: buildDecryptInject(items),
    storage: { cookies: ctx.cookies },
  });
  const out = parseInjectResult<{
    ok: boolean;
    results?: Array<{ ok: boolean; body?: string; error?: string }>;
    error?: string;
  }>(raw.result, "decrypt");
  if (!out.ok || !out.results) throw new Error(`Comix decrypt failed: ${out.error ?? "unknown"}`);
  return out.results.map((r, i) => {
    if (!r.ok || !r.body)
      throw new Error(`Comix decrypt item ${i} failed: ${r.error ?? "unknown"}`);
    return r.body;
  });
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

function buildSignInject(paths: string[]): string {
  return `return (async () => {
    try {
      ${PROBE_NS_SNIPPET}

      const PATHS = ${JSON.stringify(paths)};
      let signerName = null;
      for (const name of fnNames) {
        try {
          const token = nsObj[name](PATHS[0]);
          if (typeof token === "string" && /^[A-Za-z0-9_+/=-]{20,}$/.test(token)) {
            signerName = name; break;
          }
        } catch (e) {}
      }
      if (!signerName) return JSON.stringify({ ok: false, error: "signer not found" });
      const tokens = {};
      for (const path of PATHS) { tokens[path] = nsObj[signerName](path); }
      return JSON.stringify({ ok: true, tokens });
    } catch (e) {
      return JSON.stringify({ ok: false, error: "exception: " + (e && e.message || e) });
    }
  })()`;
}

function buildDecryptInject(items: DecryptItem[]): string {
  return `return (async () => {
    try {
      ${PROBE_NS_SNIPPET}

      const ITEMS = ${JSON.stringify(items)};
      let respHandler = null;
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
          if (req && resp) { respHandler = resp; break; }
        } catch (e) {}
      }
      if (!respHandler) {
        return JSON.stringify({ ok: false, error: "installer not found" });
      }

      const results = [];
      for (const item of ITEMS) {
        try {
          const PATH_ONLY = item.apiPath.split("?")[0];
          const QUERY = item.apiPath.indexOf("?") >= 0 ? item.apiPath.slice(item.apiPath.indexOf("?") + 1) : "";
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
          const cfg = { url: "/api/v1" + PATH_ONLY, method: "get", baseURL: "", headers: { common: {} }, params };
          const response = await respHandler({
            data: JSON.parse(item.encryptedBody),
            status: 200, statusText: "OK",
            headers: { "content-type": "application/json", "x-enc": "1" },
            config: cfg, request: {},
          });
          const data = response && response.data;
          if (!data || typeof data !== "object" || ("e" in data)) {
            results.push({ ok: false, error: "decryption did not unwrap envelope" });
          } else {
            results.push({ ok: true, body: JSON.stringify({ status: "ok", result: data }) });
          }
        } catch (e) {
          results.push({ ok: false, error: "exception: " + (e && e.message || e) });
        }
      }
      return JSON.stringify({ ok: true, results });
    } catch (e) {
      return JSON.stringify({ ok: false, error: "exception: " + (e && e.message || e) });
    }
  })()`;
}
