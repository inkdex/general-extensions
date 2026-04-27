import { type TestLogger } from "@paperback/types";

import { MangaDemon } from "../MangaDemon/main.js";
import sourceInfo from "../MangaDemon/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaDemon tests", logger);
  registerDefaultTests(suite, MangaDemon, sourceInfo);

  await suite.run();
}
