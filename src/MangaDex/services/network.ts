/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import "../implementations/shared/polyfills";
import { PaperbackInterceptor, URL, type Request, type Response } from "@paperback/types";
import jpeg from "jpeg-js";
import UPNG from "upng-js";

import { MANGADEX_API, MANGADEX_DOMAIN } from "../implementations/shared/models";
import type { MangaDexError } from "../implementations/shared/models";
import {
  authEndpointRequest,
  getAccessToken,
  getCropImagesEnabled,
  saveAccessToken,
} from "../implementations/shared/state";
import { parseJSONBody } from "../implementations/shared/utils";

type UPNGImage = { width: number; height: number };
interface UPNGModule {
  decode: (buf: ArrayBuffer) => UPNGImage;
  toRGBA8: (img: UPNGImage) => ArrayBuffer[];
  encode: (imgs: ArrayBuffer[], w: number, h: number, cnum: number) => ArrayBuffer;
}
const UPNGTyped = UPNG as unknown as UPNGModule;

// Paths that need a valid bearer, anchored so "readableAt" or "order[rating]=desc" do not match.
const REFRESH_REQUIRED_PATHS = /\/(?:read|status|rating)(?:\/|\?|$)/;

const IMAGE_URL_RE = /\.(png|gif|jpeg|jpg|webp)(\?|$)/i;
const PNG_URL_RE = /\.png(\?|$)/i;
const JPEG_URL_RE = /\.jpe?g(\?|$)/i;

// 12 MP cap = ~48 MB RGBA8 buffer. Protects older iOS devices from OOM on huge scans.
const MAX_CROP_PIXELS = 12_000_000;

export class MangaDexInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    // Impossible to have undefined headers, ensured by the app
    request.headers = {
      ...request.headers,
      referer: `${MANGADEX_DOMAIN}/`,
    };

    let accessToken = getAccessToken();
    // Bearer only on MangaDex API. Trailing slash blocks "api.mangadex.org.evil.example".
    if (
      !accessToken ||
      !request.url.startsWith(MANGADEX_API + "/") ||
      IMAGE_URL_RE.test(request.url)
    ) {
      return request;
    }

    // 60s pad against in flight expiry. A non numeric exp also counts as expired.
    const expSeconds = Number(accessToken.tokenBody.exp);
    const expired = !Number.isFinite(expSeconds) || expSeconds <= Date.now() / 1000 + 60;
    const needsAuth = REFRESH_REQUIRED_PATHS.test(request.url);
    if (expired && needsAuth) {
      if (!accessToken.refreshToken) {
        // No refresh token. Clear session for a clean logged out state.
        saveAccessToken(undefined, undefined);
        return request;
      }
      // Snapshot before await to detect logout / parallel rotation.
      const originalRefreshToken = accessToken.refreshToken;
      try {
        const response = await authEndpointRequest(originalRefreshToken);
        const currentTokens = getAccessToken();
        if (currentTokens?.refreshToken !== originalRefreshToken) {
          // Tokens changed during await: logout (anon) or rotation (use new pair).
          if (!currentTokens) return request;
          accessToken = currentTokens;
        } else {
          // saveAccessToken clears the session on malformed body. Do not reuse a dead bearer.
          const saved = saveAccessToken(response.access_token, response.refresh_token);
          if (!saved) return request;
          accessToken = saved;
        }
      } catch (e: unknown) {
        const currentTokens = getAccessToken();
        if (currentTokens?.refreshToken !== originalRefreshToken) {
          if (!currentTokens) return request;
          accessToken = currentTokens;
        } else {
          const msg = e instanceof Error ? e.message : String(e);
          // Force logout only on real auth failures (400/401 or invalid_grant/invalid_token).
          const isAuthInvalid =
            /status code: 40[01]/.test(msg) || /invalid_grant|invalid_token/i.test(msg);
          if (isAuthInvalid) {
            saveAccessToken(undefined, undefined);
          } else {
            console.log(`[MangaDexInterceptor] Token refresh transient error: ${msg}`);
          }
          return request;
        }
      }
    } else if (expired && !needsAuth) {
      // Public endpoint, expired token: send anonymous, not a dead bearer.
      return request;
    }

    request.headers = {
      ...request.headers,
      Authorization: "Bearer " + accessToken.accessToken,
    };
    return request;
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    // Cheapest check first: skip URL parsing when cropping is off.
    if (!getCropImagesEnabled()) {
      return data;
    }

    // Error responses ship HTML or empty bodies. Decoding them wastes CPU and floods logs.
    if (response.status >= 400) {
      return data;
    }

    const isPng = PNG_URL_RE.test(request.url);
    const isJpeg = !isPng && JPEG_URL_RE.test(request.url);
    if (!isPng && !isJpeg) {
      return data;
    }

    // Match host AND /covers/. Chapter pages share uploads.mangadex.org under /data/.
    let parsed: URL;
    try {
      parsed = new URL(request.url);
    } catch {
      return data;
    }
    if (parsed.hostname === "uploads.mangadex.org" && parsed.path.startsWith("/covers/")) {
      return data;
    }
    try {
      let decoded: { width: number; height: number; data: Uint8Array };
      let format: "png" | "jpeg" | null = null;

      if (isPng) {
        let img: UPNGImage;
        try {
          img = UPNGTyped.decode(data);
        } catch {
          return data;
        }
        // Bail before toRGBA8 allocates ~4 bytes per pixel. UPNG.decode
        // only reads the header so dimensions are cheap here.
        if (img.width * img.height > MAX_CROP_PIXELS) {
          return data;
        }
        let rgba: ArrayBuffer | undefined;
        try {
          rgba = UPNGTyped.toRGBA8(img)[0];
        } catch {
          // rgba stays undefined; the null check below returns data.
        }
        if (!rgba || rgba.byteLength === 0) {
          return data;
        }
        decoded = {
          width: img.width,
          height: img.height,
          data: new Uint8Array(rgba),
        };
        format = "png";
      } else if (isJpeg) {
        const jpegData = jpeg.decode(new Uint8Array(data), {
          useTArray: true,
          formatAsRGBA: true,
          tolerantDecoding: false,
        });
        decoded = {
          width: jpegData.width,
          height: jpegData.height,
          data: jpegData.data,
        };
        format = "jpeg";
      } else {
        return data;
      }

      const { width, height, data: pixels } = decoded;

      // Skip cropping for tall images (webtoons, manhwa).
      const TALL_IMAGE_ASPECT_RATIO_THRESHOLD = 3.0;
      if (height / width >= TALL_IMAGE_ASPECT_RATIO_THRESHOLD) {
        return data;
      }

      // JPEG already decoded. Bail here to skip crop sweeps and the second buffer.
      if (width * height > MAX_CROP_PIXELS) {
        return data;
      }

      let top = 0,
        bottom = height - 1,
        left = 0,
        right = width - 1;
      let foundContent = false;
      // Inlined for JIT. Padding classes: alpha<16, white>245, black<16 (gutter bars).
      outer: for (let y = 0; y < height; y++) {
        const rowOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x * 4;
          if (
            !(
              pixels[idx + 3] < 16 ||
              (pixels[idx] > 245 && pixels[idx + 1] > 245 && pixels[idx + 2] > 245) ||
              (pixels[idx] < 16 && pixels[idx + 1] < 16 && pixels[idx + 2] < 16)
            )
          ) {
            top = y;
            foundContent = true;
            break outer;
          }
        }
      }
      if (!foundContent) {
        return data;
      }
      outer: for (let y = height - 1; y >= top; y--) {
        const rowOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x * 4;
          if (
            !(
              pixels[idx + 3] < 16 ||
              (pixels[idx] > 245 && pixels[idx + 1] > 245 && pixels[idx + 2] > 245) ||
              (pixels[idx] < 16 && pixels[idx + 1] < 16 && pixels[idx + 2] < 16)
            )
          ) {
            bottom = y;
            break outer;
          }
        }
      }
      outer: for (let x = 0; x < width; x++) {
        const colOffset = x * 4;
        for (let y = top; y <= bottom; y++) {
          const idx = y * width * 4 + colOffset;
          if (
            !(
              pixels[idx + 3] < 16 ||
              (pixels[idx] > 245 && pixels[idx + 1] > 245 && pixels[idx + 2] > 245) ||
              (pixels[idx] < 16 && pixels[idx + 1] < 16 && pixels[idx + 2] < 16)
            )
          ) {
            left = x;
            break outer;
          }
        }
      }
      outer: for (let x = width - 1; x >= left; x--) {
        const colOffset = x * 4;
        for (let y = top; y <= bottom; y++) {
          const idx = y * width * 4 + colOffset;
          if (
            !(
              pixels[idx + 3] < 16 ||
              (pixels[idx] > 245 && pixels[idx + 1] > 245 && pixels[idx + 2] > 245) ||
              (pixels[idx] < 16 && pixels[idx + 1] < 16 && pixels[idx + 2] < 16)
            )
          ) {
            right = x;
            break outer;
          }
        }
      }

      if (top === 0 && bottom === height - 1 && left === 0 && right === width - 1) {
        return data;
      }
      if (top >= bottom || left >= right) {
        return data;
      }

      const newWidth = right - left + 1;
      const newHeight = bottom - top + 1;
      const cropped = new Uint8Array(newWidth * newHeight * 4);

      for (let y = 0; y < newHeight; y++) {
        const srcStart = ((top + y) * width + left) * 4;
        const srcEnd = srcStart + newWidth * 4;
        const dstStart = y * newWidth * 4;
        cropped.set(pixels.subarray(srcStart, srcEnd), dstStart);
      }

      let encoded: ArrayBuffer | undefined;
      if (format === "png") {
        encoded = UPNGTyped.encode([cropped.buffer], newWidth, newHeight, 0);
      } else if (format === "jpeg") {
        const jpegData = jpeg.encode({ data: cropped, width: newWidth, height: newHeight }, 75);
        // jpeg-js returns a view into a larger preallocated buffer, so copy.
        encoded = new Uint8Array(jpegData.data).buffer;
      } else {
        return data;
      }

      if (encoded && encoded instanceof ArrayBuffer) {
        return encoded;
      }
      return data;
    } catch {
      return data;
    }
  }
}

interface MangaDexErrorEnvelope {
  result?: string;
  errors?: MangaDexError[];
}

export async function fetchJSON<T>(request: Request): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest(request);
  const data = Application.arrayBufferToUTF8String(buffer);
  const json = parseJSONBody<T & MangaDexErrorEnvelope>(data, response.status);
  if (json?.result === "error" || response.status >= 400) {
    const errors = Array.isArray(json?.errors) ? json.errors : [];
    const summary =
      errors.length > 0
        ? errors.map((e) => `[${e.status}] ${e.detail ?? e.title ?? "error"}`).join("; ")
        : `HTTP ${response.status}`;
    throw new Error(`MangaDex API Error: ${summary}`);
  }
  return json as T;
}
