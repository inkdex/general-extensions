import { type TestLogger } from "@paperback/types";

import { MangaDex } from "../MangaDex/main.js";
import sourceInfo from "../MangaDex/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaDex tests", logger);
  registerDefaultTests(suite, MangaDex, sourceInfo);

  await suite.run();
}
