import { type TestLogger } from "@paperback/types";

import { MangaKatana } from "../MangaKatana/main.js";
import sourceInfo from "../MangaKatana/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaKatana tests", logger);
  registerDefaultTests(suite, MangaKatana, sourceInfo);

  await suite.run();
}
