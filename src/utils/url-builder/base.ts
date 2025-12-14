export type QueryValue = string | number | boolean | string[] | object;

class URLBuilder {
  private baseUrl: string;
  private queryParams: Record<string, QueryValue> = {};
  private pathSegments: string[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  protected formatArrayQuery(key: string, value: string[]): string[] {
    return value.length > 0 ? value.map((v) => `${key}[]=${v}`) : [];
  }

  protected formatObjectQuery(key: string, value: object): string[] {
    return Object.entries(value)
      .map(([objKey, objValue]) =>
        objValue !== undefined ? `${key}[${objKey}]=${objValue}` : undefined,
      )
      .filter((x) => x !== undefined);
  }

  protected formatQuery(queryParams: Record<string, QueryValue>): string {
    return Object.entries(queryParams)
      .flatMap(([key, value]) => {
        // Handle string[]
        if (Array.isArray(value)) {
          return this.formatArrayQuery(key, value);
        }

        // Handle objects
        if (typeof value === "object") {
          return this.formatObjectQuery(key, value);
        }

        // Default handling
        return value === "" ? [] : [`${key}=${value}`];
      })
      .join("&");
  }

  build(): string {
    const fullPath = this.pathSegments.length > 0 ? `/${this.pathSegments.join("/")}` : "";

    const queryString = this.formatQuery(this.queryParams);

    if (queryString.length > 0) return `${this.baseUrl}${fullPath}?${queryString}`;

    return `${this.baseUrl}${fullPath}`;
  }

  addPath(segment: string): this {
    this.pathSegments.push(segment.replace(/^\/+|\/+$/g, ""));
    return this;
  }

  addQuery(key: string, value: QueryValue): this {
    this.queryParams[key] = value;
    return this;
  }

  reset(): this {
    this.queryParams = {};
    this.pathSegments = [];
    return this;
  }
}

export { URLBuilder };
