import { type TestLogger } from "@paperback/types";

import { Webtoon } from "../Webtoon/main.js";
import sourceInfo from "../Webtoon/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Webtoon tests", logger);
  registerDefaultTests(suite, Webtoon, sourceInfo);

  await suite.run();
}
