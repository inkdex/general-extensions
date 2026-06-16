/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// Comix image byte-encryption.
//
// Some page images have their first N bytes XOR'd against a PRNG keystream,
// identified by these headers:
//
//   X-Enc-Seed:  <uint32, decimal>   e.g. "3121655837"  — 0 means clean
//   X-Enc-Len:   <decimal>           leading bytes encrypted (e.g. 4096)
//   X-Enc-Algo:  <int>               keystream variant (default 1)
//
// The keystream depends on the algo (both step-first, XOR the first `len` bytes
// in place; bytes past `len` are untouched, so no decode/re-encode is needed):
//   - algo <= 1: LCG `x = x*1000005 + 0x499602D3`, keystream = high byte
//   - algo 2:    xorshift32 (13/17/5) seeded `seed | 1`, keystream = low byte
//                (same PRNG as descramble algo 3; verified byte-exact)

export interface EncParams {
  seed: number;
  len: number;
  algo: number;
}

export function readEncHeaders(headers: Record<string, string>): EncParams | null {
  let seedStr: string | undefined;
  let lenStr: string | undefined;
  let algoStr: string | undefined;
  for (const [key, value] of Object.entries(headers)) {
    const lk = key.toLowerCase();
    if (lk === "x-enc-seed") seedStr = value;
    else if (lk === "x-enc-len") lenStr = value;
    else if (lk === "x-enc-algo") algoStr = value;
  }
  if (seedStr === undefined || lenStr === undefined) return null;

  const seed = Number(seedStr);
  const len = Number(lenStr);
  // seed 0 (or anything invalid) means the image is served clean.
  if (!Number.isFinite(seed) || seed <= 0) return null;
  if (!Number.isFinite(len) || len <= 0) return null;

  const algo = parseInt(algoStr ?? "", 10);
  return { seed: seed >>> 0, len: Math.floor(len), algo: Number.isFinite(algo) ? algo : 1 };
}

export function decryptImage(data: ArrayBuffer, params: EncParams): ArrayBuffer {
  const bytes = new Uint8Array(data);
  const end = Math.min(params.len, bytes.length);
  if (params.algo === 2) {
    let s = (params.seed | 1) >>> 0;
    for (let i = 0; i < end; i++) {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      bytes[i]! ^= s & 0xff;
    }
    return bytes.buffer;
  }
  let x = params.seed >>> 0;
  for (let i = 0; i < end; i++) {
    x = (Math.imul(x, 1000005) + 0x499602d3) >>> 0;
    bytes[i]! ^= (x >>> 24) & 0xff;
  }
  return bytes.buffer;
}
