/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

function arrayBufferToBase64(data: ArrayBuffer): string {
  const encoded = Application.base64Encode(data);
  return typeof encoded === "string" ? encoded : Application.arrayBufferToASCIIString(encoded);
}

function decodeDataUrlToArrayBuffer(dataUrl: string): ArrayBuffer {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid data URL");

  const payload = dataUrl.slice(comma + 1);
  const decoded = Application.base64Decode(payload);

  if (typeof decoded === "string") {
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes.buffer;
  }

  return decoded;
}

async function loadImageFromBuffer(data: ArrayBuffer, mimeType: string): Promise<HTMLImageElement> {
  const b64 = arrayBufferToBase64(data);
  const dataUrl = `data:${mimeType};base64,${b64}`;

  const img = new Image();

  // Settle once across all JSCore Image-polyfill behaviours (sync-complete,
  // async onload/onerror, or neither). The timer is a settle-guard, not a fetch
  // timeout: if the polyfill never fires a callback, this rejects so the reader
  // doesn't spin forever. setTimeout/clearTimeout aren't guaranteed in this
  // context, so both calls are typeof-guarded; absent a timer we rely on the
  // sync-complete / onload paths (data URLs settle synchronously in practice).
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = (action: () => void): void => {
      if (settled) return;
      settled = true;
      if (timer !== undefined && typeof clearTimeout === "function") clearTimeout(timer);
      action();
    };
    if (typeof setTimeout === "function") {
      timer = setTimeout(() => done(() => reject(new Error("image load timed out"))), 10000);
    }
    img.onload = () => done(() => resolve(img));
    img.onerror = () => done(() => reject(new Error("Image load failed")));
    img.src = dataUrl;
    if (img.complete && img.naturalWidth > 0) {
      done(() => resolve(img));
    }
  });
}

export async function descrambleMangagoImage(
  data: ArrayBuffer,
  key: string,
  cols: number,
  mimeType: string,
): Promise<ArrayBuffer> {
  const src = await loadImageFromBuffer(data, mimeType);

  const width = src.naturalWidth || src.width;
  const height = src.naturalHeight || src.height;

  const unitWidth = Math.floor(width / cols);
  const unitHeight = Math.floor(height / cols);

  if (unitWidth <= 0 || unitHeight <= 0) {
    throw new Error(`Invalid tile size for ${width}x${height}, cols=${cols}`);
  }

  const keyArray = key.split("a").map((x) => {
    const n = Number(x || "0");
    return Number.isFinite(n) ? n : 0;
  });

  if (keyArray.length < cols * cols) {
    throw new Error(`Invalid key array length ${keyArray.length}, expected ${cols * cols}`);
  }

  const canvas = new HTMLCanvasElement();
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2D context");

  ctx.drawImage(src, 0, 0, width, height);

  // Move tiles through the pixel buffer, not a clip-and-scale drawImage: the
  // on-device canvas polyfill doesn't reliably honour the 9-argument
  // (source-rect) overload, so per-tile blits silently no-op and the image comes
  // back still scrambled. getImageData + putImageData is the working path.
  //
  // That polyfill also exposes getImageData/putImageData with Y-up coordinates
  // (origin bottom-left), so the raw buffer is row-reversed relative to the
  // image. Flip to standard Y-down, permute the tiles, then flip back. Pre-copying
  // the buffer keeps the right/bottom remainder strip floor() leaves outside the
  // cols×cols grid intact.
  const stride = width * 4;
  const srcYup = ctx.getImageData(0, 0, width, height).data;
  const srcStd = new Uint8ClampedArray(srcYup.length);
  for (let y = 0; y < height; y++) {
    srcStd.set(srcYup.subarray(y * stride, (y + 1) * stride), (height - 1 - y) * stride);
  }
  const dstStd = new Uint8ClampedArray(srcStd);

  const rowBytes = unitWidth * 4;
  for (let idx = 0; idx < cols * cols; idx++) {
    const keyval = keyArray[idx] ?? 0;

    const srcRow = Math.floor(idx / cols);
    const srcCol = idx - srcRow * cols;

    const destRow = Math.floor(keyval / cols);
    const destCol = keyval - destRow * cols;

    for (let y = 0; y < unitHeight; y++) {
      const srcOff = ((srcRow * unitHeight + y) * width + srcCol * unitWidth) * 4;
      const dstOff = ((destRow * unitHeight + y) * width + destCol * unitWidth) * 4;
      dstStd.set(srcStd.subarray(srcOff, srcOff + rowBytes), dstOff);
    }
  }

  const dstYup = new Uint8ClampedArray(dstStd.length);
  for (let y = 0; y < height; y++) {
    dstYup.set(dstStd.subarray(y * stride, (y + 1) * stride), (height - 1 - y) * stride);
  }
  ctx.putImageData(new ImageData(dstYup, width, height), 0, 0);

  return decodeDataUrlToArrayBuffer(canvas.toDataURL(mimeType));
}
