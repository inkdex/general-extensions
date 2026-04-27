import { type TestLogger } from "@paperback/types";

import { WeebCentral } from "../WeebCentral/main.js";
import sourceInfo from "../WeebCentral/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("WeebCentral tests", logger);
  registerDefaultTests(suite, WeebCentral, sourceInfo);

  await suite.run();
}
