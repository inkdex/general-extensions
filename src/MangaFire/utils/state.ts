import { Form } from "@paperback/types";

/**
 * State management utility for form values
 * Handles persistence and form updating
 */
export class State<T> {
    private _value: T;

    public get value(): T {
        return this._value;
    }

    /**
     * Returns selector for binding to form elements
     */
    public get selector(): SelectorID<(value: T) => Promise<void>> {
        return Application.Selector(this as State<T>, "updateValue");
    }

    constructor(
        private form: Form,
        private persistKey: string,
        value: T,
    ) {
        this._value = value;
    }

    /**
     * Updates state value, persists it, and refreshes the form
     */
    public async updateValue(value: T): Promise<void> {
        this._value = value;
        Application.setState(value, this.persistKey);
        this.form.reloadForm();
    }
}
