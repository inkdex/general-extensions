import type { QToonComic } from "./models";

// resolves the preferred public ID for a comic (webLinkId over csid)
export function comicId(comic: QToonComic): string {
  return comic.webLinkId || comic.csid;
}

export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      );
    });
  });
}

const DID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz23456789";

export function generateDid(length = 24): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += DID_CHARS.charAt(Math.floor(Math.random() * DID_CHARS.length));
  }
  return result;
}

export function md5(input: string): string {
  const encoder = new TextEncoder();
  const array = encoder.encode(input);
  // @ts-expect-error (remove this once method is in types)
  return Application.crypto_md5Hash(array.buffer);
}

async function aesDecrypt(data: string, key: string, iv: string): Promise<string> {
  const subtle = new SubtleCrypto();
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const ivBytes = encoder.encode(iv);
  const cryptoKey = await subtle.importKey("raw", keyBytes.buffer, { name: "AES-CBC" }, false, [
    "decrypt",
  ]);
  const cipherBuffer = Application.base64Decode(data) as unknown as ArrayBuffer;
  const decrypted = await subtle.decrypt(
    { name: "AES-CBC", iv: ivBytes.buffer },
    cryptoKey,
    cipherBuffer,
  );
  return new TextDecoder().decode(decrypted);
}

export async function decryptResponse(data: string, ts: number, did: string): Promise<string> {
  const inner = md5(`${did}${ts}`);
  const outer = md5(`${inner}OQlM9JBJgLWsgffb`); // API response decryption salt
  const key = outer.substring(0, 16);
  const iv = outer.substring(16, 32);
  return await aesDecrypt(data, key, iv);
}

export async function decryptImageUrl(url: string, did: string): Promise<string> {
  const inner = md5(did);
  const outer = md5(`${inner}9tv86uBwmOYs7QZ0`); // image URL decryption salt
  const key = outer.substring(0, 16);
  const iv = outer.substring(16, 32);
  return await aesDecrypt(url, key, iv);
}
