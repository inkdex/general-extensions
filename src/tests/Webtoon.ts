import { TestSuite, registerDefaultTests } from "./suite.js";
import { Webtoon } from "../Webtoon/main.js";
import sourceInfo from "../Webtoon/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("Webtoon tests");
  registerDefaultTests(suite, Webtoon, sourceInfo);

  await suite.run();
}
