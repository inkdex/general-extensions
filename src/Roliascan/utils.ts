/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { DOMAIN } from "./models";

export function fixImageUrl(url: string): string {
  if (!url || url.trim() === "") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("//")) return "https:" + trimmed;
  if (trimmed.startsWith("http://")) return "https://" + trimmed.slice(7);
  if (trimmed.startsWith("/")) return DOMAIN + trimmed;
  return trimmed;
}

export function generateChapterToken(): { token: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const now = new Date();
  const hour =
    now.getUTCFullYear().toString() +
    (now.getUTCMonth() + 1).toString().padStart(2, "0") +
    now.getUTCDate().toString().padStart(2, "0") +
    now.getUTCHours().toString().padStart(2, "0");
  const secret = "mng_ch_" + hour;
  return { token: md5(timestamp.toString() + secret).substring(0, 16), timestamp };
}

/* eslint-disable -- MD5 implementation ported from the site's manga.js */
function md5(string: string): string {
  function rotateLeft(value: number, shift: number) {
    return (value << shift) | (value >>> (32 - shift));
  }
  function addUnsigned(x: number, y: number) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function md5F(x: number, y: number, z: number) {
    return (x & y) | (~x & z);
  }
  function md5G(x: number, y: number, z: number) {
    return (x & z) | (y & ~z);
  }
  function md5H(x: number, y: number, z: number) {
    return x ^ y ^ z;
  }
  function md5I(x: number, y: number, z: number) {
    return y ^ (x | ~z);
  }
  function md5FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function md5GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function md5HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function md5II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function convertToWordArray(str: string) {
    const msgLen = str.length;
    const temp1 = msgLen + 8;
    const temp2 = (temp1 - (temp1 % 64)) / 64;
    const numWords = (temp2 + 1) * 16;
    const wordArray: number[] = Array(numWords - 1);
    let bytePos = 0;
    let byteCount = 0;
    let wordCount: number;
    while (byteCount < msgLen) {
      wordCount = (byteCount - (byteCount % 4)) / 4;
      bytePos = (byteCount % 4) * 8;
      wordArray[wordCount] = wordArray[wordCount]! | (str.charCodeAt(byteCount) << bytePos);
      byteCount++;
    }
    wordCount = (byteCount - (byteCount % 4)) / 4;
    bytePos = (byteCount % 4) * 8;
    wordArray[wordCount] = wordArray[wordCount]! | (0x80 << bytePos);
    wordArray[numWords - 2] = msgLen << 3;
    wordArray[numWords - 1] = msgLen >>> 29;
    return wordArray;
  }
  function wordToHex(value: number) {
    let result = "";
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      const temp = "0" + byte.toString(16);
      result += temp.substring(temp.length - 2, temp.length);
    }
    return result;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301,
    b = 0xefcdab89,
    c = 0x98badcfe,
    d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a,
      BB = b,
      CC = c,
      DD = d;
    a = md5FF(a, b, c, d, x[k]!, 7, 0xd76aa478);
    d = md5FF(d, a, b, c, x[k + 1]!, 12, 0xe8c7b756);
    c = md5FF(c, d, a, b, x[k + 2]!, 17, 0x242070db);
    b = md5FF(b, c, d, a, x[k + 3]!, 22, 0xc1bdceee);
    a = md5FF(a, b, c, d, x[k + 4]!, 7, 0xf57c0faf);
    d = md5FF(d, a, b, c, x[k + 5]!, 12, 0x4787c62a);
    c = md5FF(c, d, a, b, x[k + 6]!, 17, 0xa8304613);
    b = md5FF(b, c, d, a, x[k + 7]!, 22, 0xfd469501);
    a = md5FF(a, b, c, d, x[k + 8]!, 7, 0x698098d8);
    d = md5FF(d, a, b, c, x[k + 9]!, 12, 0x8b44f7af);
    c = md5FF(c, d, a, b, x[k + 10]!, 17, 0xffff5bb1);
    b = md5FF(b, c, d, a, x[k + 11]!, 22, 0x895cd7be);
    a = md5FF(a, b, c, d, x[k + 12]!, 7, 0x6b901122);
    d = md5FF(d, a, b, c, x[k + 13]!, 12, 0xfd987193);
    c = md5FF(c, d, a, b, x[k + 14]!, 17, 0xa679438e);
    b = md5FF(b, c, d, a, x[k + 15]!, 22, 0x49b40821);
    a = md5GG(a, b, c, d, x[k + 1]!, 5, 0xf61e2562);
    d = md5GG(d, a, b, c, x[k + 6]!, 9, 0xc040b340);
    c = md5GG(c, d, a, b, x[k + 11]!, 14, 0x265e5a51);
    b = md5GG(b, c, d, a, x[k]!, 20, 0xe9b6c7aa);
    a = md5GG(a, b, c, d, x[k + 5]!, 5, 0xd62f105d);
    d = md5GG(d, a, b, c, x[k + 10]!, 9, 0x02441453);
    c = md5GG(c, d, a, b, x[k + 15]!, 14, 0xd8a1e681);
    b = md5GG(b, c, d, a, x[k + 4]!, 20, 0xe7d3fbc8);
    a = md5GG(a, b, c, d, x[k + 9]!, 5, 0x21e1cde6);
    d = md5GG(d, a, b, c, x[k + 14]!, 9, 0xc33707d6);
    c = md5GG(c, d, a, b, x[k + 3]!, 14, 0xf4d50d87);
    b = md5GG(b, c, d, a, x[k + 8]!, 20, 0x455a14ed);
    a = md5GG(a, b, c, d, x[k + 13]!, 5, 0xa9e3e905);
    d = md5GG(d, a, b, c, x[k + 2]!, 9, 0xfcefa3f8);
    c = md5GG(c, d, a, b, x[k + 7]!, 14, 0x676f02d9);
    b = md5GG(b, c, d, a, x[k + 12]!, 20, 0x8d2a4c8a);
    a = md5HH(a, b, c, d, x[k + 5]!, 4, 0xfffa3942);
    d = md5HH(d, a, b, c, x[k + 8]!, 11, 0x8771f681);
    c = md5HH(c, d, a, b, x[k + 11]!, 16, 0x6d9d6122);
    b = md5HH(b, c, d, a, x[k + 14]!, 23, 0xfde5380c);
    a = md5HH(a, b, c, d, x[k + 1]!, 4, 0xa4beea44);
    d = md5HH(d, a, b, c, x[k + 4]!, 11, 0x4bdecfa9);
    c = md5HH(c, d, a, b, x[k + 7]!, 16, 0xf6bb4b60);
    b = md5HH(b, c, d, a, x[k + 10]!, 23, 0xbebfbc70);
    a = md5HH(a, b, c, d, x[k + 13]!, 4, 0x289b7ec6);
    d = md5HH(d, a, b, c, x[k]!, 11, 0xeaa127fa);
    c = md5HH(c, d, a, b, x[k + 3]!, 16, 0xd4ef3085);
    b = md5HH(b, c, d, a, x[k + 6]!, 23, 0x04881d05);
    a = md5HH(a, b, c, d, x[k + 9]!, 4, 0xd9d4d039);
    d = md5HH(d, a, b, c, x[k + 12]!, 11, 0xe6db99e5);
    c = md5HH(c, d, a, b, x[k + 15]!, 16, 0x1fa27cf8);
    b = md5HH(b, c, d, a, x[k + 2]!, 23, 0xc4ac5665);
    a = md5II(a, b, c, d, x[k]!, 6, 0xf4292244);
    d = md5II(d, a, b, c, x[k + 7]!, 10, 0x432aff97);
    c = md5II(c, d, a, b, x[k + 14]!, 15, 0xab9423a7);
    b = md5II(b, c, d, a, x[k + 5]!, 21, 0xfc93a039);
    a = md5II(a, b, c, d, x[k + 12]!, 6, 0x655b59c3);
    d = md5II(d, a, b, c, x[k + 3]!, 10, 0x8f0ccc92);
    c = md5II(c, d, a, b, x[k + 10]!, 15, 0xffeff47d);
    b = md5II(b, c, d, a, x[k + 1]!, 21, 0x85845dd1);
    a = md5II(a, b, c, d, x[k + 8]!, 6, 0x6fa87e4f);
    d = md5II(d, a, b, c, x[k + 15]!, 10, 0xfe2ce6e0);
    c = md5II(c, d, a, b, x[k + 6]!, 15, 0xa3014314);
    b = md5II(b, c, d, a, x[k + 13]!, 21, 0x4e0811a1);
    a = md5II(a, b, c, d, x[k + 4]!, 6, 0xf7537e82);
    d = md5II(d, a, b, c, x[k + 11]!, 10, 0xbd3af235);
    c = md5II(c, d, a, b, x[k + 2]!, 15, 0x2ad7d2bb);
    b = md5II(b, c, d, a, x[k + 9]!, 21, 0xeb86d391);
    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}
/* eslint-enable */
