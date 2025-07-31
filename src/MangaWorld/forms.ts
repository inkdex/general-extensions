import {
    Form,
    FormSectionElement,
    NavigationRow,
    Section,
    SelectRow,
} from "@paperback/types";
import { getGenreFilter, getMangaTypeFilter } from "./helpers";

export class Forms extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("playground", [
                NavigationRow("playground", {
                    title: "Contenuti",
                    subtitle: "Impostazioni Contenuti",
                    form: new FilterSettings(),
                }),
            ]),
        ];
    }
}

class State<T> {
    private _value: T;
    public get value(): T {
        return this._value;
    }

    constructor(
        private form: Form,
        value: T,
    ) {
        this._value = value;
    }

    public async updateValue(value: T): Promise<void> {
        this._value = value;
        this.form.reloadForm();
    }
}

class FilterSettings extends Form {
    genres = getGenreFilter().map(({ value, ...rest }) => ({
        title: value,
        ...rest,
    }));

    mangaTypes = getMangaTypeFilter().map(({ value, ...rest }) => ({
        title: value,
        ...rest,
    }));

    override getSections(): FormSectionElement[] {
        return [
            Section(
                {
                    id: "update_settings",
                    footer:
                        "Potrebbero non venir nascosti in tutte le sezioni della home. " +
                        "Tieni presente che verranno rimossi anche dalla ricerca",
                },
                [
                    SelectRow("hide_tags", {
                        title: "Nascondi Generi",
                        subtitle: "Nascondi alcuni Generi",
                        value: this.HideTagsStatusState.value,
                        options: this.genres,
                        minItemCount: 0,
                        maxItemCount: this.genres.length,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleHideTagsStatusChange",
                        ),
                    }),

                    SelectRow("hide_type", {
                        title: "Nascondi Tipologia",
                        subtitle: "Nascondi alcune Tipologie",
                        value: this.HideTypeStatusState.value,
                        options: this.mangaTypes,
                        minItemCount: 0,
                        maxItemCount: this.mangaTypes.length,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleHideTypeStatusChange",
                        ),
                    }),
                ],
            ),
            Section(
                {
                    id: "default_settings",
                    footer: "Cambia i filtri di default della ricerca",
                },
                [
                    SelectRow("def_type", {
                        title: "Tipologia",
                        subtitle: "Tipologia di default",
                        value: this.defTypeStatusState.value,
                        options: this.mangaTypes,
                        minItemCount: 0,
                        maxItemCount: 1,
                        onValueChange: Application.Selector(
                            this as FilterSettings,
                            "handleDefTypeStatusChange",
                        ),
                    }),
                ],
            ),
        ];
    }

    // hide_tags
    getHideTagsStatus(): string[] {
        return (
            (Application.getState("hide_tags") as string[] | undefined) ?? []
        );
    }
    setHideTagsStatus(status: string[]): void {
        Application.setState(status, "hide_tags");
    }
    async handleHideTagsStatusChange(value: string[]): Promise<void> {
        //console.log("handleHideTagsStatusChange " + value.join(", "));
        await this.HideTagsStatusState.updateValue(value);
        this.setHideTagsStatus(value);
        this.reloadForm();
    }
    private HideTagsStatusState = new State<string[]>(
        this,
        this.getHideTagsStatus(),
    );

    // hide_type
    getHideTypeStatus(): string[] {
        return (
            (Application.getState("hide_type") as string[] | undefined) ?? []
        );
    }
    setHideTypeStatus(status: string[]): void {
        Application.setState(status, "hide_type");
    }
    async handleHideTypeStatusChange(value: string[]): Promise<void> {
        //console.log("handleHideTypeStatusChange " + value.join(", "));
        await this.HideTypeStatusState.updateValue(value);
        this.setHideTypeStatus(value);
        this.reloadForm();
    }
    private HideTypeStatusState = new State<string[]>(
        this,
        this.getHideTypeStatus(),
    );

    // def_type
    getDefTypeStatus(): string[] {
        return (Application.getState("def_type") as string[] | undefined) ?? [];
    }
    setDefTypeStatus(status: string[]): void {
        Application.setState(status, "def_type");
    }
    async handleDefTypeStatusChange(value: string[]): Promise<void> {
        await this.defTypeStatusState.updateValue(value);
        this.setDefTypeStatus(value);
        this.reloadForm();
        Application.invalidateSearchFilters();
    }
    private defTypeStatusState = new State<string[]>(
        this,
        this.getDefTypeStatus(),
    );
}
