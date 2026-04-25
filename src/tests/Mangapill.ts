import { TestSuite, registerDefaultTests } from "./suite.js";
import { Mangapill } from "../Mangapill/main.js";
import sourceInfo from "../Mangapill/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("Mangapill tests");
  registerDefaultTests(suite, Mangapill, sourceInfo);

  await suite.run();
}
