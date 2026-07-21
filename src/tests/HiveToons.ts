import { type TestLogger } from "@paperback/types";

import { HiveToons } from "../HiveToons/main.js";
import sourceInfo from "../HiveToons/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HiveToons tests", logger);
  registerDefaultTests(suite, HiveToons, sourceInfo);

  await suite.run();
}
