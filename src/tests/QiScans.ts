import { type TestLogger } from "@paperback/types";

import { QiScans } from "../QiScans/main.js";
import sourceInfo from "../QiScans/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("QiScans tests", logger);
  registerDefaultTests(suite, QiScans, sourceInfo);

  await suite.run();
}
