import {
  ButtonRow,
  Form,
  InputRow,
  LabelRow,
  Section,
  SelectRow,
  ToggleRow,
  URL,
  type FormSectionElement,
} from "@paperback/types";
import {
  blockGroup,
  getBlockedGroups,
  getFuzzyBlockingEnabled,
  getGroupBlockingEnabled,
  saveBlockedGroups,
  setFuzzyBlockingEnabled,
  setGroupBlockingEnabled,
  unblockGroup,
} from "../MangaDexSettings";
import { MANGADEX_API } from "../utils/CommonUtil";
import { State } from "../utils/StateUtil";

const GROUP_SEARCH_PAGE_SIZE = 100;

/**
 * Form for managing blocked scanlation groups
 * Allows searching, blocking and unblocking groups
 */
export class GroupBlockForm extends Form {
  // Search state
  private searchTerm = "";
  private lastSearchTerm = "";
  private searchResults: MangaDex.ScanlationGroupItem[] = [];
  private currentOffset = 0;
  private isLoading = false;
  private isPaginationLoading = false;
  private hasSearched = false;

  // Blocking state
  private blockedGroups: Record<string, MangaDex.ScanlationGroupItem>;
  private groupsToBlock: string[] = [];
  private groupsToUnblock: string[] = [];
  private totalResultsCount = 0;

  // Settings state
  private groupBlockingEnabledState = new State<boolean>(
    this,
    "group_blocking_enabled",
    getGroupBlockingEnabled(),
  );
  private fuzzyBlockingEnabledState = new State<boolean>(
    this,
    "fuzzy_blocking_enabled",
    getFuzzyBlockingEnabled(),
  );

  private onBlockedGroupsChange?: (
    groups: Record<string, MangaDex.ScanlationGroupItem>,
  ) => Promise<void>;

  constructor(
    onBlockedGroupsChange?: (groups: Record<string, MangaDex.ScanlationGroupItem>) => Promise<void>,
  ) {
    super();
    this.blockedGroups = getBlockedGroups();
    this.groupsToUnblock = Object.keys(this.blockedGroups);
    this.onBlockedGroupsChange = onBlockedGroupsChange;
  }

  override getSections(): FormSectionElement[] {
    const hasSearchResults = this.searchResults.length > 0;
    const blockedGroupIds = Object.keys(this.blockedGroups);
    const currentPage = Math.floor(this.currentOffset / GROUP_SEARCH_PAGE_SIZE) + 1;
    const totalPages = Math.ceil(this.totalResultsCount / GROUP_SEARCH_PAGE_SIZE) || 1;
    const showNoResults =
      this.hasSearched && !hasSearchResults && !this.isLoading && this.searchTerm.trim().length > 0;
    const isAtMaxGroups = blockedGroupIds.length >= 25;

    return [
      Section("group_blocking_settings", [
        ToggleRow("group_blocking_enabled", {
          title: "Enable Group Blocking",
          value: this.groupBlockingEnabledState.value,
          onValueChange: Application.Selector(
            this as GroupBlockForm,
            "handleGroupBlockingEnabledChange",
          ),
        }),
        ToggleRow("fuzzy_blocking_enabled", {
          title: "Enable Fuzzy Matching",
          subtitle: "If some groups are not being blocked, enable this for better matching",
          value: this.fuzzyBlockingEnabledState.value,
          onValueChange: Application.Selector(
            this as GroupBlockForm,
            "handleFuzzyBlockingEnabledChange",
          ),
          isHidden: !this.groupBlockingEnabledState.value,
        }),
      ]),

      Section(
        {
          id: "blocked_groups",
          header: `Currently Blocked Groups ${blockedGroupIds.length}/25`,
        },
        [
          LabelRow("max_groups_warning", {
            title: "⚠️ Maximum limit reached (25 groups)",
            subtitle: "Unblock some groups to add new ones",
            isHidden: !isAtMaxGroups,
          }),

          SelectRow("blocked_groups_select", {
            title: "Select to unblock",
            value: this.groupsToUnblock,
            options: Object.values(this.blockedGroups).map((group) => ({
              id: group.id,
              title: group.attributes.name,
            })),
            minItemCount: 0,
            maxItemCount: 25,
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
          header: `Search for Groups to Block`,
        },
        [
          InputRow("search_input", {
            title: "Enter group name or leave empty to search all",
            value: this.searchTerm,
            onValueChange: Application.Selector(this as GroupBlockForm, "handleSearchInput"),
          }),

          ButtonRow("clear_button", {
            title: "Clear Search",
            onSelect: Application.Selector(this as GroupBlockForm, "handleClearSearch"),
            isHidden: !(this.hasSearched && (!this.isLoading || this.isPaginationLoading)),
          }),

          LabelRow("search_results_info", {
            title: "Results",
            subtitle: `Found ${this.totalResultsCount} groups (Page ${currentPage} of ${totalPages})`,
            isHidden: !(
              this.hasSearched &&
              hasSearchResults &&
              (!this.isLoading || this.isPaginationLoading)
            ),
          }),

          LabelRow("no_results", {
            title: "No results found",
            isHidden: !(this.hasSearched && showNoResults),
          }),

          LabelRow("loading", {
            title: "Loading results...",
            isHidden: !(this.isLoading && !this.isPaginationLoading),
          }),

          SelectRow("search_results", {
            title: this.isPaginationLoading ? "Loading next page..." : "Select groups to block",
            value: this.groupsToBlock,
            options: this.searchResults
              .filter((group) => !(group.id in this.blockedGroups))
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
            isHidden: !(
              this.hasSearched &&
              hasSearchResults &&
              (!this.isLoading || this.isPaginationLoading)
            ),
          }),
        ],
      ),

      Section("pagination", [
        ButtonRow("next_page", {
          title: "Next Page",
          onSelect: Application.Selector(this as GroupBlockForm, "handleNextPage"),
          isHidden: !(
            hasSearchResults &&
            this.searchResults.length >= GROUP_SEARCH_PAGE_SIZE &&
            (!this.isLoading || this.isPaginationLoading)
          ),
        }),

        ButtonRow("prev_page", {
          title: "Previous Page",
          onSelect: Application.Selector(this as GroupBlockForm, "handlePrevPage"),
          isHidden: !(
            hasSearchResults &&
            this.currentOffset > 0 &&
            (!this.isLoading || this.isPaginationLoading)
          ),
        }),
      ]),

      Section("reset_group_blocks", [
        ButtonRow("reset_group_blocks", {
          title: "Reset Group Block Settings",
          onSelect: Application.Selector(this as GroupBlockForm, "handleResetGroupBlocks"),
        }),
      ]),
    ];
  }

  // Toggle settings handlers
  async handleGroupBlockingEnabledChange(value: boolean): Promise<void> {
    await this.groupBlockingEnabledState.updateValue(value);
    setGroupBlockingEnabled(value);
    this.reloadForm();
  }

  async handleFuzzyBlockingEnabledChange(value: boolean): Promise<void> {
    await this.fuzzyBlockingEnabledState.updateValue(value);
    setFuzzyBlockingEnabled(value);
    this.reloadForm();
  }

  // Group blocking/unblocking handlers
  async handleBlockedGroupsSelection(value: string[]): Promise<void> {
    const groupsToUnblock = this.groupsToUnblock.filter((groupId) => !value.includes(groupId));

    for (const groupId of groupsToUnblock) {
      unblockGroup(groupId);
    }

    this.blockedGroups = getBlockedGroups();
    this.groupsToUnblock = value;

    if (this.onBlockedGroupsChange) {
      await this.onBlockedGroupsChange(this.blockedGroups);
    }

    this.reloadForm();
  }

  async handleSearchResultsSelection(value: string[]): Promise<void> {
    const newSelectedGroups = value.filter((groupId) => !this.groupsToBlock.includes(groupId));

    const currentBlockedCount = Object.keys(this.blockedGroups).length;

    const remainingSlots = Math.max(0, 25 - currentBlockedCount);

    const groupsToProcess = newSelectedGroups.slice(0, remainingSlots);

    for (const groupId of groupsToProcess) {
      const group = this.searchResults.find((g) => g.id === groupId);
      if (group) {
        blockGroup(group);
      }
    }

    this.blockedGroups = getBlockedGroups();

    this.groupsToUnblock = Object.keys(this.blockedGroups);

    this.searchResults = this.searchResults.filter((group) => !(group.id in this.blockedGroups));
    this.groupsToBlock = [];

    if (this.onBlockedGroupsChange) {
      await this.onBlockedGroupsChange(this.blockedGroups);
    }

    this.reloadForm();
  }

  async handleResetGroupBlocks(): Promise<void> {
    saveBlockedGroups({});

    this.blockedGroups = {};
    this.groupsToUnblock = [];

    if (this.onBlockedGroupsChange) {
      await this.onBlockedGroupsChange({});
    }

    this.reloadForm();
  }

  // Search handlers
  async handleSearchInput(value: string): Promise<void> {
    this.searchTerm = value;

    if (this.isLoading || (this.hasSearched && value.trim() === this.lastSearchTerm.trim())) {
      return;
    }

    this.lastSearchTerm = value.trim();
    this.currentOffset = 0;
    this.groupsToBlock = [];

    this.hasSearched = true;
    await this.fetchGroups(0, false);
  }

  async handleClearSearch(): Promise<void> {
    if (!this.hasSearched || this.isLoading) {
      return;
    }

    this.searchTerm = "";
    this.hasSearched = false;
    this.searchResults = [];
    this.currentOffset = 0;
    this.totalResultsCount = 0;
    this.groupsToBlock = [];

    this.reloadForm();
  }

  // Pagination handlers
  async handlePrevPage(): Promise<void> {
    const hasSearchResults = this.searchResults.length > 0;

    if (!hasSearchResults || this.currentOffset === 0 || this.isLoading) {
      return;
    }

    const newOffset = Math.max(0, this.currentOffset - GROUP_SEARCH_PAGE_SIZE);
    await this.fetchGroups(newOffset, true);
  }

  async handleNextPage(): Promise<void> {
    const hasSearchResults = this.searchResults.length > 0;

    if (!hasSearchResults || this.searchResults.length < GROUP_SEARCH_PAGE_SIZE || this.isLoading) {
      return;
    }

    await this.fetchGroups(this.currentOffset + GROUP_SEARCH_PAGE_SIZE, true);
  }

  /**
   * Fetches groups from the MangaDex API based on search criteria
   */
  async fetchGroups(offset: number, isPagination: boolean = false): Promise<void> {
    this.isLoading = true;
    this.isPaginationLoading = isPagination;

    if (!isPagination) {
      this.searchResults = [];
      this.totalResultsCount = 0;
    }

    this.reloadForm();

    try {
      const url = new URL(MANGADEX_API)
        .addPathComponent("group")
        .setQueryItem("limit", GROUP_SEARCH_PAGE_SIZE.toString())
        .setQueryItem("offset", offset.toString());

      if (this.searchTerm.trim() !== "") {
        url.setQueryItem("name", this.searchTerm.trim());
      }

      const [response, buffer] = await Application.scheduleRequest({
        method: "GET",
        url: url.toString(),
      });

      if (response.status !== 200) {
        throw new Error(`Failed to fetch groups: ${response.status}`);
      }

      const data = JSON.parse(
        Application.arrayBufferToUTF8String(buffer),
      ) as MangaDex.ScanlationGroupResponse;

      this.searchResults = data.data;
      this.currentOffset = offset;
      this.totalResultsCount = data.total;
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
