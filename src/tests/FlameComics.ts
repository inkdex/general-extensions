import { type TestLogger } from "@paperback/types";

import { FlameComics } from "../FlameComics/main.js";
import sourceInfo from "../FlameComics/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("FlameComics tests", logger);
  registerDefaultTests(suite, FlameComics, sourceInfo);

  await suite.run();
}
