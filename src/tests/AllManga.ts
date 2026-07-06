import { type TestLogger } from "@paperback/types";

import { AllManga } from "../AllManga/main.js";
import sourceInfo from "../AllManga/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("AllManga tests", logger);

  registerDefaultTests(suite, AllManga, sourceInfo);

  await suite.run();
}
