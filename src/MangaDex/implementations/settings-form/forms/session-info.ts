/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, LabelRow, Section, type FormSectionElement } from "@paperback/types";

import { getAccessToken, refreshSession, saveAccessToken } from "../../shared/state";

export class SessionInfoForm extends Form {
  // Temporary "Successfully logged out" view. Cleared by any render with a valid token.
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
    if (!accessToken || !accessToken.refreshToken) {
      saveAccessToken(undefined, undefined);
      this.justLoggedOut = true;
      this.reloadForm();
      this.onAuthChanged();
      return;
    }
    const outcome = await refreshSession(accessToken.refreshToken);
    switch (outcome.kind) {
      case "rotated":
        this.justLoggedOut = false;
        this.reloadForm();
        this.onAuthChanged();
        return;
      case "racedRotation":
      case "racedLogout":
        // Another caller already handled this token. The next form render reads the truth.
        return;
      case "loggedOut":
        this.justLoggedOut = true;
        this.reloadForm();
        this.onAuthChanged();
        return;
      case "transient":
        console.log(`[MangaDex] Token refresh transient error: ${outcome.message}`);
        this.reloadForm();
        return;
    }
  }

  async handleLogout(): Promise<void> {
    saveAccessToken(undefined, undefined);
    this.justLoggedOut = true;
    this.reloadForm();
    this.onAuthChanged();
  }
}
