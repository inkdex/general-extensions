import { type TestLogger } from "@paperback/types";

import { Mgeko } from "../Mgeko/main.js";
import sourceInfo from "../Mgeko/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Mgeko tests", logger);
  registerDefaultTests(suite, Mgeko, sourceInfo);

  await suite.run();
}
