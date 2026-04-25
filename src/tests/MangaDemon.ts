import { TestSuite, registerDefaultTests } from "./suite.js";
import { MangaDemon } from "../MangaDemon/main.js";
import sourceInfo from "../MangaDemon/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("MangaDemon tests");
  registerDefaultTests(suite, MangaDemon, sourceInfo);

  await suite.run();
}
