import { type TestLogger } from "@paperback/types";

import { ComixTo } from "../ComixTo/main.js";
import sourceInfo from "../ComixTo/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ComixTo tests", logger);
  registerDefaultTests(suite, ComixTo, sourceInfo);

  await suite.run();
}
