/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";

import { DOMAIN, type ApiResponse } from "../models";

/**
 * Fetches protected Comix API paths in a single executeInWebView call.
 *
 * The webview's baseUrl is https://comix.to/ so its document origin is
 * https://comix.to — same-origin fetch to /api/v1/... is permitted.
 * One inject script: poll for VM namespace → sign paths → fetch APIs →
 * decrypt any RC4-encrypted responses via the `v` axios installer.
 */
export async function apiViaWebView<T>(
  apiPaths: string[],
  cookieInterceptor: CookieStorageInterceptor,
): Promise<ApiResponse<T>[]> {
  if (apiPaths.length === 0) return [];

  const [, buffer] = await Application.scheduleRequest({ url: `${DOMAIN}/`, method: "GET" });
  const cookies = cookieInterceptor.cookiesForUrl(`${DOMAIN}/`);

  const raw = await Application.executeInWebView({
    source: {
      html: Application.arrayBufferToUTF8String(buffer),
      baseUrl: `${DOMAIN}/`,
      loadCSS: false,
      loadImages: false,
    },
    inject: `return (async () => {
    try {
      // Polls for the bundle's obfuscated VM namespace (deploy-rotated \`vm[A-Za-z]_<hex>\`,
      // currently \`vmx_26c226\`). The namespace is created synchronously by the main bundle
      // but populated by \`secure-*.js\`, which is a lazy chunk fetched after page load —
      // so it may not exist yet when the inject runs. Poll every 100 ms, up to 10 s.
      let vmNs = null;
      await new Promise((resolve) => {
        const deadline = Date.now() + 10000;
        const poll = () => {
          for (const k of Object.keys(globalThis)) {
            if (!/^vm[A-Za-z]_[A-Za-z0-9_]+$/.test(k)) continue;
            const v = globalThis[k];
            if (v && typeof v === "object" && Object.keys(v).some(n => typeof v[n] === "function")) {
              vmNs = v; resolve(); return;
            }
          }
          if (Date.now() < deadline) { setTimeout(poll, 100); return; }
          vmNs = {}; resolve();
        };
        poll();
      });
      const vmFunctions = Object.keys(vmNs).filter(n => typeof vmNs[n] === "function");

      const PATHS = ${JSON.stringify(apiPaths)};
      // A path that always matches the bundle's signed-path patterns. The signer (\`qi\`)
      // returns null for unsigned paths, so the detection probe must use a signed path —
      // we can't rely on the caller's actual paths being in the signed set.
      const DETECTION_PATH = "/manga/_probe_/chapters";

      // Locate the signer (qi): returns a URL-safe base64 token for signed paths, null otherwise.
      let signerName = null;
      for (const name of vmFunctions) {
        try {
          const token = vmNs[name](DETECTION_PATH);
          if (typeof token === "string" && /^[A-Za-z0-9_+/=_-]{20,}$/.test(token)) {
            signerName = name; break;
          }
        } catch (e) {}
      }
      if (!signerName) return JSON.stringify({ ok: false, error: "signer not found" });

      // Locate the axios installer (v): registers request + response (decrypt) interceptors.
      let requestInterceptor = null, decryptInterceptor = null;
      for (const name of vmFunctions) {
        try {
          let req, resp;
          vmNs[name]({
            interceptors: {
              request:  { use: function(h) { if (typeof h === "function") req = h; } },
              response: { use: function(h) { if (typeof h === "function") resp = h; } },
            },
            defaults: { headers: { common: {} }, transformRequest: [], transformResponse: [] },
          });
          if (resp) { requestInterceptor = req || null; decryptInterceptor = resp; break; }
        } catch (e) {}
      }
      if (!decryptInterceptor) return JSON.stringify({ ok: false, error: "installer not found" });

      const results = [];
      for (const apiPath of PATHS) {
        try {
          const pathOnly = apiPath.split("?")[0];
          const sep = apiPath.includes("?") ? "&" : "?";
          const token = vmNs[signerName](pathOnly);
          const url = "/api/v1" + apiPath + sep + "_=" + encodeURIComponent(token);

          const fetchResp = await fetch(url);
          if (!fetchResp.ok) {
            results.push({ ok: false, error: "HTTP " + fetchResp.status });
            continue;
          }
          const xEnc = fetchResp.headers.get("x-enc") || "1";
          const body = await fetchResp.text();
          const envelope = JSON.parse(body);

          // Not encrypted — return as-is.
          if (!envelope || typeof envelope !== "object" || !("e" in envelope)) {
            results.push({ ok: true, body });
            continue;
          }

          // Build a fake axios request config so the request interceptor can initialise
          // any per-request state before the decrypt interceptor runs.
          const requestConfig = {
            url: "/api/v1" + pathOnly, method: "get", baseURL: "",
            headers: { common: {} }, params: {},
          };
          const interceptedConfig = requestInterceptor
            ? (await requestInterceptor({ ...requestConfig }) || requestConfig)
            : requestConfig;

          const decryptResp = await decryptInterceptor({
            data: envelope,
            status: 200, statusText: "OK",
            headers: { "content-type": "application/json", "x-enc": xEnc },
            config: interceptedConfig, request: {},
          });

          const data = decryptResp && decryptResp.data;
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
  })()`,
    storage: { cookies },
  });

  const out = parseWebViewResult<{
    ok: boolean;
    results?: Array<{ ok: boolean; body?: string; error?: string }>;
    error?: string;
  }>(raw.result, "combined");

  if (!out.ok || !out.results) throw new Error(`Comix webview failed: ${out.error ?? "unknown"}`);

  return out.results.map((r, i) => {
    if (!r.ok || !r.body) throw new Error(`Comix request ${i} failed: ${r.error ?? "unknown"}`);
    return JSON.parse(r.body) as ApiResponse<T>;
  });
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
