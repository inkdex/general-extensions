import { TestSuite, registerDefaultTests } from "./suite.js";
import { MangaDex } from "../MangaDex/main.js";
import sourceInfo from "../MangaDex/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("MangaDex tests");
  registerDefaultTests(suite, MangaDex, sourceInfo);

  await suite.run();
}
