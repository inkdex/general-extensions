import { ButtonRow, Form, LabelRow, Section, type FormSectionElement } from "@paperback/types";
import { authEndpointRequest, getAccessToken, saveAccessToken } from "../MangaDexSettings";

interface OAuthState {
  value: boolean;
  updateValue: (value: boolean) => Promise<void>;
}

/**
 * Form for displaying and managing the user's session information
 * Shows token details and provides logout/refresh functionality
 */
export class SessionInfoForm extends Form {
  private oAuthState: OAuthState;
  private sessionState: boolean;

  constructor(oAuthState: OAuthState) {
    super();
    this.oAuthState = oAuthState;
    this.sessionState = oAuthState.value;
  }

  override getSections(): FormSectionElement[] {
    if (!this.sessionState) {
      return [
        Section("session_status", [
          LabelRow("status", {
            title: "Status",
            value: "Successfully logged out",
          }),
        ]),
      ];
    }

    const accessToken = getAccessToken();
    if (!accessToken) {
      return [Section("introspect", [LabelRow("logged_out", { title: "LOGGED OUT" })])];
    }

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

  /**
   * Refreshes the user's access token
   */
  async handleRefreshToken(): Promise<void> {
    const accessToken = getAccessToken();
    if (accessToken && accessToken.refreshToken) {
      try {
        const response = await authEndpointRequest(accessToken.refreshToken);

        if (response.access_token && response.refresh_token) {
          saveAccessToken(response.access_token, response.refresh_token);
          await this.oAuthState.updateValue(true);
          this.sessionState = true;
          this.reloadForm();
        } else {
          throw new Error("Invalid response from auth endpoint");
        }
      } catch {
        saveAccessToken(undefined, undefined);
        await this.oAuthState.updateValue(false);
        this.sessionState = false;
        this.reloadForm();
      }
    } else {
      saveAccessToken(undefined, undefined);
      await this.oAuthState.updateValue(false);
      this.sessionState = false;
      this.reloadForm();
    }
  }

  /**
   * Logs the user out by clearing tokens, no need to call the auth endpoint
   */
  async handleLogout(): Promise<void> {
    saveAccessToken(undefined, undefined);
    await this.oAuthState.updateValue(false);
    this.sessionState = false;
    this.reloadForm();
  }
}
