/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { PaperbackInterceptor, type Request, type Response } from "@paperback/types";

import { MANGADEX_API, MANGADEX_DOMAIN } from "../implementations/shared/models";
import type { MangaDexError } from "../implementations/shared/models";
import { getAccessToken, refreshSession, saveAccessToken } from "../implementations/shared/state";
import { parseJSONBody } from "../implementations/shared/utils";

const IMAGE_URL_RE = /\.(png|gif|jpeg|jpg|webp)(\?|$)/i;

export class MangaDexInterceptor extends PaperbackInterceptor {
  override async interceptRequest(request: Request): Promise<Request> {
    // Impossible to have undefined headers, ensured by the app
    request.headers = {
      ...request.headers,
      referer: `${MANGADEX_DOMAIN}/`,
    };

    let accessToken = getAccessToken();
    // Bearer only on MangaDex API. Trailing slash blocks "api.mangadex.org.evil.example".
    if (
      !accessToken ||
      !request.url.startsWith(MANGADEX_API + "/") ||
      IMAGE_URL_RE.test(request.url)
    ) {
      return request;
    }

    // 60s pad against in flight expiry. exp is epoch seconds, so a non numeric
    // or implausibly small value means a corrupt token and counts as expired.
    const expSeconds = Number(accessToken.tokenBody.exp);
    const expValid = Number.isFinite(expSeconds) && expSeconds > 1_000_000_000;
    const expired = !expValid || expSeconds <= Date.now() / 1000 + 60;
    if (expired) {
      if (!accessToken.refreshToken) {
        // No refresh token. Clear session for a clean logged out state.
        saveAccessToken(undefined, undefined);
        return request;
      }
      const outcome = await refreshSession(accessToken.refreshToken);
      switch (outcome.kind) {
        case "rotated":
        case "racedRotation":
          accessToken = outcome.token;
          break;
        case "racedLogout":
        case "loggedOut":
          return request;
        case "transient":
          // Refresh hit a transient error (auth endpoint down, network blip)
          console.log(`[MangaDex] Token refresh transient error: ${outcome.message}`);
          return request;
      }
    }

    request.headers = {
      ...request.headers,
      Authorization: "Bearer " + accessToken.accessToken,
    };
    return request;
  }

  override async interceptResponse(
    _request: Request,
    _response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    // No response rewriting needed. Status handling lives in fetchJSON.
    return data;
  }
}

interface MangaDexErrorEnvelope {
  result?: string;
  errors?: MangaDexError[];
}

// Normalize to a real Error
function normalizeRequestError(err: unknown, url: string): Error {
  if (err instanceof Error) return err;
  const native = err as { localizedDescription?: unknown; message?: unknown } | null;
  const detail =
    (typeof native?.localizedDescription === "string" && native.localizedDescription) ||
    (typeof native?.message === "string" && native.message) ||
    String(err);
  // Drop the query string so the giant ids[] URLs do not bloat the message.
  const endpoint = url.split("?")[0];
  return new Error(`MangaDex request failed for ${endpoint}: ${detail}`);
}

// Server side revocation (logout elsewhere, ban, Keycloak session reset) rejects a
// token whose exp is still in the future, so interceptRequest never refreshes it.
async function refreshAfterUnauthorized(): Promise<boolean> {
  const token = getAccessToken();
  if (!token) return false;
  if (!token.refreshToken) {
    saveAccessToken(undefined, undefined);
    return false;
  }
  const outcome = await refreshSession(token.refreshToken);
  return outcome.kind === "rotated" || outcome.kind === "racedRotation";
}

async function fetchJSONInternal<T>(request: Request, allowAuthRetry: boolean): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest(request).catch(
    (err: unknown): never => {
      throw normalizeRequestError(err, request.url);
    },
  );
  const data = Application.arrayBufferToUTF8String(buffer);
  const json = parseJSONBody<T & MangaDexErrorEnvelope>(data, response.status);

  if (
    response.status === 401 &&
    allowAuthRetry &&
    request.url.startsWith(MANGADEX_API + "/") &&
    (await refreshAfterUnauthorized())
  ) {
    return fetchJSONInternal<T>(request, false);
  }

  if (json?.result === "error" || response.status >= 400) {
    const errors = Array.isArray(json?.errors) ? json.errors : [];
    const summary =
      errors.length > 0
        ? errors.map((e) => `[${e.status}] ${e.detail ?? e.title ?? "error"}`).join("; ")
        : `HTTP ${response.status}`;
    throw new Error(`MangaDex API Error: ${summary}`);
  }
  return json as T;
}

export function fetchJSON<T>(request: Request): Promise<T> {
  return fetchJSONInternal<T>(request, true);
}
