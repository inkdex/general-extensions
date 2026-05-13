/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type CookieStorageInterceptor } from "@paperback/types";

import { DOMAIN } from "../models";

/**
 * Returns the signed `_=` token for the given API path by loading
 * comix.to in a WebView and probing the bundle's obfuscated VM namespace
 * for the signer function (qi). The token is stable for a given path
 * regardless of query parameters, so callers should cache it.
 */
export async function getVmToken(
  pathOnly: string,
  cookieInterceptor: CookieStorageInterceptor,
): Promise<string> {
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
      // Poll for the bundle's obfuscated VM namespace (deploy-rotated \`vm[A-Za-z]_<hex>\`).
      // The namespace is populated by \`secure-*.js\`, a lazy chunk fetched after page load,
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

      // Locate the signer (qi): returns a URL-safe base64 token for signed paths, null otherwise.
      // Use a path that always matches the bundle's signed-path patterns for detection.
      const DETECTION_PATH = "/manga/_probe_/chapters";
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

      const token = vmNs[signerName](${JSON.stringify(pathOnly)});
      if (typeof token !== "string") return JSON.stringify({ ok: false, error: "token not a string" });
      return JSON.stringify({ ok: true, token });
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
