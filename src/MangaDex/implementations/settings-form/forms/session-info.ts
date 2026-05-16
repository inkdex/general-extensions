/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, LabelRow, Section, type FormSectionElement } from "@paperback/types";

import { authEndpointRequest, getAccessToken, saveAccessToken } from "../../shared/state";

export class SessionInfoForm extends Form {
  // Transient "Successfully logged out" view. Cleared by any render with a valid token.
  private justLoggedOut = false;
  private onAuthChanged: () => void;

  constructor(onAuthChanged: () => void) {
    super();
    this.onAuthChanged = onAuthChanged;
  }

  override getSections(): FormSectionElement<unknown>[] {
    const accessToken = getAccessToken();

    if (accessToken) {
      this.justLoggedOut = false;
      return [
        Section(
          {
            id: "introspect",
            footer: Object.entries(accessToken.tokenBody)
              .map(([key, value]) =>
                typeof value === "object" && value !== null
                  ? `${key}: ${JSON.stringify(value, null, 2)}`
                  : `${key}: ${String(value)}`,
              )
              .join("\n"),
          },
          [],
        ),
        Section("account_actions", [
          ButtonRow("refresh_token_button", {
            title: "Refresh Token",
            onSelect: Application.Selector(this as SessionInfoForm, "handleRefreshToken"),
          }),
          ButtonRow("logout", {
            title: "Logout",
            onSelect: Application.Selector(this as SessionInfoForm, "handleLogout"),
          }),
        ]),
      ];
    }

    if (this.justLoggedOut) {
      return [
        Section("session_status", [
          LabelRow("status", {
            title: "Status",
            value: "Logged out",
          }),
        ]),
      ];
    }

    return [Section("introspect", [LabelRow("logged_out", { title: "Logged out" })])];
  }

  async handleRefreshToken(): Promise<void> {
    const accessToken = getAccessToken();
    if (accessToken && accessToken.refreshToken) {
      try {
        const response = await authEndpointRequest(accessToken.refreshToken);

        // Logout or rotation raced. Abandon this response.
        if (getAccessToken()?.refreshToken !== accessToken.refreshToken) {
          return;
        }

        if (response.access_token && response.refresh_token) {
          saveAccessToken(response.access_token, response.refresh_token);
          this.justLoggedOut = false;
          this.reloadForm();
          this.onAuthChanged();
        } else {
          throw new Error("Invalid response from auth endpoint");
        }
      } catch (e: unknown) {
        if (getAccessToken()?.refreshToken !== accessToken.refreshToken) {
          return;
        }
        // Force logout only on 400/401 or invalid_grant/invalid_token. 429 and 5xx stay.
        const msg = e instanceof Error ? e.message : String(e);
        const isAuthInvalid =
          /status code: 40[01]/.test(msg) || /invalid_grant|invalid_token/i.test(msg);
        if (isAuthInvalid) {
          saveAccessToken(undefined, undefined);
          this.justLoggedOut = true;
          this.reloadForm();
          this.onAuthChanged();
        } else {
          console.log(`[MangaDex] Token refresh transient error: ${msg}`);
          this.reloadForm();
        }
      }
    } else {
      saveAccessToken(undefined, undefined);
      this.justLoggedOut = true;
      this.reloadForm();
      this.onAuthChanged();
    }
  }

  async handleLogout(): Promise<void> {
    saveAccessToken(undefined, undefined);
    this.justLoggedOut = true;
    this.reloadForm();
    this.onAuthChanged();
  }
}
