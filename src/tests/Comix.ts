import { type TestLogger } from "@paperback/types";

import { Comix } from "../Comix/main.js";
import sourceInfo from "../Comix/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Comix tests", logger);
  registerDefaultTests(suite, Comix, sourceInfo);

  await suite.run();
}
