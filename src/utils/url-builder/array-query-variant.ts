import { URLBuilder as BaseURLBuilder } from "./base";

class URLBuilder extends BaseURLBuilder {
  protected override formatArrayQuery(key: string, value: string[]): string[] {
    return value.length > 0 ? value.map((v) => `${key}=${v}`) : [];
  }
}

export { URLBuilder };
