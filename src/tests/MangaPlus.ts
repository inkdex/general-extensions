import { TestSuite, registerDefaultTests } from "./suite.js";
import { MangaPlus } from "../MangaPlus/main.js";
import sourceInfo from "../MangaPlus/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("MangaPlus tests");
  registerDefaultTests(suite, MangaPlus, sourceInfo);

  await suite.run();
}
