import { type TestLogger } from "@paperback/types";

import { MangaDotNet } from "../MangaDotNet/main.js";
import sourceInfo from "../MangaDotNet/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaDot tests", logger);
  registerDefaultTests(suite, MangaDotNet, sourceInfo);

  await suite.run();
}
