import { type TestLogger } from "@paperback/types";

import { Mangaball } from "../Mangaball/main.js";
import sourceInfo from "../Mangaball/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Mangaball tests", logger);
  registerDefaultTests(suite, Mangaball, sourceInfo);

  await suite.run();
}
