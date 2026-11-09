/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// Some mirror EPUBs contain UTF-8 bytes that were decoded once as Latin-1.
export const repairMojibake = (value: string): string => {
  let output = "";
  let index = 0;
  while (index < value.length) {
    const code = value.charCodeAt(index);
    if (code <= 0x7f || code > 0xff) {
      output += value[index];
      index++;
      continue;
    }

    let end = index;
    while (end < value.length) {
      const byte = value.charCodeAt(end);
      if (byte <= 0x7f || byte > 0xff) break;
      end++;
    }

    const bytes = new Uint8Array(end - index);
    for (let offset = 0; offset < bytes.length; offset++) {
      bytes[offset] = value.charCodeAt(index + offset);
    }
    // A run that isn't valid UTF-8 decodes to undefined, not U+FFFD; keep it as-is.
    const decoded: string | undefined = Application.arrayBufferToUTF8String(bytes.buffer);
    output += decoded && !decoded.includes("�") ? decoded : value.slice(index, end);
    index = end;
  }
  return output;
};
