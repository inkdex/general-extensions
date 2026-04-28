/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

/**
 * ShowcaseForm — demonstrates every available form row/section type.
 * Accessible from the search form via the "UI Elements" navigation row.
 */

import {
  ButtonRow,
  EditSection,
  FlowSection,
  Form,
  InputRow,
  LabelRow,
  NavigationRow,
  Section,
  SelectRow,
  StepperRow,
  ToggleRow,
} from "@paperback/types";
import { State } from "../utils/StateUtil";

// Nested form used by the NavigationRow example
class NestedExampleForm extends Form {
  override getSections() {
    return [
      Section({ id: "nested", header: "Nested Form", footer: "You navigated here from a NavigationRow." }, [
        LabelRow("info", { title: "This is a nested form", subtitle: "Opened via NavigationRow" }),
      ]),
    ];
  }
}

export class ShowcaseForm extends Form {
  // --- States for interactive rows ---
  private toggleState: State<boolean>;
  private selectState: State<string[]>;
  private inputState: State<string>;
  private stepperState: State<number>;
  private listItems: string[];

  constructor() {
    super();
    this.toggleState = new State<boolean>(this, "showcase_toggle", false);
    this.selectState = new State<string[]>(this, "showcase_select", ["option_b"]);
    this.inputState = new State<string>(this, "showcase_input", "");
    this.stepperState = new State<number>(this, "showcase_stepper", 1);
    this.listItems = (Application.getState("showcase_list") as string[] | undefined) ?? ["Item 1", "Item 2", "Item 3"];

    (this as any)["onButtonPress"] = async () => {
      // ButtonRow — no-op demo; just reload to show it responds
      this.reloadForm();
    };

    (this as any)["onListReorder"] = async (src: number, dest: number) => {
      const item = this.listItems.splice(src, 1)[0]!;
      this.listItems.splice(dest, 0, item);
      Application.setState([...this.listItems], "showcase_list");
      this.reloadForm();
    };

    (this as any)["onListDelete"] = async (index: number) => {
      this.listItems.splice(index, 1);
      Application.setState([...this.listItems], "showcase_list");
      this.reloadForm();
    };
  }

  override getSections() {
    return [
      // ── LabelRow ─────────────────────────────────────────────────────────
      Section(
        { id: "label_rows", header: "LabelRow", footer: "Supports title, subtitle, right-side value, and optional onSelect tap handler." },
        [
          LabelRow("label_basic", { title: "Basic label" }),
          LabelRow("label_subtitle", { title: "With subtitle", subtitle: "This is the subtitle text" }),
          LabelRow("label_value", { title: "With value", value: "Right side" }),
          LabelRow("label_full", {
            title: "Tappable label",
            subtitle: "Tap me",
            value: "→",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelect: Application.Selector(this as any, "onButtonPress"),
          }),
        ],
      ),

      // ── ToggleRow ─────────────────────────────────────────────────────────
      Section(
        { id: "toggle_rows", header: "ToggleRow", footer: `Current value: ${this.toggleState.value ? "ON" : "OFF"}` },
        [
          ToggleRow("toggle_basic", {
            title: "Enable feature",
            subtitle: "Tap to toggle on/off",
            value: this.toggleState.value,
            onValueChange: this.toggleState.selector,
          }),
        ],
      ),

      // ── SelectRow ─────────────────────────────────────────────────────────
      Section(
        { id: "select_rows", header: "SelectRow", footer: "Opens a picker sheet. minItemCount / maxItemCount control how many can be chosen." },
        [
          SelectRow("select_single", {
            title: "Single select",
            subtitle: "Pick exactly one",
            value: this.selectState.value,
            options: [
              { id: "option_a", title: "Option A" },
              { id: "option_b", title: "Option B" },
              { id: "option_c", title: "Option C" },
            ],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: this.selectState.selector,
          }),
        ],
      ),

      // ── InputRow ──────────────────────────────────────────────────────────
      Section(
        { id: "input_rows", header: "InputRow", footer: "Free-text entry field." },
        [
          InputRow("input_basic", {
            title: "Text input",
            value: this.inputState.value,
            onValueChange: this.inputState.selector,
          }),
        ],
      ),

      // ── StepperRow ────────────────────────────────────────────────────────
      Section(
        { id: "stepper_rows", header: "StepperRow", footer: `Current value: ${this.stepperState.value}` },
        [
          StepperRow("stepper_basic", {
            title: "Stepper",
            subtitle: "Increment / decrement with +/−",
            value: this.stepperState.value,
            minValue: 1,
            maxValue: 10,
            stepValue: 1,
            loopOver: false,
            onValueChange: this.stepperState.selector,
          }),
        ],
      ),

      // ── ButtonRow ─────────────────────────────────────────────────────────
      Section(
        { id: "button_rows", header: "ButtonRow", footer: "Centered tappable button. No value display — use LabelRow with onSelect if you need a label on the right." },
        [
          ButtonRow("button_basic", {
            title: "Press me",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSelect: Application.Selector(this as any, "onButtonPress"),
          }),
        ],
      ),

      // ── NavigationRow ─────────────────────────────────────────────────────
      Section(
        { id: "nav_rows", header: "NavigationRow", footer: "Pushes a new Form onto the navigation stack." },
        [
          NavigationRow("nav_basic", {
            title: "Navigate to nested form",
            subtitle: "Tap to push",
            value: "→",
            form: new NestedExampleForm(),
          }),
        ],
      ),

      // ── FlowSection ───────────────────────────────────────────────────────
      FlowSection(
        { id: "flow_section", header: "FlowSection", footer: "Items wrap like chips/tags instead of a vertical list." },
        [
          LabelRow("chip_action", { title: "Action" }),
          LabelRow("chip_romance", { title: "Romance" }),
          LabelRow("chip_fantasy", { title: "Fantasy" }),
          LabelRow("chip_comedy", { title: "Comedy" }),
          LabelRow("chip_scifi", { title: "Sci-Fi" }),
          LabelRow("chip_horror", { title: "Horror" }),
          LabelRow("chip_isekai", { title: "Isekai" }),
          LabelRow("chip_thriller", { title: "Thriller" }),
        ],
      ),

      // ── EditSection ───────────────────────────────────────────────────────
      EditSection("edit_section", {
        id: "edit_section",
        header: "EditSection",
        footer: "Supports reorder (drag handle), deletion (swipe), and optional addition button.",
        items: this.listItems.map((item, i) =>
          LabelRow(`list_item_${i}`, { title: item }),
        ),
        allowReorder: true,
        allowDeletion: true,
        allowAddition: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onReorder: Application.Selector(this as any, "onListReorder"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onDeletion: Application.Selector(this as any, "onListDelete"),
      }),
    ];
  }
}
