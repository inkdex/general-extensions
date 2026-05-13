import { type TestLogger } from "@paperback/types";

import { MangaFire } from "../MangaFire/main.js";
import sourceInfo from "../MangaFire/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaFire tests", logger);
  registerDefaultTests(suite, MangaFire, sourceInfo);

  await suite.run();
}
