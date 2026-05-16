import { type TestLogger } from "@paperback/types";

import { MangaDex } from "../MangaDex/main.js";
import sourceInfo from "../MangaDex/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaDex tests", logger);
  // Pin chapter tests to a popular, safe, completed manga with readable English
  // chapters (JoJo's Bizarre Adventure Part 7)
  registerDefaultTests(suite, MangaDex, sourceInfo, {
    mangaProviding: {
      getMangaDetails: ["b30dfee3-9d1d-4e8d-bfbe-8fcabc3c96f6"],
    },
  });

  await suite.run();
}
