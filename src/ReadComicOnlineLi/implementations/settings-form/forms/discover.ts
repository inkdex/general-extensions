import {
  EditSection,
  Form,
  LabelRow,
  Section,
  type FormItemElement,
  type FormSectionElement,
  type SelectorID,
} from "@paperback/types";
import { getDiscoverSectionDefinition } from "../../shared/utils";
import {
  getDiscoverSectionOrder,
  getHiddenDiscoverSections,
  setDiscoverSectionOrder,
  setHiddenDiscoverSections,
} from "./main";
import {
  getCallbackIndexes,
  getCallbackRowId,
  moveSettingId,
  normalizePrefixedSettingId,
  removeSettingId,
} from "../utils";

export class DiscoverSettingsForm extends Form {
  private hiddenSectionRowSelectHandlers: Record<string, { handleSelect: () => Promise<void> }> =
    {};

  override getSections(): FormSectionElement<unknown>[] {
    const visibleSectionIds = this.getVisibleSectionIds();
    const hiddenSectionIds = this.getHiddenSectionIds();
    const sections: FormSectionElement<unknown>[] = [];
    this.hiddenSectionRowSelectHandlers = {};

    if (visibleSectionIds.length > 0) {
      sections.push(
        EditSection("visible-discover-sections", {
          id: "visible-discover-sections",
          header: "Prioritized Sections",
          footer: "Long press to reorder. Swipe to remove",
          items: visibleSectionIds.map((sectionId) => this.sectionRow(sectionId)),
          onDeletion: Application.Selector(
            this as DiscoverSettingsForm,
            "handleVisibleSectionDelete",
          ),
          onReorder: Application.Selector(
            this as DiscoverSettingsForm,
            "handleVisibleSectionReorder",
          ),
        }),
      );
    }

    if (hiddenSectionIds.length > 0) {
      sections.push(
        Section(
          {
            id: "hidden-discover-sections",
            header: "Available Sections",
            footer: "Tap to restore",
          },
          hiddenSectionIds.map((sectionId) => this.hiddenSectionRow(sectionId)),
        ),
      );
    }

    return sections;
  }

  private getVisibleSectionIds(): string[] {
    const hiddenSections = getHiddenDiscoverSections();

    return getDiscoverSectionOrder().filter((sectionId) => !hiddenSections.includes(sectionId));
  }

  private getHiddenSectionIds(): string[] {
    const hiddenSections = getHiddenDiscoverSections();

    return getDiscoverSectionOrder().filter((sectionId) => hiddenSections.includes(sectionId));
  }

  private sectionRow(
    sectionId: string,
    onSelect?: SelectorID<() => Promise<void>>,
  ): FormItemElement<unknown> {
    const section = getDiscoverSectionDefinition(sectionId);

    return LabelRow(`discover-section-${sectionId}`, {
      title: section?.title ?? sectionId,
      onSelect,
    });
  }

  private hiddenSectionRow(sectionId: string): FormItemElement<unknown> {
    const handler = {
      handleSelect: async (): Promise<void> => {
        this.restoreHiddenSection(sectionId);
      },
    };

    this.hiddenSectionRowSelectHandlers[sectionId] = handler;

    return this.sectionRow(sectionId, Application.Selector(handler, "handleSelect"));
  }

  private saveSectionLists(visibleSections: string[], hiddenSections: string[]): void {
    setHiddenDiscoverSections(hiddenSections);
    setDiscoverSectionOrder([...visibleSections, ...hiddenSections]);
    Application.invalidateDiscoverSections();
    this.reloadForm();
  }

  private getSectionIdFromCallbackArgs(args: unknown[]): string | undefined {
    const rowId = getCallbackRowId(args);
    return rowId ? this.normalizeCallbackSectionId(rowId) : undefined;
  }

  private normalizeCallbackSectionId(value: string): string | undefined {
    return normalizePrefixedSettingId(
      value,
      "discover-section-",
      (sectionId) => getDiscoverSectionDefinition(sectionId) !== undefined,
    );
  }

  async handleVisibleSectionReorder(...args: unknown[]): Promise<void> {
    const [sourceIndex, destinationIndex] = getCallbackIndexes(args);
    if (sourceIndex === undefined || destinationIndex === undefined) {
      return;
    }

    const sectionId = this.getSectionIdFromCallbackArgs(args);

    this.saveSectionLists(
      moveSettingId(this.getVisibleSectionIds(), sourceIndex, destinationIndex, sectionId),
      this.getHiddenSectionIds(),
    );
  }

  async handleVisibleSectionDelete(...args: unknown[]): Promise<void> {
    const visibleSections = this.getVisibleSectionIds();
    const [index = -1] = getCallbackIndexes(args);
    const sectionId = this.getSectionIdFromCallbackArgs(args);
    const deletedSectionId = sectionId ?? visibleSections[index];
    if (!deletedSectionId) {
      return;
    }

    removeSettingId(visibleSections, index, deletedSectionId);
    this.saveSectionLists(visibleSections, [...this.getHiddenSectionIds(), deletedSectionId]);
  }

  private restoreHiddenSection(sectionId: string): void {
    const hiddenSections = this.getHiddenSectionIds();
    if (!hiddenSections.includes(sectionId)) {
      return;
    }

    removeSettingId(hiddenSections, hiddenSections.indexOf(sectionId), sectionId);
    this.saveSectionLists([...this.getVisibleSectionIds(), sectionId], hiddenSections);
  }
}
