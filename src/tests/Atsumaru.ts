import { type TestLogger } from "@paperback/types";

import { Atsumaru } from "../Atsumaru/main.js";
import sourceInfo from "../Atsumaru/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Atsumaru tests", logger);
  registerDefaultTests(suite, Atsumaru, sourceInfo);

  await suite.run();
}
