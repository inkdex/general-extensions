/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { DeferredItem, Form, NavigationRow, Section, type FormItemElement } from "@paperback/types";

/**
 * Form for managing website-related settings
 * Provides access to session info and MangaDex status
 */
export class WebsiteSettingsForm extends Form {
  private oAuthState: { value: boolean };
  private createSessionInfoFormCallback: () => Form;
  private createLoginButtonCallback: () => FormItemElement<unknown>;
  private createStatusInfoFormCallback: () => Form;

  constructor(
    oAuthState: { value: boolean },
    createSessionInfoForm: () => Form,
    createLoginButton: () => FormItemElement<unknown>,
    createStatusInfoForm: () => Form,
  ) {
    super();
    this.oAuthState = oAuthState;
    this.createSessionInfoFormCallback = createSessionInfoForm;
    this.createLoginButtonCallback = createLoginButton;
    this.createStatusInfoFormCallback = createStatusInfoForm;
  }

  override getSections() {
    // Dynamically shows either login button or session info based on auth state
    // Also provides navigation to MangaDex status page
    return [
      Section("oAuthSection", [
        DeferredItem(() => {
          if (this.oAuthState.value) {
            return NavigationRow("sessionInfo", {
              title: "Session Info",
              form: this.createSessionInfoFormCallback(),
            }) as FormItemElement<unknown>;
          }
          return this.createLoginButtonCallback();
        }),
        NavigationRow("mangadex_status", {
          title: "MangaDex Status",
          form: this.createStatusInfoFormCallback(),
        }),
      ]),
    ];
  }
}
