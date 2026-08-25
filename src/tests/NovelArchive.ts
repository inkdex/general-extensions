import { type TestLogger } from "@paperback/types";

import { NovelArchive } from "../NovelArchive/main.js";
import sourceInfo from "../NovelArchive/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("NovelArchive tests", logger);
  registerDefaultTests(suite, NovelArchive, sourceInfo);

  await suite.run();
}
