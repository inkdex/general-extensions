import { TestSuite, registerDefaultTests } from "./suite.js";
import { Mgeko } from "../Mgeko/main.js";
import sourceInfo from "../Mgeko/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("Mgeko tests");
  registerDefaultTests(suite, Mgeko, sourceInfo);

  await suite.run();
}
