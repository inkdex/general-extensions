/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { BasicRateLimiter } from "@paperback/types";

export const mainRateLimiter = new BasicRateLimiter("main", {
  numberOfRequests: (Application.getState("RateFilter") as number | undefined) ?? 5,
  bufferInterval: 0.5,
  ignoreImages: true,
});

export async function fetchHTML(url: string): Promise<string> {
  const data = (await Application.scheduleRequest({ url, method: "GET" }))[1];
  return Application.arrayBufferToUTF8String(data);
}
