/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export class ComixHash {
  private static KEYS: string[] = [
    "13YDu67uDgFczo3DnuTIURqas4lfMEPADY6Jaeqky+w=",
    "yEy7wBfBc+gsYPiQL/4Dfd0pIBZFzMwrtlRQGwMXy3Q=",
    "yrP+EVA1Dw==",
    "vZ23RT7pbSlxwiygkHd1dhToIku8SNHPC6V36L4cnwM=",
    "QX0sLahOByWLcWGnv6l98vQudWqdRI3DOXBdit9bxCE=",
    "WJwgqCmf",
    "BkWI8feqSlDZKMq6awfzWlUypl88nz65KVRmpH0RWIc=",
    "v7EIpiQQjd2BGuJzMbBA0qPWDSS+wTJRQ7uGzZ6rJKs=",
    "1SUReYlCRA==",
    "RougjiFHkSKs20DZ6BWXiWwQUGZXtseZIyQWKz5eG34=",
    "LL97cwoDoG5cw8QmhI+KSWzfW+8VehIh+inTxnVJ2ps=",
    "52iDqjzlqe8=",
    "U9LRYFL2zXU4TtALIYDj+lCATRk/EJtH7/y7qYYNlh8=",
    "e/GtffFDTvnw7LBRixAD+iGixjqTq9kIZ1m0Hj+s6fY=",
    "xb2XwHNB",
  ];

  private static getKeyBytes(index: number): number[] {
    const b64 = this.KEYS[index];
    if (!b64) return [];
    try {
      return Array.from(Buffer.from(b64, "base64"));
    } catch {
      return [];
    }
  }

  private static rc4(key: number[], data: number[]): number[] {
    if (key.length === 0) return data;

    const s = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;

    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + key[i % key.length]) % 256;
      [s[i], s[j]] = [s[j], s[i]];
    }

    let i = 0;
    j = 0;
    const out: number[] = [];

    for (let k = 0; k < data.length; k++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      [s[i], s[j]] = [s[j], s[i]];
      const val = s[(s[i] + s[j]) % 256];
      out.push(data[k] ^ val);
    }

    return out;
  }

  private static mutS(e: number) {
    return (e + 143) % 256;
  }
  private static mutL(e: number) {
    return ((e >>> 1) | (e << 7)) & 255;
  }
  private static mutC(e: number) {
    return (e + 115) % 256;
  }
  private static mutM(e: number) {
    return e ^ 177;
  }
  private static mutF(e: number) {
    return (e - 188 + 256) % 256;
  }
  private static mutG(e: number) {
    return ((e << 2) | (e >>> 6)) & 255;
  }
  private static mutH(e: number) {
    return (e - 42 + 256) % 256;
  }
  private static mutDollar(e: number) {
    return ((e << 4) | (e >>> 4)) & 255;
  }
  private static mutB(e: number) {
    return (e - 12 + 256) % 256;
  }
  private static mutUnderscore(e: number) {
    return (e - 20 + 256) % 256;
  }
  private static mutY(e: number) {
    return ((e >>> 1) | (e << 7)) & 255;
  }
  private static mutK(e: number) {
    return (e - 241 + 256) % 256;
  }

  private static getMutKey(mk: number[], idx: number): number {
    if (!mk.length) return 0;
    return mk[idx % 32] ?? 0;
  }

  private static round1(data: number[]): number[] {
    const enc = this.rc4(this.getKeyBytes(0), data);
    const mutKey = this.getKeyBytes(1);
    const prefKey = this.getKeyBytes(2);

    const out: number[] = [];

    for (let i = 0; i < enc.length; i++) {
      if (i < 7 && i < prefKey.length) out.push(prefKey[i]);

      let v = enc[i] ^ this.getMutKey(mutKey, i);

      switch (i % 10) {
        case 0:
        case 9:
          v = this.mutC(v);
          break;
        case 1:
          v = this.mutB(v);
          break;
        case 2:
          v = this.mutY(v);
          break;
        case 3:
          v = this.mutDollar(v);
          break;
        case 4:
        case 6:
          v = this.mutH(v);
          break;
        case 5:
          v = this.mutS(v);
          break;
        case 7:
          v = this.mutK(v);
          break;
        case 8:
          v = this.mutL(v);
          break;
      }

      out.push(v & 255);
    }

    return out;
  }

  private static round2(data: number[]): number[] {
    const enc = this.rc4(this.getKeyBytes(3), data);
    const mutKey = this.getKeyBytes(4);
    const prefKey = this.getKeyBytes(5);

    const out: number[] = [];

    for (let i = 0; i < enc.length; i++) {
      if (i < 6 && i < prefKey.length) out.push(prefKey[i]);

      let v = enc[i] ^ this.getMutKey(mutKey, i);

      switch (i % 10) {
        case 0:
        case 8:
          v = this.mutC(v);
          break;
        case 1:
          v = this.mutB(v);
          break;
        case 2:
        case 6:
          v = this.mutDollar(v);
          break;
        case 3:
          v = this.mutH(v);
          break;
        case 4:
        case 9:
          v = this.mutS(v);
          break;
        case 5:
          v = this.mutK(v);
          break;
        case 7:
          v = this.mutUnderscore(v);
          break;
      }

      out.push(v & 255);
    }

    return out;
  }

  private static round3(data: number[]): number[] {
    const enc = this.rc4(this.getKeyBytes(6), data);
    const mutKey = this.getKeyBytes(7);
    const prefKey = this.getKeyBytes(8);

    const out: number[] = [];

    for (let i = 0; i < enc.length; i++) {
      if (i < 7 && i < prefKey.length) out.push(prefKey[i]);

      let v = enc[i] ^ this.getMutKey(mutKey, i);

      switch (i % 10) {
        case 0:
          v = this.mutC(v);
          break;
        case 1:
          v = this.mutF(v);
          break;
        case 2:
        case 8:
          v = this.mutS(v);
          break;
        case 3:
          v = this.mutG(v);
          break;
        case 4:
          v = this.mutY(v);
          break;
        case 5:
          v = this.mutM(v);
          break;
        case 6:
          v = this.mutDollar(v);
          break;
        case 7:
          v = this.mutK(v);
          break;
        case 9:
          v = this.mutB(v);
          break;
      }

      out.push(v & 255);
    }

    return out;
  }

  private static round4(data: number[]): number[] {
    const enc = this.rc4(this.getKeyBytes(9), data);
    const mutKey = this.getKeyBytes(10);
    const prefKey = this.getKeyBytes(11);

    const out: number[] = [];

    for (let i = 0; i < enc.length; i++) {
      if (i < 8 && i < prefKey.length) out.push(prefKey[i]);

      let v = enc[i] ^ this.getMutKey(mutKey, i);

      switch (i % 10) {
        case 0:
          v = this.mutB(v);
          break;
        case 1:
        case 9:
          v = this.mutM(v);
          break;
        case 2:
        case 7:
          v = this.mutL(v);
          break;
        case 3:
        case 5:
          v = this.mutS(v);
          break;
        case 4:
        case 6:
          v = this.mutUnderscore(v);
          break;
        case 8:
          v = this.mutY(v);
          break;
      }

      out.push(v & 255);
    }

    return out;
  }

  private static round5(data: number[]): number[] {
    const enc = this.rc4(this.getKeyBytes(12), data);
    const mutKey = this.getKeyBytes(13);
    const prefKey = this.getKeyBytes(14);

    const out: number[] = [];

    for (let i = 0; i < enc.length; i++) {
      if (i < 6 && i < prefKey.length) out.push(prefKey[i]);

      let v = enc[i] ^ this.getMutKey(mutKey, i);

      switch (i % 10) {
        case 0:
          v = this.mutUnderscore(v);
          break;
        case 1:
        case 7:
          v = this.mutS(v);
          break;
        case 2:
          v = this.mutC(v);
          break;
        case 3:
        case 5:
          v = this.mutM(v);
          break;
        case 4:
          v = this.mutB(v);
          break;
        case 6:
          v = this.mutF(v);
          break;
        case 8:
          v = this.mutDollar(v);
          break;
        case 9:
          v = this.mutG(v);
          break;
      }

      out.push(v & 255);
    }

    return out;
  }

  private static encodeURIComponentCustom(str: string): string {
    return encodeURIComponent(str).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~");
  }

  public static generateHash(path: string, bodySize: number = 0, time: number = 1): string {
    const baseString = `${path}:${bodySize}:${time}`;

    const encoded = this.encodeURIComponentCustom(baseString);

    const initialBytes = Array.from(Buffer.from(encoded, "ascii"));

    const r1 = this.round1(initialBytes);
    const r2 = this.round2(r1);
    const r3 = this.round3(r2);
    const r4 = this.round4(r3);
    const r5 = this.round5(r4);

    const finalBytes = Buffer.from(r5);

    return finalBytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
}
