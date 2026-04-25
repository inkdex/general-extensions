import { TestSuite, registerDefaultTests } from "./suite.js";
import { ComixTo } from "../ComixTo/main.js";
import sourceInfo from "../ComixTo/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("ComixTo tests");
  registerDefaultTests(suite, ComixTo, sourceInfo);

  await suite.run();
}
