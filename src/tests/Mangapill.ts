import { type TestLogger } from "@paperback/types";

import { Mangapill } from "../Mangapill/main.js";
import sourceInfo from "../Mangapill/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Mangapill tests", logger);
  registerDefaultTests(suite, Mangapill, sourceInfo);

  await suite.run();
}
