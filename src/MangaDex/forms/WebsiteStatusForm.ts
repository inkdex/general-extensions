/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, Section, WebViewRow, type FormSectionElement } from "@paperback/types";
import * as cheerio from "cheerio";

/**
 * Form to display the current MangaDex website status from status.mangadex.org
 * Shows incidents, uptime and service health information
 */
export class WebsiteStatusForm extends Form {
  private statusData: { loading: boolean; content: string[] };

  constructor() {
    super();
    this.statusData = {
      loading: true,
      content: ["Loading status information..."],
    };
    void this.fetchStatusInfo();
  }

  override getSections(): FormSectionElement[] {
    return [
      Section("status_actions", [
        WebViewRow("status_webview", {
          title: "Open Status Page in Browser",
          request: {
            url: "https://status.mangadex.org/",
            method: "GET",
          },
          onComplete: Application.Selector(this as WebsiteStatusForm, "handleWebViewComplete"),
          onCancel: Application.Selector(this as WebsiteStatusForm, "handleWebViewCancel"),
        }),
        ButtonRow("refresh_status", {
          title: "Refresh Status",
          onSelect: Application.Selector(this as WebsiteStatusForm, "handleRefreshStatus"),
        }),
      ]),
      Section(
        {
          id: "status_info",
          footer: this.statusData.content.join("\n"),
        },
        [],
      ),
    ];
  }

  async handleWebViewComplete(): Promise<void> {}

  async handleWebViewCancel(): Promise<void> {}

  async handleRefreshStatus(): Promise<void> {
    this.statusData = {
      loading: true,
      content: ["Loading status information..."],
    };
    this.reloadForm();
    await this.fetchStatusInfo();
  }

  /**
   * Fetches and parses the MangaDex status page
   * Extracts incidents, component status, and uptime information
   */
  async fetchStatusInfo(): Promise<void> {
    try {
      const [_, data] = await Application.scheduleRequest({
        method: "GET",
        url: "https://status.mangadex.org/",
      });

      const $ = cheerio.load(Application.arrayBufferToUTF8String(data), {
        xml: {
          xmlMode: false,
          decodeEntities: false,
        },
      });
      const content: string[] = [];

      const wrapText = (text: string): string[] => {
        const lines: string[] = [];

        const processedText = text.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n\n");

        const withLineBreaks = processedText.replace(/<br\s*\/?>/gi, "\n");

        const paragraphs = withLineBreaks.split("\n");

        for (const paragraph of paragraphs) {
          if (paragraph.trim() === "") {
            lines.push("");
            continue;
          }

          const words = paragraph.trim().split(" ");
          let currentLine = "";

          for (const word of words) {
            currentLine = currentLine ? currentLine + " " + word : word;
          }

          if (currentLine) {
            lines.push(currentLine);
          }
        }

        return lines;
      };

      const convertToLocalTime = (utcTimestamp: string): string => {
        if (!utcTimestamp.includes("UTC")) {
          return utcTimestamp;
        }

        try {
          const timestampWithoutUTC = utcTimestamp.replace(" UTC", "");
          const dateParts = timestampWithoutUTC.split(" - ");

          if (dateParts.length !== 2) return utcTimestamp;

          const datePart = dateParts[0];
          const timePart = dateParts[1];

          const isoString = `${datePart} ${timePart} UTC`;
          const date = new Date(isoString);

          if (isNaN(date.getTime())) {
            return utcTimestamp;
          }

          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffSec = Math.floor(diffMs / 1000);
          const diffMin = Math.floor(diffSec / 60);
          const diffHour = Math.floor(diffMin / 60);

          let timeSince: string;
          if (diffHour > 0) {
            timeSince = `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
          } else if (diffMin > 0) {
            timeSince = `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
          } else {
            timeSince = `${Math.max(0, diffSec)} ${diffSec === 1 ? "second" : "seconds"} ago`;
          }

          const options: Intl.DateTimeFormatOptions = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            timeZoneName: "short",
          };

          return `${date.toLocaleString(undefined, options)} (${timeSince})`;
        } catch {
          return utcTimestamp;
        }
      };

      content.push("===== UNRESOLVED INCIDENTS =====");
      content.push("");
      const unresolvedIncidents = $("div.unresolved-incident");
      if (unresolvedIncidents.length) {
        unresolvedIncidents.each((_, incident) => {
          const title = $(incident).find(".actual-title").text().trim();
          if (title) {
            content.push(`INCIDENT: ${title}`);
          }

          $(incident)
            .find(".update")
            .each((_, update) => {
              const status = $(update).find("strong").text().trim();
              if (status) {
                content.push(`Status: ${status}`);
              }

              const $descSpan = $(update).find("span.whitespace-pre-wrap");
              const descriptionHtml = $descSpan.html() || "";
              const description = descriptionHtml.replace(/<br\s*\/?>/gi, "\n").trim();

              if (description) {
                content.push("");
                const wrappedLines = wrapText(description);
                content.push(...wrappedLines);
              }

              const timestamp = $(update).find("small").text().trim();

              if (timestamp) {
                content.push("");
                const localTime = convertToLocalTime(timestamp);
                content.push(`${localTime}`);
              }
            });
        });
      } else {
        content.push("No unresolved incidents reported.");
      }

      content.push("");
      content.push("===== UPTIME =====");
      content.push("");

      const componentContainers = $("div.component-inner-container");
      if (componentContainers.length) {
        componentContainers.each((_, container) => {
          const $container = $(container);
          const componentName = $container.find("span.name").text().trim();

          if (componentName === "CDN") return;

          const status = $container.find("span.component-status").text().trim();
          const uptime = $container.find('var[data-var="uptime-percent"]').text().trim();

          const formattedName = componentName === "Core" ? "Core CDN" : componentName;

          content.push(`${formattedName}: ${status} (${uptime}% uptime)`);
        });
      } else {
        content.push("No component status information available.");
      }

      content.push("");
      content.push("===== PAST INCIDENTS =====");

      $("div.status-day").each((_, dayElement) => {
        const $day = $(dayElement);
        const dateText = $day.find("div.date").text().trim();

        const hasIncidents = !$day.hasClass("no-incidents");

        if (hasIncidents) {
          content.push("");
          content.push(`DATE: ${dateText}`);

          $day.find("div.incident-container").each((_, incidentElem) => {
            const $incident = $(incidentElem);
            const $title = $incident.find(".incident-title");

            let impactLevel = "unknown";
            if ($title.hasClass("impact-major")) impactLevel = "Major";
            else if ($title.hasClass("impact-critical")) impactLevel = "Critical";
            else if ($title.hasClass("impact-minor")) impactLevel = "Minor";

            const title = $title.text().trim();
            content.push(`${impactLevel} INCIDENT: ${title}`);

            $incident.find(".update").each((_, update) => {
              const status = $(update).find("strong").text().trim();
              if (status) {
                content.push(`Status: ${status}`);
              }

              const $descSpan = $(update).find("span.whitespace-pre-wrap");
              const descriptionHtml = $descSpan.html() || "";
              const description = descriptionHtml.replace(/<br\s*\/?>/gi, "\n").trim();

              if (description) {
                content.push("");
                const wrappedLines = wrapText(description);
                content.push(...wrappedLines);
              }

              const timestamp = $(update).find("small").text().trim();
              if (timestamp) {
                content.push("");
                const localTime = convertToLocalTime(timestamp);
                content.push(`${localTime}`);
                content.push("---");
              }
            });
          });
        } else {
          content.push("");
          content.push(`DATE: ${dateText}`);
          content.push("No incidents reported.");
          content.push("---");
        }
      });

      this.statusData = {
        loading: false,
        content: content.length ? content : ["No status information available."],
      };
    } catch {
      this.statusData = {
        loading: false,
        content: ["Error fetching status."],
      };
    }

    this.reloadForm();
  }
}
