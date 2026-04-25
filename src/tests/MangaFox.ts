import { TestSuite, registerDefaultTests } from "./suite.js";
import { MangaFox } from "../MangaFox/main.js";
import sourceInfo from "../MangaFox/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("MangaFox tests");
  registerDefaultTests(suite, MangaFox, sourceInfo);

  await suite.run();
}
