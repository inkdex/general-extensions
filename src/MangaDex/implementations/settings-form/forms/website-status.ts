/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ButtonRow, Form, Section, type FormSectionElement } from "@paperback/types";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

// Module cache so navigation back and forward does not refetch. Refresh Status bypasses it.
const STATUS_CACHE_TTL_MS = 60 * 1000;
let cachedStatusContent: string[] | null = null;
let cachedStatusFetchedAt = 0;

const LOCAL_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short",
};

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// <br><br> -> blank line (paragraph break), <br> -> newline.
const wrapText = (text: string): string[] =>
  text
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .split("\n")
    .map((paragraph) => paragraph.trim());

const formatTimeSince = (diffSec: number): string => {
  const min = Math.floor(diffSec / 60);
  const hour = Math.floor(min / 60);
  if (hour > 0) return `${hour} ${hour === 1 ? "hour" : "hours"} ago`;
  if (min > 0) return `${min} ${min === 1 ? "minute" : "minutes"} ago`;
  const sec = Math.max(0, diffSec);
  return `${sec} ${sec === 1 ? "second" : "seconds"} ago`;
};

const parseUtc = (datePart: string, timePart: string): Date => {
  const d = datePart.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/);
  const t = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (d && t) {
    const month = MONTH_INDEX[d[1].slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      return new Date(
        Date.UTC(Number(d[3]), month, Number(d[2]), Number(t[1]), Number(t[2]), Number(t[3] ?? 0)),
      );
    }
  }
  return new Date(`${datePart} ${timePart} UTC`);
};

const convertToLocalTime = (utcTimestamp: string): string => {
  if (!utcTimestamp.includes("UTC")) return utcTimestamp;
  try {
    const dateParts = utcTimestamp.replace(" UTC", "").split(" - ");
    if (dateParts.length !== 2) return utcTimestamp;
    const date = parseUtc(dateParts[0], dateParts[1]);
    if (isNaN(date.getTime())) return utcTimestamp;
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    return `${date.toLocaleString(undefined, LOCAL_TIME_OPTIONS)} (${formatTimeSince(diffSec)})`;
  } catch {
    return utcTimestamp;
  }
};

export class WebsiteStatusForm extends Form {
  private statusData: { content: string[] };
  // Only the most recent fetch writes, so a slow load cannot break a refresh.
  private fetchToken = 0;

  constructor() {
    super();
    if (cachedStatusContent && Date.now() - cachedStatusFetchedAt < STATUS_CACHE_TTL_MS) {
      this.statusData = {
        content: cachedStatusContent,
      };
      return;
    }
    this.statusData = {
      content: ["Loading..."],
    };
    this.fetchStatusInfo().catch(() => {});
  }

  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("status_actions", [
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

  async handleRefreshStatus(): Promise<void> {
    // fetchStatusInfo bumps fetchToken itself, which is what invalidates
    // older fetches.
    this.statusData = {
      content: ["Loading..."],
    };
    this.reloadForm();
    await this.fetchStatusInfo();
  }

  async fetchStatusInfo(): Promise<void> {
    const token = ++this.fetchToken;
    const isCurrent = (): boolean => this.fetchToken === token;
    const showError = (message: string): void => {
      if (!isCurrent()) return;
      this.statusData = { content: [message] };
      this.reloadForm();
    };

    try {
      const [response, data] = await Application.scheduleRequest({
        method: "GET",
        url: "https://status.mangadex.org/",
      });

      if (response.status >= 500) {
        showError(`${response.status} MangaDex Status Page Unavailable`);
        return;
      }
      if (response.status >= 400) {
        showError(`${response.status} Status Page Error`);
        return;
      }

      const $ = cheerio.load(Application.arrayBufferToUTF8String(data), {
        xml: {
          xmlMode: false,
          decodeEntities: false,
        },
      });

      if (!$("div.layout-content").length && !$("div.component-inner-container").length) {
        showError("Status page returned an unexpected response");
        return;
      }

      const content: string[] = [];

      const renderUpdate = (update: AnyNode, appendSeparator: boolean): void => {
        const $update = $(update);
        const status = $update.find("strong").text().trim();
        if (status) content.push(`Status: ${status}`);
        const description = ($update.find("span.whitespace-pre-wrap").html() || "")
          .replace(/<br\s*\/?>/gi, "\n")
          .trim();
        if (description) {
          content.push("", ...wrapText(description));
        }
        const timestamp = $update.find("small").text().trim();
        if (timestamp) {
          content.push("", convertToLocalTime(timestamp));
          if (appendSeparator) content.push("---");
        }
      };

      content.push("--- Unresolved Incidents ---");
      content.push("");
      const unresolvedIncidents = $("div.unresolved-incident");
      if (unresolvedIncidents.length) {
        unresolvedIncidents.each((_, incident) => {
          const title = $(incident).find(".actual-title").text().trim();
          if (title) content.push(title);
          $(incident)
            .find(".update")
            .each((_, update) => renderUpdate(update, false));
        });
      } else {
        content.push("None reported");
      }

      content.push("");
      content.push("--- Uptime ---");
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
        content.push("No component data");
      }

      content.push("");
      content.push("--- Past Incidents ---");

      $("div.status-day").each((_, dayElement) => {
        const $day = $(dayElement);
        const dateText = $day.find("div.date").text().trim();

        const hasIncidents = !$day.hasClass("no-incidents");

        if (hasIncidents) {
          content.push("");
          content.push(dateText);

          $day.find("div.incident-container").each((_, incidentElem) => {
            const $incident = $(incidentElem);
            const $title = $incident.find(".incident-title");
            let impactLevel = "unknown";
            if ($title.hasClass("impact-major")) impactLevel = "Major";
            else if ($title.hasClass("impact-critical")) impactLevel = "Critical";
            else if ($title.hasClass("impact-minor")) impactLevel = "Minor";
            content.push(`${impactLevel}: ${$title.text().trim()}`);
            $incident.find(".update").each((_, update) => renderUpdate(update, true));
          });
        } else {
          content.push("");
          content.push(dateText);
          content.push("None");
          content.push("---");
        }
      });

      if (!isCurrent()) return;
      const finalContent = content.length ? content : ["No status data"];
      cachedStatusContent = finalContent;
      cachedStatusFetchedAt = Date.now();
      this.statusData = {
        content: finalContent,
      };
    } catch {
      if (!isCurrent()) return;
      this.statusData = {
        content: ["Error fetching status"],
      };
    }

    this.reloadForm();
  }
}
