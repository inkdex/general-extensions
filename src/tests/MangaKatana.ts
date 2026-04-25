import { TestSuite, registerDefaultTests } from "./suite.js";
import { MangaKatana } from "../MangaKatana/main.js";
import sourceInfo from "../MangaKatana/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("MangaKatana tests");
  registerDefaultTests(suite, MangaKatana, sourceInfo);

  await suite.run();
}
