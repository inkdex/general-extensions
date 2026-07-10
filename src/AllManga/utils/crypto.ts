/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// Update these build-specific values when the site rotates its reader bundle.
export const BUILD_ID = "13";
export const TS_BUCKET_MS = 5 * 60 * 1000;
const PART_A_HEX = "f5dc46e6f42968c5ed0eab602d6ae8f2107991006f02876947e64fcb75d53da6";

export async function deriveSigningKey(partB: string): Promise<CryptoKey> {
  const partABytes = hexToBytes(PART_A_HEX);
  const partBBytes = base64ToBytes(partB);
  if (partBBytes.length < 32) throw new Error("part B too short");

  const keyBytes = new Uint8Array(32);
  for (let i = 0; i < keyBytes.length; i++) {
    keyBytes[i] = partABytes[i]! ^ partBBytes[i]!;
  }

  return crypto.subtle.importKey("raw", toBuffer(keyBytes), { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function buildAaReq(
  key: CryptoKey,
  epoch: number,
  queryHash: string,
): Promise<string> {
  const ts = Math.floor(Date.now() / TS_BUCKET_MS) * TS_BUCKET_MS;
  const payload = JSON.stringify({ v: 1, ts, epoch, buildId: BUILD_ID, qh: queryHash });

  const iv = new Uint8Array(
    await crypto.subtle.digest("SHA-256", asciiToBuffer(`${epoch}:${BUILD_ID}:${queryHash}:${ts}`)),
  ).slice(0, 12);
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: toBuffer(iv) }, key, asciiToBuffer(payload)),
  );

  const out = new Uint8Array(13 + cipher.length);
  out[0] = 1;
  out.set(iv, 1);
  out.set(cipher, 13);
  return bytesToBase64(out);
}

export async function decryptTobeParsed(value: string, signingKey: CryptoKey): Promise<unknown> {
  const bytes = base64ToBytes(value);
  const iv = toBuffer(bytes, 1, 13);
  const cipher = toBuffer(bytes, 13, bytes.length);

  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, signingKey, cipher);
  return JSON.parse(Application.arrayBufferToUTF8String(plain));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", asciiToBuffer(value)));
  let hex = "";
  for (const byte of digest) hex += byte.toString(16).padStart(2, "0");
  return hex;
}

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]!;
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += BASE64[b0 >> 2];
    out += BASE64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? "=" : BASE64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? "=" : BASE64[b2 & 63];
  }
  return out;
}

function base64ToBytes(value: string): Uint8Array {
  const decoded = Application.base64Decode(value);
  return typeof decoded === "string" ? asciiToBytes(decoded) : new Uint8Array(decoded);
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function asciiToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i);
  return bytes;
}

function asciiToBuffer(value: string): ArrayBuffer {
  return toBuffer(asciiToBytes(value));
}

function toBuffer(bytes: Uint8Array, start = 0, end = bytes.length): ArrayBuffer {
  const out = new Uint8Array(end - start);
  out.set(bytes.subarray(start, end));
  return out.buffer;
}
