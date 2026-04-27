import { type TestLogger } from "@paperback/types";

import { MangaFox } from "../MangaFox/main.js";
import sourceInfo from "../MangaFox/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaFox tests", logger);
  registerDefaultTests(suite, MangaFox, sourceInfo);

  await suite.run();
}
