/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export class ComixHash {
  private static KEYS: string[] = [
    "JxTcdyiA5GZxnbrmthXBQfU2IMTKcY1+3nNhbq98Sgo=",
    "3PordjODbhqla382Cxapmo/1JiABJQcjiJj1+48gTJ4=",
    "OaKvnI5ARA==",
    "MHNBHYWA7lvy867fXgvGcJwWDk79KqUJUVFsh3RwnnI=",
    "8i0Cru/VJBSVB2Y1GcMDVpzx2WepOcfnWdd81yxICl4=",
    "Fyskubz8VvA=",
    "B46L1x+UeWP+19cRpQ+OZvdLAK9EHID8g3mSgn57tew=",
    "DTSTmUt6LpDUw9r1lSQqyb3YlFTzruT8tk8wUGkwehQ=",
    "vY/meeI=",
    "7xWfIF5THL5LAnRgAARg+4mjWHPU9n3PQwvzbaMNi+Q=",
    "bewtiTuV+HJk56xxkf2iCljLgruCpBmN9BgE8i6gc9M=",
    "/Xcb2zAu8AU=",
    "WgeCQ3T8R51uTwVSiVa7Zy0dN6JOg6Z5JleMS+HV8Aw=",
    "yXayUVFrrcW56jQCEfZzuCidjpnWKjTDUNT7XeX9i7k=",
    "tSLco2w=",
  ];

  private static getKeyBytes(index: number): number[] {
    const b64 = this.KEYS[index];
    if (!b64) return [];

    try {
      const decoded = Application.base64Decode(b64);
      if (typeof decoded === "string") {
        const bytes: number[] = [];
        for (let i = 0; i < decoded.length; i++) {
          bytes.push(decoded.charCodeAt(i) & 0xff);
        }
        return bytes;
      }
      return Array.from(new Uint8Array(decoded));
    } catch {
      return [];
    }
  }

  private static rc4(key: number[], data: number[]): number[] {
    if (key.length === 0) return [...data];

    const s = Array.from({ length: 256 }, (_, i) => i);

    let j = 0;

    for (let i = 0; i < 256; i++) {
      j = (j + s[i] + key[i % key.length]) % 256;
      [s[i], s[j]] = [s[j], s[i]];
    }

    let i = 0;
    j = 0;

    const out = Array.from<number>({ length: data.length });

    for (let k = 0; k < data.length; k++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;

      [s[i], s[j]] = [s[j], s[i]];

      out[k] = data[k] ^ s[(s[i] + s[j]) % 256];
    }

    return out;
  }

  private static getMutKey(mk: number[], idx: number): number {
    return mk.length > 0 && idx % 32 < mk.length ? mk[idx % 32] : 0;
  }

  private static opShiftRight7Left1(e: number): number {
    e &= 255;
    return ((e >>> 7) | (e << 1)) & 255;
  }

  private static opShiftLeft1Right7(e: number): number {
    e &= 255;
    return ((e << 1) | (e >>> 7)) & 255;
  }

  private static opShiftRight2Left6(e: number): number {
    e &= 255;
    return ((e >>> 2) | (e << 6)) & 255;
  }

  private static opShiftLeft4Right4(e: number): number {
    e &= 255;
    return ((e << 4) | (e >>> 4)) & 255;
  }

  private static opShiftRight4Left4(e: number): number {
    e &= 255;
    return ((e >>> 4) | (e << 4)) & 255;
  }

  private static mutate(
    data: number[],
    mutKey: number[],
    prefKey: number[],
    prefKeyLimit: number,
    round: number,
  ): number[] {
    const out: number[] = [];

    for (let o = 0; o < data.length; o++) {
      if (o < prefKeyLimit && o < prefKey.length) {
        out.push(prefKey[o]);
      }

      let n = data[o] ^ this.getMutKey(mutKey, o);

      switch (round) {
        case 1:
          switch (o % 10) {
            case 0:
              n = this.opShiftRight7Left1(n);
              break;
            case 1:
              n ^= 37;
              break;
            case 2:
              n ^= 81;
              break;
            case 3:
              n ^= 147;
              break;
            case 4:
              n = this.opShiftRight2Left6(n);
              break;
            case 5:
            case 8:
              n = this.opShiftRight4Left4(n);
              break;
            case 6:
              n ^= 218;
              break;
            case 7:
              n = (n + 159) & 255;
              break;
            case 9:
              n ^= 180;
              break;
          }
          break;

        case 2:
          switch (o % 10) {
            case 0:
            case 9:
              n ^= 180;
              break;
            case 1:
              n = this.opShiftLeft1Right7(n);
              break;
            case 2:
              n ^= 147;
              break;
            case 3:
              n = this.opShiftRight7Left1(n);
              break;
            case 4:
              n = this.opShiftRight2Left6(n);
              break;
            case 5:
              n = this.opShiftRight4Left4(n);
              break;
            case 6:
            case 8:
              n = (n + 159) & 255;
              break;
            case 7:
              n = (n + 34) & 255;
              break;
          }
          break;

        case 3:
          switch (o % 10) {
            case 0:
              n ^= 81;
              break;
            case 1:
              n = this.opShiftRight4Left4(n);
              break;
            case 2:
            case 9:
              n = this.opShiftLeft4Right4(n);
              break;
            case 3:
              n ^= 37;
              break;
            case 4:
              n = (n + 159) & 255;
              break;
            case 5:
              n = this.opShiftLeft1Right7(n);
              break;
            case 6:
              n ^= 180;
              break;
            case 7:
              n = (n + 34) & 255;
              break;
            case 8:
              n = this.opShiftRight2Left6(n);
              break;
          }
          break;

        case 4:
          switch (o % 10) {
            case 0:
            case 7:
              n ^= 218;
              break;
            case 1:
            case 4:
              n = this.opShiftLeft1Right7(n);
              break;
            case 2:
              n = this.opShiftRight7Left1(n);
              break;
            case 3:
              n = (n + 159) & 255;
              break;
            case 5:
            case 8:
              n ^= 180;
              break;
            case 6:
              n ^= 147;
              break;
            case 9:
              n ^= 37;
              break;
          }
          break;

        case 5:
          switch (o % 10) {
            case 0:
              n = this.opShiftLeft4Right4(n);
              break;
            case 1:
            case 3:
              n ^= 147;
              break;
            case 2:
              n = (n + 34) & 255;
              break;
            case 4:
            case 9:
              n ^= 218;
              break;
            case 5:
            case 7:
              n = this.opShiftLeft1Right7(n);
              break;
            case 6:
              n ^= 180;
              break;
            case 8:
              n = this.opShiftRight2Left6(n);
              break;
          }
          break;
      }

      out.push(n & 255);
    }

    return out;
  }

  private static round1(data: number[]): number[] {
    const mut = this.mutate(data, this.getKeyBytes(1), this.getKeyBytes(2), 7, 1);

    return this.rc4(this.getKeyBytes(0), mut);
  }

  private static round2(data: number[]): number[] {
    const mut = this.mutate(data, this.getKeyBytes(4), this.getKeyBytes(5), 8, 2);

    return this.rc4(this.getKeyBytes(3), mut);
  }

  private static round3(data: number[]): number[] {
    const mut = this.mutate(data, this.getKeyBytes(7), this.getKeyBytes(8), 5, 3);

    return this.rc4(this.getKeyBytes(6), mut);
  }

  private static round4(data: number[]): number[] {
    const mut = this.mutate(data, this.getKeyBytes(10), this.getKeyBytes(11), 8, 4);

    return this.rc4(this.getKeyBytes(9), mut);
  }

  private static round5(data: number[]): number[] {
    const mut = this.mutate(data, this.getKeyBytes(13), this.getKeyBytes(14), 5, 5);

    return this.rc4(this.getKeyBytes(12), mut);
  }

  private static encodeURIComponentCustom(str: string): string {
    return encodeURIComponent(str).replace(/\+/g, "%20").replace(/\*/g, "%2A").replace(/%7E/g, "~");
  }

  public static generateHash(path: string): string {
    const encoded = this.encodeURIComponentCustom(path);

    const initialBytes = Array.from(new TextEncoder().encode(encoded)).map((b) => b & 0xff);

    const r1 = this.round1(initialBytes);
    const r2 = this.round2(r1);
    const r3 = this.round3(r2);
    const r4 = this.round4(r3);
    const r5 = this.round5(r4);

    const encodedResult = Application.base64Encode(new Uint8Array(r5).buffer);

    let b64: string;

    if (typeof encodedResult === "string") {
      b64 = encodedResult;
    } else {
      b64 = Array.from(new Uint8Array(encodedResult))
        .map((b) => String.fromCharCode(b))
        .join("");
    }

    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
}
