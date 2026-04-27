import { type TestLogger } from "@paperback/types";

import { MangaTaro } from "../MangaTaro/main.js";
import sourceInfo from "../MangaTaro/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaTaro tests", logger);
  registerDefaultTests(suite, MangaTaro, sourceInfo);

  await suite.run();
}
