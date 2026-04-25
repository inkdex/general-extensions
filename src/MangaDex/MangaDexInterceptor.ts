/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { PaperbackInterceptor, type Request, type Response } from "@paperback/types";
import jpeg from "jpeg-js";
import UPNG from "upng-js";

import { getAccessToken, getCropImagesEnabled, saveAccessToken } from "./MangaDexSettings";
import { MANGADEX_DOMAIN } from "./utils/CommonUtil";

type UPNGImage = { width: number; height: number };
interface UPNGModule {
  decode: (buf: ArrayBuffer) => UPNGImage;
  toRGBA8: (img: UPNGImage) => ArrayBuffer[];
  encode: (imgs: ArrayBuffer[], w: number, h: number, cnum: number) => ArrayBuffer;
}
const UPNGTyped = UPNG as unknown as UPNGModule;

/**
 * Intercepts requests to handle authentication and headers
 * Handles token refresh when needed
 */
export class MangaDexInterceptor extends PaperbackInterceptor {
  // Regex to identify image requests
  private readonly imageRegex = new RegExp(/\.(png|gif|jpeg|jpg|webp)(\?|$)/i);

  // Concurrency control for refresh token
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  /**
   * Adds authentication and referer headers to requests
   * Handles token refresh if expired
   */
  override async interceptRequest(request: Request): Promise<Request> {
    // Impossible to have undefined headers, ensured by the app
    request.headers = {
      ...request.headers,
      referer: `${MANGADEX_DOMAIN}/`,
    };

    let accessToken = getAccessToken();
    if (
      this.imageRegex.test(request.url) ||
      request.url.includes("auth/") ||
      request.url.includes("auth.mangadex") ||
      !accessToken
    ) {
      return request;
    }

    // Padding 60 secs to make sure it won't expire in-transit if the connection is really bad
    // Also, only refresh if the request needs credentials
    if (
      Number(accessToken.tokenBody.exp) <= Date.now() / 1000 - 60 &&
      (request.url.includes("/read") ||
        request.url.includes("/status") ||
        request.url.includes("/rating"))
    ) {
      // Only one refresh at a time
      if (this.isRefreshing && this.refreshPromise) {
        await this.refreshPromise;
        accessToken = getAccessToken();
        if (!accessToken) {
          return request;
        }
      } else {
        this.isRefreshing = true;
        this.refreshPromise = (async () => {
          try {
            const [response, buffer] = await Application.scheduleRequest({
              url: "https://auth.mangadex.org/realms/mangadex/protocol/openid-connect/token",
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: {
                grant_type: "refresh_token",
                refresh_token: accessToken.refreshToken,
                client_id: "paperback",
              },
            });

            if (response.status > 399) {
              return;
            }

            const data = Application.arrayBufferToUTF8String(buffer);
            const json = JSON.parse(data) as MangaDex.AuthResponse | MangaDex.AuthError;

            if ("error" in json) {
              return;
            }
            accessToken = saveAccessToken(json.access_token, json.refresh_token);
          } catch {
            // Log error if needed
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        })();
        await this.refreshPromise;
        accessToken = getAccessToken();
        if (!accessToken) {
          return request;
        }
      }
    }

    // Impossible to have undefined headers, ensured by the app
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
    const pngRegex = /\.png(\?|$)/i;
    const jpegRegex = /\.jpe?g(\?|$)/i;

    // Check if the request URL matches PNG or JPEG
    if (!pngRegex.test(request.url) && !jpegRegex.test(request.url)) {
      return data;
    }

    // Check if the image is a cover image
    if (request.url.includes("uploads")) {
      return data;
    }

    // Check if cropping is enabled in settings
    if (!getCropImagesEnabled()) {
      return data;
    }
    try {
      let decoded: { width: number; height: number; data: Uint8Array };
      let format: "png" | "jpeg" | null = null;

      if (pngRegex.test(request.url)) {
        const img = UPNGTyped.decode(data);
        let rgba: ArrayBuffer | undefined;
        try {
          rgba = UPNGTyped.toRGBA8(img)[0];
        } catch {
          // Ignore UPNG.toRGBA8 errors, handled by fallback logic
        }
        const pixelArray = rgba ? new Uint8Array(rgba) : new Uint8Array();

        decoded = {
          width: img.width,
          height: img.height,
          data: pixelArray,
        };
        format = "png";
      } else if (jpegRegex.test(request.url)) {
        //const decodeStart = Date.now();
        const jpegData = jpeg.decode(new Uint8Array(data), {
          useTArray: true,
          colorTransform: false,
          tolerantDecoding: false,
        });
        //const decodeEnd = Date.now();
        //console.log(
        //    `[BENCHMARK] jpeg.decode took ${decodeEnd - decodeStart} ms for ${request.url}`,
        //);
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

      // Skip cropping for tall images (webtoon-style/korean manhwa)
      const TALL_IMAGE_ASPECT_RATIO_THRESHOLD = 3.0;
      const aspectRatio = height / width;
      if (aspectRatio >= TALL_IMAGE_ASPECT_RATIO_THRESHOLD) {
        return data;
      }

      // Find whitespace bounds (R,G,B > 245)
      let top = 0,
        bottom = height - 1,
        left = 0,
        right = width - 1;
      const isWhitespace = (idx: number): boolean => {
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        return r > 245 && g > 245 && b > 245;
      };

      // Top
      outer: for (let y = 0; y < height; y++) {
        const rowOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x * 4;
          if (!isWhitespace(idx)) {
            top = y;
            break outer;
          }
        }
      }
      // Bottom
      outer: for (let y = height - 1; y >= top; y--) {
        const rowOffset = y * width * 4;
        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x * 4;
          if (!isWhitespace(idx)) {
            bottom = y;
            break outer;
          }
        }
      }
      // Left
      outer: for (let x = 0; x < width; x++) {
        const colOffset = x * 4;
        for (let y = top; y <= bottom; y++) {
          const idx = y * width * 4 + colOffset;
          if (!isWhitespace(idx)) {
            left = x;
            break outer;
          }
        }
      }
      // Right
      outer: for (let x = width - 1; x >= left; x--) {
        const colOffset = x * 4;
        for (let y = top; y <= bottom; y++) {
          const idx = y * width * 4 + colOffset;
          if (!isWhitespace(idx)) {
            right = x;
            break outer;
          }
        }
      }

      // Check if cropping is needed
      if (top === 0 && bottom === height - 1 && left === 0 && right === width - 1) {
        return data;
      }
      if (top >= bottom || left >= right) {
        return data;
      }

      // Crop
      const newWidth = right - left + 1;
      const newHeight = bottom - top + 1;
      const cropped = new Uint8Array(newWidth * newHeight * 4);

      for (let y = 0; y < newHeight; y++) {
        const srcStart = ((top + y) * width + left) * 4;
        const srcEnd = srcStart + newWidth * 4;
        const dstStart = y * newWidth * 4;
        cropped.set(pixels.subarray(srcStart, srcEnd), dstStart);
      }

      // Encode
      let encoded: ArrayBuffer | undefined;
      if (format === "png") {
        encoded = UPNGTyped.encode([cropped.buffer], newWidth, newHeight, 0);
      } else if (format === "jpeg") {
        //const encodeStart = Date.now();
        const jpegData = jpeg.encode({ data: cropped, width: newWidth, height: newHeight }, 75);
        //const encodeEnd = Date.now();
        //console.log(
        //    `[BENCHMARK] jpeg.encode took ${encodeEnd - encodeStart} ms for ${request.url}`,
        //);
        // Ensure we only assign if the buffer is an ArrayBuffer, not SharedArrayBuffer
        if (jpegData.data.buffer instanceof ArrayBuffer) {
          encoded = jpegData.data.buffer;
        } else {
          // Fallback: copy to a new ArrayBuffer if needed
          encoded = new Uint8Array(jpegData.data).buffer;
        }
      } else {
        return data;
      }

      // For PNG, encoded is already an ArrayBuffer. For JPEG, it's a Uint8Array
      if (encoded && encoded instanceof ArrayBuffer) {
        return encoded;
      }
      return data;
    } catch (e: unknown) {
      // Debug: log any error that occurs during cropping/encoding
      const errMsg =
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
          ? (e as { message: string }).message
          : String(e);
      console.log(`[MangaDexInterceptor] Error during image crop/encode: ${errMsg}`);
      return data;
    }
  }
}
