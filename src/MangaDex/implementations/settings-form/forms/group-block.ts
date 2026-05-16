/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  InputRow,
  LabelRow,
  Section,
  SelectRow,
  ToggleRow,
  type FormSectionElement,
} from "@paperback/types";

import { fetchJSON } from "../../../services/network";
import type { ScanlationGroupItem, ScanlationGroupResponse } from "../../shared/models";
import {
  getBlockedGroups,
  getFuzzyBlockingEnabled,
  getGroupBlockingEnabled,
  saveBlockedGroups,
  setFuzzyBlockingEnabled,
  setGroupBlockingEnabled,
} from "../../shared/state";
import { buildGroupSearchUrl } from "../../shared/urls";

const GROUP_SEARCH_PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_BLOCKED_GROUPS = 25;

export class GroupBlockForm extends Form {
  private searchTerm = "";
  private lastSearchTerm = "";
  private searchResults: ScanlationGroupItem[] = [];
  private currentOffset = 0;
  private isLoading = false;
  private isPaginationLoading = false;
  private hasSearched = false;
  private searchPending = false;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  private groupsToBlock: string[] = [];
  private totalResultsCount = 0;

  override getSections(): FormSectionElement<unknown>[] {
    const groupBlockingEnabled = getGroupBlockingEnabled();
    const blockedGroups = getBlockedGroups();
    const blockedGroupIds = Object.keys(blockedGroups);
    const hasSearchResults = this.searchResults.length > 0;
    const currentPage = Math.floor(this.currentOffset / GROUP_SEARCH_PAGE_SIZE) + 1;
    const totalPages = Math.ceil(this.totalResultsCount / GROUP_SEARCH_PAGE_SIZE) || 1;
    const showNoResults =
      this.hasSearched && !hasSearchResults && !this.isLoading && this.searchTerm.trim().length > 0;
    const isAtMaxGroups = blockedGroupIds.length >= MAX_BLOCKED_GROUPS;
    // Idle (or mid-pagination): result UI and pagination buttons stay live so
    // taps never land on a dead row. Single source for every isHidden below.
    const canPaginate = !this.isLoading || this.isPaginationLoading;
    const showResults = this.hasSearched && hasSearchResults && canPaginate;

    return [
      Section("group_blocking_settings", [
        ToggleRow("group_blocking_enabled", {
          title: "Group Blocking",
          value: groupBlockingEnabled,
          onValueChange: Application.Selector(
            this as GroupBlockForm,
            "handleGroupBlockingEnabledChange",
          ),
        }),
        ToggleRow("fuzzy_blocking_enabled", {
          title: "Fuzzy Matching",
          subtitle: "Catches groups that slip through",
          value: getFuzzyBlockingEnabled(),
          onValueChange: Application.Selector(
            this as GroupBlockForm,
            "handleFuzzyBlockingEnabledChange",
          ),
          isHidden: !groupBlockingEnabled,
        }),
      ]),

      Section(
        {
          id: "blocked_groups",
          header: `Blocked (${blockedGroupIds.length}/${MAX_BLOCKED_GROUPS})`,
        },
        [
          LabelRow("max_groups_warning", {
            title: "⚠️ Limit reached (25)",
            subtitle: "Unblock to add others",
            isHidden: !isAtMaxGroups,
          }),

          SelectRow("blocked_groups_select", {
            title: "Tap to unblock",
            value: blockedGroupIds,
            options: Object.values(blockedGroups)
              .filter((group) => group && group.id && group.attributes?.name)
              .map((group) => ({
                id: group.id,
                title: group.attributes.name,
              }))
              .sort((a, b) => a.title.localeCompare(b.title)),
            minItemCount: 0,
            maxItemCount: MAX_BLOCKED_GROUPS,
            onValueChange: Application.Selector(
              this as GroupBlockForm,
              "handleBlockedGroupsSelection",
            ),
          }),
        ],
      ),

      Section(
        {
          id: "search_groups",
          header: "Search",
        },
        [
          InputRow("search_input", {
            title: "Group name (empty = all)",
            value: this.searchTerm,
            onValueChange: Application.Selector(this as GroupBlockForm, "handleSearchInput"),
          }),

          ButtonRow("clear_button", {
            title: "Clear Search",
            onSelect: Application.Selector(this as GroupBlockForm, "handleClearSearch"),
            // Hide during any load to avoid a dead spot where a tap does nothing.
            isHidden: !(this.hasSearched && !this.isLoading),
          }),

          LabelRow("search_results_info", {
            title: "Results",
            subtitle: `${this.totalResultsCount} groups - page ${currentPage}/${totalPages}`,
            isHidden: !showResults,
          }),

          LabelRow("no_results", {
            title: "No results found",
            isHidden: !(this.hasSearched && showNoResults),
          }),

          LabelRow("loading", {
            title: "Loading...",
            isHidden: !(this.isLoading && !this.isPaginationLoading),
          }),

          SelectRow("search_results", {
            title: this.isPaginationLoading ? "Loading next page..." : "Tap to block",
            value: this.groupsToBlock,
            options: this.searchResults
              .filter(
                (group) =>
                  group && group.id && group.attributes?.name && !(group.id in blockedGroups),
              )
              .map((group) => ({
                id: group.id,
                title: group.attributes.name,
              })),
            minItemCount: 0,
            maxItemCount: GROUP_SEARCH_PAGE_SIZE,
            onValueChange: Application.Selector(
              this as GroupBlockForm,
              "handleSearchResultsSelection",
            ),
            isHidden: !showResults,
          }),
        ],
      ),

      Section("pagination", [
        ButtonRow("next_page", {
          title: "Next",
          onSelect: Application.Selector(this as GroupBlockForm, "handleNextPage"),
          isHidden: !(
            hasSearchResults &&
            this.searchResults.length >= GROUP_SEARCH_PAGE_SIZE &&
            this.currentOffset + this.searchResults.length < this.totalResultsCount &&
            canPaginate
          ),
        }),

        ButtonRow("prev_page", {
          title: "Previous",
          onSelect: Application.Selector(this as GroupBlockForm, "handlePrevPage"),
          isHidden: !(hasSearchResults && this.currentOffset > 0 && canPaginate),
        }),
      ]),

      Section("reset_group_blocks", [
        ButtonRow("reset_group_blocks", {
          title: "Clear All",
          onSelect: Application.Selector(this as GroupBlockForm, "handleResetGroupBlocks"),
        }),
      ]),
    ];
  }

  async handleGroupBlockingEnabledChange(value: boolean): Promise<void> {
    setGroupBlockingEnabled(value);
    this.reloadForm();
  }

  async handleFuzzyBlockingEnabledChange(value: boolean): Promise<void> {
    setFuzzyBlockingEnabled(value);
  }

  async handleBlockedGroupsSelection(value: string[]): Promise<void> {
    const selectedSet = new Set(value);
    const updated = Object.fromEntries(
      Object.entries(getBlockedGroups()).filter(([id]) => selectedSet.has(id)),
    );
    saveBlockedGroups(updated);
    this.reloadForm();
  }

  async handleSearchResultsSelection(value: string[]): Promise<void> {
    const updated = { ...getBlockedGroups() };
    const remainingSlots = Math.max(0, MAX_BLOCKED_GROUPS - Object.keys(updated).length);
    const groupsToProcess = value.slice(0, remainingSlots);

    // Single save per handler invocation.
    for (const groupId of groupsToProcess) {
      const group = this.searchResults.find((g) => g.id === groupId);
      if (group) {
        updated[group.id] = group;
      }
    }
    saveBlockedGroups(updated);

    // Do NOT shrink searchResults. Next Page reads .length and would trap users on page 1.
    this.groupsToBlock = [];

    this.reloadForm();
  }

  async handleResetGroupBlocks(): Promise<void> {
    saveBlockedGroups({});
    this.reloadForm();
  }

  async handleSearchInput(value: string): Promise<void> {
    this.searchTerm = value;

    // Mid fetch: mark pending. finally() flushes on completion.
    if (this.isLoading) {
      this.searchPending = true;
      return;
    }

    // Debounce: one request per typing burst.
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.searchDebounceTimer = undefined;
      void this.flushPendingSearch();
    }, SEARCH_DEBOUNCE_MS);
  }

  private async flushPendingSearch(): Promise<void> {
    // Defer mid pagination. Page handlers reflush via their finally and avoid races.
    if (this.isLoading) {
      this.searchPending = true;
      return;
    }
    while (true) {
      this.searchPending = false;
      const term = this.searchTerm.trim();
      if (this.hasSearched && term === this.lastSearchTerm.trim()) {
        return;
      }
      this.lastSearchTerm = term;
      this.currentOffset = 0;
      this.groupsToBlock = [];
      this.hasSearched = true;
      await this.fetchGroups(0, false);
      if (!this.searchPending) {
        return;
      }
    }
  }

  async handleClearSearch(): Promise<void> {
    if (!this.hasSearched || this.isLoading) {
      return;
    }

    // Cancel any debounced search so a stale term cannot fire after the clear.
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = undefined;
    }
    this.searchPending = false;

    this.searchTerm = "";
    this.hasSearched = false;
    this.searchResults = [];
    this.currentOffset = 0;
    this.totalResultsCount = 0;
    this.groupsToBlock = [];

    this.reloadForm();
  }

  async handlePrevPage(): Promise<void> {
    const hasSearchResults = this.searchResults.length > 0;

    if (!hasSearchResults || this.currentOffset === 0 || this.isLoading) {
      return;
    }

    const newOffset = Math.max(0, this.currentOffset - GROUP_SEARCH_PAGE_SIZE);
    await this.fetchGroups(newOffset, true);
    // Flush pending typed search so stale page results do not sit under a fresh query.
    if (this.searchPending) await this.flushPendingSearch();
  }

  async handleNextPage(): Promise<void> {
    const hasSearchResults = this.searchResults.length > 0;

    if (
      !hasSearchResults ||
      this.searchResults.length < GROUP_SEARCH_PAGE_SIZE ||
      this.currentOffset + this.searchResults.length >= this.totalResultsCount ||
      this.isLoading
    ) {
      return;
    }

    await this.fetchGroups(this.currentOffset + GROUP_SEARCH_PAGE_SIZE, true);
    if (this.searchPending) await this.flushPendingSearch();
  }

  async fetchGroups(offset: number, isPagination: boolean = false): Promise<void> {
    this.isLoading = true;
    this.isPaginationLoading = isPagination;

    if (!isPagination) {
      this.searchResults = [];
      this.totalResultsCount = 0;
    }

    this.reloadForm();

    try {
      const data = await fetchJSON<ScanlationGroupResponse>({
        method: "GET",
        url: buildGroupSearchUrl({
          limit: GROUP_SEARCH_PAGE_SIZE,
          offset,
          name: this.searchTerm,
        }).toString(),
      });

      this.searchResults = Array.isArray(data.data) ? data.data : [];
      this.currentOffset = offset;
      this.totalResultsCount = typeof data.total === "number" ? data.total : 0;
      this.groupsToBlock = [];
    } catch (error) {
      this.searchResults = [];
      this.totalResultsCount = 0;
      console.log(`Error searching groups: ${String(error)}`);
    } finally {
      this.isLoading = false;
      this.isPaginationLoading = false;
      this.reloadForm();
    }
  }
}
