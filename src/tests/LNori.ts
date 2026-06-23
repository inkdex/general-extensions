import { type TestLogger } from "@paperback/types";

import { LNori } from "../LNori/main.js";
import sourceInfo from "../LNori/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("LNori tests", logger);
  registerDefaultTests(suite, LNori, sourceInfo);

  await suite.run();
}
