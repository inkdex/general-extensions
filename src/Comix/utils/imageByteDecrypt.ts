/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// Comix image byte-encryption.
//
// Some page images are served with the first N bytes XOR-encrypted against an
// LCG keystream. A protected response is identified by these headers:
//
//   X-Enc-Seed:  <uint32, decimal>   e.g. "3121655837"  — 0 means the image is
//                                    clean (no transform)
//   X-Enc-Len:   <decimal>           number of leading bytes encrypted (e.g. 4096)
//
// Decryption (verified byte-exact against the site bundle):
//
//   x = seed >>> 0
//   for i in 0 .. min(len, length) - 1:
//     x = (Math.imul(x, 1000005) + 0x499602D3) >>> 0   // LCG, step first
//     data[i] ^= (x >>> 24) & 0xff                      // keystream = high byte
//
// Bytes past `len` are untouched, so XOR-ing the prefix in place restores the
// original valid image — no decode, canvas, or re-encode required.

export interface EncParams {
  seed: number;
  len: number;
}

export function readEncHeaders(headers: Record<string, string>): EncParams | null {
  let seedStr: string | undefined;
  let lenStr: string | undefined;
  for (const [key, value] of Object.entries(headers)) {
    const lk = key.toLowerCase();
    if (lk === "x-enc-seed") seedStr = value;
    else if (lk === "x-enc-len") lenStr = value;
  }
  if (seedStr === undefined || lenStr === undefined) return null;

  const seed = Number(seedStr);
  const len = Number(lenStr);
  // seed 0 (or anything invalid) means the image is served clean.
  if (!Number.isFinite(seed) || seed <= 0) return null;
  if (!Number.isFinite(len) || len <= 0) return null;

  return { seed: seed >>> 0, len: Math.floor(len) };
}

export function decryptComixImage(data: ArrayBuffer, params: EncParams): ArrayBuffer {
  const bytes = new Uint8Array(data);
  const end = Math.min(params.len, bytes.length);
  let x = params.seed >>> 0;
  for (let i = 0; i < end; i++) {
    x = (Math.imul(x, 1000005) + 0x499602d3) >>> 0;
    bytes[i]! ^= (x >>> 24) & 0xff;
  }
  return bytes.buffer;
}
