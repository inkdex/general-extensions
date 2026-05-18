import { type TestLogger } from "@paperback/types";

import { PunkRecords } from "../PunkRecords/main.js";
import sourceInfo from "../PunkRecords/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("PunkRecords tests", logger);
  registerDefaultTests(suite, PunkRecords, sourceInfo);

  await suite.run();
}
