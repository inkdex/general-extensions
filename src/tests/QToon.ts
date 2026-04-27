import { type TestLogger } from "@paperback/types";

import { QToon } from "../QToon/main.js";
import sourceInfo from "../QToon/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("QToon tests", logger);
  registerDefaultTests(suite, QToon, sourceInfo);

  await suite.run();
}
