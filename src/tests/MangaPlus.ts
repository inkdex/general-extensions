import { type TestLogger } from "@paperback/types";

import { MangaPlus } from "../MangaPlus/main.js";
import sourceInfo from "../MangaPlus/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaPlus tests", logger);
  registerDefaultTests(suite, MangaPlus, sourceInfo);

  await suite.run();
}
