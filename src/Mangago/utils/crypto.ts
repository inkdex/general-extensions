/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

export function extractImgsrcs(input: string): string | undefined {
  const match = /var\s+imgsrcs\s*=\s*["']([^"']+)["']/.exec(input);
  return match?.[1];
}

export function sojsonV4Decode(jsf: string): string {
  if (!jsf.startsWith("['sojson.v4']")) {
    throw new Error("Obfuscated code is not sojson.v4");
  }

  if (jsf.length < 299) {
    throw new Error("sojson input too short");
  }

  const argsStr = jsf.slice(240, jsf.length - 59);
  const parts = argsStr.split(/[a-zA-Z]+/g).filter(Boolean);

  return parts.map((x) => String.fromCharCode(Number(x))).join("");
}

export function findHexEncodedVariable(input: string, variable: string): string | undefined {
  const regex = new RegExp(
    `var\\s+${variable}\\s*=\\s*CryptoJS\\.enc\\.Hex\\.parse\\(["']([0-9a-fA-F]+)["']\\)`,
  );

  return regex.exec(input)?.[1];
}

export function decodeHex(hex: string): ArrayBuffer {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex length");

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }

  return bytes.buffer;
}

export async function aesCbcDecrypt(
  encrypted: ArrayBuffer,
  keyBytes: ArrayBuffer,
  ivBytes: ArrayBuffer,
): Promise<ArrayBuffer> {
  // Use `crypto.subtle`, the form the on-device polyfill exposes;
  // `new SubtleCrypto()` is an illegal constructor in JSCore.
  const subtle = crypto.subtle;

  // AES-CBC ciphertext must be a whole number of 16-byte blocks. Bail early with
  // a clear message rather than letting WebCrypto throw an opaque
  // InvalidAccessError on a truncated/corrupt blob.
  if (encrypted.byteLength === 0 || encrypted.byteLength % 16 !== 0) {
    throw new Error(`Invalid ciphertext length ${encrypted.byteLength} (not a multiple of 16)`);
  }

  const cryptoKey = await subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, [
    "encrypt",
    "decrypt",
  ]);

  const ciphertext = new Uint8Array(encrypted);

  // Mangago uses zero-byte padding, but WebCrypto AES-CBC only supports PKCS#7
  // and throws on zero-padded data. Append one synthetic block that decrypts to
  // a full PKCS#7 pad block so WebCrypto strips exactly that, then strip the
  // trailing zeros ourselves.
  const lastBlock = ciphertext.slice(ciphertext.length - 16);
  const padBlock = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    padBlock[i] = 0x10 ^ (lastBlock[i] ?? 0);
  }

  const zeroIv = new Uint8Array(16);
  const encryptedPad = new Uint8Array(
    await subtle.encrypt({ name: "AES-CBC", iv: zeroIv.buffer }, cryptoKey, padBlock.buffer),
  );

  const extended = new Uint8Array(ciphertext.length + 16);
  extended.set(ciphertext, 0);
  extended.set(encryptedPad.slice(0, 16), ciphertext.length);

  const decrypted = new Uint8Array(
    await subtle.decrypt({ name: "AES-CBC", iv: ivBytes }, cryptoKey, extended.buffer),
  );

  let end = decrypted.length;
  while (end > 0 && decrypted[end - 1] === 0) end--;

  return decrypted.slice(0, end).buffer;
}

export function base64ToArrayBuffer(value: string): ArrayBuffer {
  const decoded = Application.base64Decode(value);

  if (typeof decoded === "string") {
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes.buffer;
  }

  return decoded;
}

function findKeyLocations(js: string): number[] {
  const locations: number[] = [];
  let i = 0;
  const pattern = "str.charAt(";

  while (true) {
    const found = js.indexOf(pattern, i);
    if (found < 0) break;

    let idx = found + pattern.length;

    while (idx < js.length && !/[0-9]/.test(js[idx] ?? "")) idx++;

    const start = idx;

    while (idx < js.length && /[0-9]/.test(js[idx] ?? "")) idx++;

    const num = Number(js.slice(start, idx));

    if (Number.isFinite(num) && !locations.includes(num)) {
      locations.push(num);
    }

    i = idx;
  }

  return locations;
}

function unscrambleChars(chars: string[], keys: number[]): void {
  for (const key of [...keys].reverse()) {
    const len = chars.length;

    for (let i = len - 1; i >= key; i--) {
      if (i % 2 !== 0) {
        const a = i - key;
        const b = i;
        const tmp = chars[a]!;
        chars[a] = chars[b]!;
        chars[b] = tmp;
      }
    }
  }
}

export function unscrambleImageList(imageList: string, js: string): string {
  const chars = imageList.split("");
  const keyLocations = findKeyLocations(js);
  const unscrambleKey: number[] = [];

  for (const loc of keyLocations) {
    const digit = chars[loc];
    if (!digit || !/[0-9]/.test(digit)) return imageList;
    unscrambleKey.push(Number(digit));
  }

  // Remove the key digits at their original positions, highest first so an
  // earlier splice doesn't shift the remaining indices — findKeyLocations
  // returns positions in JS-source order, not necessarily ascending.
  [...keyLocations]
    .sort((a, b) => b - a)
    .forEach((loc) => {
      if (loc >= 0 && loc < chars.length) chars.splice(loc, 1);
    });

  unscrambleChars(chars, unscrambleKey);
  return chars.join("");
}

export function findCols(input: string): number {
  const match = /var\s+widthnum\s*=\s*heightnum\s*=\s*(\d+)/.exec(input);
  return match ? Number(match[1]) : 0;
}

const REPLACE_POS_JS = `
function replacePos(strObj, pos, replacetext) {
  var str = strObj.substr(0, pos) + replacetext + strObj.substring(pos + 1, strObj.length);
  return str;
}
`;

const JS_FILTERS = [
  "jQuery",
  "document",
  "getContext",
  "toDataURL",
  "getImageData",
  "width",
  "height",
];

export function getDescramblingKey(deobfChapterJs: string, imageUrl: string): string {
  const splitA = deobfChapterJs.split("var renImg = function(img,width,height,id){");
  if (splitA.length < 2) throw new Error("renImg pattern not found");

  const splitB = splitA[1]!.split("key = key.split(");
  if (splitB.length < 2) throw new Error("key split pattern not found");

  const before = splitB[0]!;

  const imgkeys = before
    .split("\n")
    .filter((line) => JS_FILTERS.every((f) => !line.includes(f)))
    .join("\n")
    .replaceAll("img.src", "url");

  const scriptText = `
${REPLACE_POS_JS}
function getDescramblingKeyInner(url) {
  ${imgkeys}
  return key;
}
return getDescramblingKeyInner(${JSON.stringify(imageUrl)});
`;

  const functionConstructor = globalThis.Function;
  return functionConstructor(scriptText)() as string;
}
