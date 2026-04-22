import { Form, NavigationRow, Section, type FormSectionElement } from "@paperback/types";
import { DiscoverSettingsForm } from "./discover";
import { SearchSettingsForm } from "./search";

export class ReadComicOnlineSettingsForm extends Form {
  override getSections(): FormSectionElement<unknown>[] {
    return [
      Section("mainSettings", [
        NavigationRow("search_settings", {
          title: "Search Settings",
          form: new SearchSettingsForm(),
        }),
        NavigationRow("discover_settings", {
          title: "Discover Settings",
          form: new DiscoverSettingsForm(),
        }),
      ]),
    ];
  }
}
