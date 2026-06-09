import { type TestLogger } from "@paperback/types";

import { MangaDot } from "../MangaDot/main.js";
import sourceInfo from "../MangaDot/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaDot tests", logger);
  registerDefaultTests(suite, MangaDot, sourceInfo);

  await suite.run();
}
